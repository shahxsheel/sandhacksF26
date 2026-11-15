"use client";

// Presenter-only slide-over that drives the staged scenario. It is never part of the operator console itself: every
// staged report goes through the real POST /api/reports pipeline (upload checks, transcription, Gemini screening or
// routing), and the console only learns about it from the returned state, like any other report.

import React, { useEffect, useRef, useState } from "react";
import type { DemoState, IncidentScene, WitnessReport } from "../lib/types";
import { SIMULATION_PRESETS, type SimulationPreset } from "../lib/simulation-presets";
import { submitReport, ApiError } from "./api";
import { ArrowRight, FileText, Mic, Radio, ShieldAlert, ShieldCheck, X } from "lucide-react";

export interface PresenterPanelProps {
  /** Coordinator state of the incident currently on screen. */
  state: DemoState;
  open: boolean;
  onClose: () => void;
  /** Called with fresh state after each successful staged submission. */
  onStateUpdated: (next: DemoState) => void;
  /** Switch the console to another incident (e.g. after a report is routed there). */
  onSelectIncident: (incidentId: string) => void;
}

const SCENE_LABEL: Record<IncidentScene, string> = {
  "canyon-fire": "Canyon fire",
  "street-flood": "Underpass flood",
  "bluff-collapse": "Bluff collapse",
};

/** Pause between staged arrivals in "Send all", so reports land in the feed one at a time. */
const ARRIVAL_GAP_MS = 2500;

interface Sent {
  report: WitnessReport;
  incidentId: string;
}
type Status = { kind: "sending" } | { kind: "error"; message: string };

async function fetchAsFile(src: string, name: string, type: string): Promise<File> {
  const res = await fetch(src);
  if (!res.ok) throw new Error("Staged media could not be loaded.");
  return new File([await res.blob()], name, { type });
}

async function buildForm(incidentId: string, preset: SimulationPreset): Promise<FormData> {
  const form = new FormData();
  form.append("incidentId", incidentId);
  form.append("name", preset.name);
  form.append("location", preset.location);
  form.append("text", preset.text);
  form.append("consent", "true");
  if (preset.channel === "intake") form.append("route", "auto");
  if (preset.photo) form.append("photo", await fetchAsFile(preset.photo.src, `${preset.id}.jpg`, "image/jpeg"));
  if (preset.audio) form.append("audio", await fetchAsFile(preset.audio.src, `${preset.id}.mp3`, "audio/mpeg"));
  return form;
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function PresenterPanel({ state, open, onClose, onStateUpdated, onSelectIncident }: PresenterPanelProps) {
  const [sent, setSent] = useState<Record<string, Sent>>({});
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [running, setRunning] = useState<"witness" | "intake" | null>(null);
  const [follow, setFollow] = useState(true);
  const stateRef = useRef(state);
  stateRef.current = state;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const incidents = state.incidents ?? [];
  const byScene = (scene: IncidentScene) => incidents.find((i) => i.scene === scene);
  const byId = (id: string) => incidents.find((i) => i.id === id);
  const fireId = byScene("canyon-fire")?.id ?? state.incident.id;
  const busy = running !== null || Object.values(status).some((s) => s.kind === "sending");

  /** A witness-link preset already in this workspace (survives a page refresh while the fire is on screen). */
  const recorded = (preset: SimulationPreset): Sent | undefined => {
    if (sent[preset.id]) return sent[preset.id];
    if (preset.channel !== "witness" || state.incident.id !== fireId) return undefined;
    const report = [...state.reports, ...(state.withheldReports ?? [])].find((r) => !r.isSample && r.name === preset.name && r.location === preset.location);
    return report ? { report, incidentId: fireId } : undefined;
  };

  const send = async (preset: SimulationPreset): Promise<boolean> => {
    const viewing = stateRef.current.incident.id;
    const target = preset.channel === "witness" ? fireId : viewing;
    setStatus((prev) => ({ ...prev, [preset.id]: { kind: "sending" } }));
    try {
      const result = await submitReport(await buildForm(target, preset));
      setStatus((prev) => {
        const next = { ...prev };
        delete next[preset.id];
        return next;
      });
      if (result.report) setSent((prev) => ({ ...prev, [preset.id]: { report: result.report!, incidentId: result.routedIncidentId ?? target } }));
      const landed = result.routedIncidentId ?? target;
      if (preset.channel === "witness" && target !== viewing) onSelectIncident(target);
      else if (preset.channel === "intake" && follow && result.routedIncidentId && landed !== viewing) onSelectIncident(landed);
      else if (result.state) onStateUpdated(result.state);
      return true;
    } catch (err: unknown) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "The staged report could not be sent.";
      setStatus((prev) => ({ ...prev, [preset.id]: { kind: "error", message } }));
      return false;
    }
  };

  const sendAll = async (channel: "witness" | "intake") => {
    setRunning(channel);
    let first = true;
    for (const preset of SIMULATION_PRESETS.filter((p) => p.channel === channel)) {
      if (recorded(preset)) continue;
      if (!first) await pause(ARRIVAL_GAP_MS);
      first = false;
      if (!(await send(preset))) break;
    }
    setRunning(null);
  };

  const group = (channel: "witness" | "intake") => SIMULATION_PRESETS.filter((p) => p.channel === channel);
  const pending = (channel: "witness" | "intake") => group(channel).filter((p) => !recorded(p)).length;
  const fire = byScene("canyon-fire");

  const row = (preset: SimulationPreset) => {
    const done = recorded(preset);
    const s = status[preset.id];
    const expected =
      preset.channel === "witness"
        ? preset.expected === "flagged" ? "Should be held" : "Should be accepted"
        : preset.expectedScene ? `Should route → ${SCENE_LABEL[preset.expectedScene]}` : "Should be held (no match)";
    return (
      <li key={preset.id} className="pp-row">
        <div className="pp-thumb">
          {preset.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preset.photo.src} alt="" />
          ) : preset.audio ? (
            <Mic size={18} aria-hidden="true" />
          ) : (
            <FileText size={18} aria-hidden="true" />
          )}
        </div>
        <div className="pp-body">
          <div className="pp-title-row">
            <span className="pp-title">{preset.label}</span>
            <span className={`pp-expect${preset.expected === "flagged" ? " is-held" : ""}`}>{expected}</span>
          </div>
          <p className="pp-meta">
            {preset.name} · {preset.location}
          </p>
          {preset.text && <p className="pp-quote">“{preset.text}”</p>}
          {preset.audio && <audio className="pp-audio" controls preload="none" src={preset.audio.src} aria-label={`Preview voice note: ${preset.label}`} />}
          {done ? (
            <Result sent={done} label={byId(done.incidentId)} onView={() => onSelectIncident(done.incidentId)} viewing={state.incident.id} />
          ) : (
            <>
              {s?.kind === "error" && (
                <p className="pp-result is-error" role="alert">
                  {s.message}
                </p>
              )}
              <button type="button" className="pp-send" onClick={() => void send(preset)} disabled={busy}>
                {s?.kind === "sending" ? (preset.channel === "intake" ? "Screening and routing…" : "Uploading and screening…") : "Send"}
              </button>
            </>
          )}
        </div>
      </li>
    );
  };

  return (
    <aside className={`pp${open ? " is-open" : ""}`} aria-label="Presenter controls" aria-hidden={!open} inert={!open}>
      <header className="pp-head">
        <div>
          <p className="pp-kicker">Presenter · training exercise</p>
          <h2 className="pp-heading">Staged inputs</h2>
        </div>
        <button ref={closeRef} type="button" className="pp-close" onClick={onClose} aria-label="Close presenter controls">
          <X size={18} />
        </button>
      </header>
      <p className="pp-note">
        Each input goes through the live pipeline. Operators never see this panel. <kbd>Shift</kbd>+<kbd>S</kbd> toggles it.
      </p>

      <section className="pp-section">
        <div className="pp-section-head">
          <div>
            <h3 className="pp-section-title">
              <ShieldCheck size={15} aria-hidden="true" /> Witness link{fire ? ` · ${fire.code}` : ""}
            </h3>
            <p className="pp-section-sub">Sent to the canyon fire&apos;s witness link. Gemini screens each one.</p>
          </div>
          <button type="button" className="pp-all" onClick={() => void sendAll("witness")} disabled={busy || pending("witness") === 0}>
            {running === "witness" ? "Sending…" : pending("witness") === 0 ? "All sent" : `Send all ${pending("witness")}`}
          </button>
        </div>
        <ul className="pp-list">{group("witness").map(row)}</ul>
      </section>

      <section className="pp-section">
        <div className="pp-section-head">
          <div>
            <h3 className="pp-section-title">
              <Radio size={15} aria-hidden="true" /> Dispatch intake · Gemini routes
            </h3>
            <p className="pp-section-sub">Unrouted reports while {incidents.length || 1} incidents are active. Gemini picks the incident or holds the report.</p>
          </div>
          <button type="button" className="pp-all" onClick={() => void sendAll("intake")} disabled={busy || pending("intake") === 0}>
            {running === "intake" ? "Sending…" : pending("intake") === 0 ? "All sent" : `Send all ${pending("intake")}`}
          </button>
        </div>
        <label className="pp-follow">
          <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} /> Follow routed reports on the console
        </label>
        <ul className="pp-list">{group("intake").map(row)}</ul>
      </section>

      <p className="pp-credits">
        Photos: real archival San Diego-area photos from Wikimedia Commons, standing in for witness uploads; they do not show these staged
        incidents. Voices are synthetic. <a href="/sim/CREDITS.md" target="_blank" rel="noreferrer">Credits</a>
      </p>

      <style jsx global>{`
        .pp {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: 80;
          width: min(460px, 100vw);
          overflow-y: auto;
          background: var(--cream);
          border-left: 1px solid var(--spruce-main);
          padding: 20px 20px 32px;
          transform: translateX(100%);
          visibility: hidden;
          transition: transform 0.22s ease, visibility 0s linear 0.22s;
          font-size: 0.8125rem;
          color: var(--text-main);
        }
        .pp.is-open {
          transform: none;
          visibility: visible;
          transition: transform 0.22s ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .pp,
          .pp.is-open {
            transition: none;
          }
        }
        .pp-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .pp-kicker {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.6875rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--spruce-muted);
        }
        .pp-heading {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--spruce-main);
          margin-top: 2px;
        }
        .pp-close {
          border: 1px solid var(--cream-hairline-strong);
          background: var(--cream-card);
          border-radius: 999px;
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--spruce-main);
          cursor: pointer;
        }
        .pp-note {
          margin-top: 8px;
          color: var(--text-muted);
        }
        .pp-note kbd {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.6875rem;
          border: 1px solid var(--cream-hairline-strong);
          border-radius: 2px;
          padding: 0 4px;
          background: var(--cream-card);
        }
        .pp-section {
          margin-top: 20px;
          border-top: 1px solid var(--cream-hairline-strong);
          padding-top: 14px;
        }
        .pp-section-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .pp-section-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--spruce-main);
        }
        .pp-section-sub {
          color: var(--text-muted);
          margin-top: 2px;
        }
        .pp-all,
        .pp-send {
          flex-shrink: 0;
          border-radius: 999px;
          border: 1px solid var(--spruce-main);
          background: var(--spruce-main);
          color: var(--cream);
          font: inherit;
          font-weight: 500;
          padding: 6px 14px;
          cursor: pointer;
        }
        .pp-send {
          background: transparent;
          color: var(--spruce-main);
          margin-top: 8px;
          padding: 4px 12px;
        }
        .pp-all:disabled,
        .pp-send:disabled {
          opacity: 0.5;
          cursor: default;
        }
        .pp-all:focus-visible,
        .pp-send:focus-visible,
        .pp-close:focus-visible {
          outline: none;
          box-shadow: 0 0 0 4px var(--accent-lime-glow);
        }
        .pp-follow {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
          color: var(--spruce-main);
        }
        .pp-list {
          list-style: none;
          margin: 10px 0 0;
          padding: 0;
          display: flex;
          flex-direction: column;
        }
        .pp-row {
          display: grid;
          grid-template-columns: 56px minmax(0, 1fr);
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--cream-hairline);
        }
        .pp-thumb {
          width: 56px;
          height: 56px;
          border-radius: 2px;
          background: var(--cream-muted);
          border: 1px solid var(--cream-hairline);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          color: var(--spruce-muted);
        }
        .pp-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .pp-title-row {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: space-between;
          gap: 4px 8px;
        }
        .pp-title {
          font-weight: 600;
          color: var(--spruce-main);
        }
        .pp-expect {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.6875rem;
          color: var(--spruce-muted);
        }
        .pp-expect.is-held {
          color: var(--danger-text);
        }
        .pp-meta {
          color: var(--text-muted);
          margin-top: 2px;
        }
        .pp-quote {
          margin-top: 4px;
          color: var(--text-main);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .pp-audio {
          width: 100%;
          height: 32px;
          margin-top: 6px;
        }
        .pp-result {
          margin-top: 8px;
          padding: 8px 10px;
          border-radius: 2px;
          border: 1px solid var(--cream-hairline-strong);
          background: var(--cream-card);
        }
        .pp-result.is-accepted {
          border-color: #b9e6bb;
          background: #f2fcf1;
        }
        .pp-result.is-held,
        .pp-result.is-error {
          border-color: var(--danger-border);
          background: var(--danger-bg);
          color: var(--danger-text);
        }
        .pp-result-head {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
        }
        .pp-result p + p {
          margin-top: 4px;
        }
        .pp-route {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.75rem;
        }
        .pp-view {
          margin-top: 6px;
          border: none;
          background: none;
          padding: 0;
          font: inherit;
          color: var(--spruce-main);
          text-decoration: underline;
          cursor: pointer;
        }
        .pp-credits {
          margin-top: 20px;
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        .pp-credits a {
          color: var(--spruce-main);
        }
      `}</style>
    </aside>
  );
}

function Result({ sent, label, onView, viewing }: { sent: Sent; label?: { code: string; scene: IncidentScene }; onView: () => void; viewing: string }) {
  const { report } = sent;
  const s = report.screening;
  if (s?.status === "flagged") {
    return (
      <div className="pp-result is-held" role="status">
        <p className="pp-result-head">
          <ShieldAlert size={14} aria-hidden="true" /> Held for review
        </p>
        <p>{s.reason}</p>
      </div>
    );
  }
  return (
    <div className={`pp-result${s?.status === "accepted" ? " is-accepted" : ""}`} role="status">
      <p className="pp-result-head">
        <ShieldCheck size={14} aria-hidden="true" /> {report.sourceLabel} {s?.status === "accepted" ? "in the feed" : "in the feed, not screened"}
        {report.routing && label && (
          <span className="pp-route">
            <ArrowRight size={12} aria-hidden="true" /> {label.code} {SCENE_LABEL[label.scene]}
          </span>
        )}
      </p>
      {report.routing ? <p>{report.routing.reason}</p> : s?.reason ? <p>{s.reason}</p> : null}
      {sent.incidentId !== viewing && (
        <button type="button" className="pp-view" onClick={onView}>
          View on console
        </button>
      )}
    </div>
  );
}
