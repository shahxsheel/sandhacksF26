"use client";

import React, { useState } from "react";
import type { DemoState, WitnessReport } from "../lib/types";
import { SIMULATION_PRESETS, type SimulationPreset } from "../lib/simulation-presets";
import { submitReport, ApiError } from "./api";
import { witnessPath } from "./share-links";
import { ArrowRight, Camera, FileText, Mic, PhoneCall, Play, ShieldAlert, ShieldCheck, Users, ClipboardList, Layers } from "lucide-react";

export type DemoMode = "normal" | "simulation";

interface ModeSwitchProps {
  mode: DemoMode;
  onChange: (mode: DemoMode) => void;
}

export function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  return (
    <div className="mode-switch" role="radiogroup" aria-label="Demo mode">
      {(["normal", "simulation"] as const).map((value) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          className={`mode-switch-option${mode === value ? " is-active" : ""}`}
          onClick={() => onChange(value)}
        >
          {value === "normal" ? "Normal mode" : "Simulation mode"}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- normal mode

const FLOW_STEPS = [
  { icon: PhoneCall, title: "911 call is logged", text: "In this demo the dispatcher's text message is simulated: the caller receives a FirstLink witness link." },
  { icon: ShieldAlert, title: "Safety & consent", text: "Step 1 of the form. The witness confirms they are somewhere safe and consents before anything is collected." },
  { icon: Camera, title: "Observation", text: "Step 2. Text, a photo, or a voice note of up to 45 seconds. ElevenLabs transcribes the voice note." },
  { icon: ShieldCheck, title: "Gemini screening", text: "Each report is checked as it arrives. Off-site, fabricated or manipulative reports are withheld from the feed." },
  { icon: ClipboardList, title: "Shared brief", text: "Gemini combines the accepted reports into a brief where every claim links to its sources. Coordinators correct it with notes." },
  { icon: Users, title: "Approved support", text: "The coordinator approves nearby volunteers for the designated staging point; volunteers accept or decline." },
];

function WitnessFlowGuide({ incidentId, onTrySimulation }: { incidentId: string; onTrySimulation: () => void }) {
  return (
    <section className="card-light fl-card-pad mode-panel" aria-labelledby="flow-guide-heading">
      <div className="mode-panel-head">
        <div>
          <span className="badge badge-dark" style={{ marginBottom: "8px" }}>NORMAL MODE</span>
          <h2 id="flow-guide-heading" className="mode-panel-title">How a witness report reaches the coordinator</h2>
        </div>
        <div className="mode-panel-actions">
          <a className="btn btn-sm btn-outline-dark" href={witnessPath(incidentId)} target="_blank" rel="noreferrer">
            Open witness form <ArrowRight size={14} />
          </a>
          <button type="button" className="btn btn-sm btn-dark" onClick={onTrySimulation}>
            <Play size={14} /> Run a simulation
          </button>
        </div>
      </div>
      <ol className="flow-steps">
        {FLOW_STEPS.map((step, i) => (
          <li key={step.title} className="flow-step">
            <span className="flow-step-num" aria-hidden="true">{i + 1}</span>
            <div>
              <h3 className="flow-step-title">
                <step.icon size={14} aria-hidden="true" /> {step.title}
              </h3>
              <p className="flow-step-text">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ---------------------------------------------------------------- simulation mode

type SendStatus = { kind: "sending" } | { kind: "error"; message: string };

async function fetchAsFile(src: string, name: string, type: string): Promise<File> {
  const res = await fetch(src);
  if (!res.ok) throw new Error("Simulation media could not be loaded.");
  return new File([await res.blob()], name, { type });
}

async function buildForm(incidentId: string, preset: SimulationPreset): Promise<FormData> {
  const form = new FormData();
  form.append("incidentId", incidentId);
  form.append("name", preset.name);
  form.append("location", preset.location);
  form.append("text", preset.text);
  form.append("consent", "true");
  if (preset.photo) form.append("photo", await fetchAsFile(preset.photo.src, `${preset.id}.jpg`, "image/jpeg"));
  if (preset.audio) form.append("audio", await fetchAsFile(preset.audio.src, `${preset.id}.mp3`, "audio/mpeg"));
  return form;
}

/** The submitted report for a preset, if this workspace already has one (survives refresh). */
function findSubmitted(state: DemoState, preset: SimulationPreset): WitnessReport | undefined {
  const all = [...state.reports, ...(state.withheldReports ?? [])];
  return all.find((r) => !r.isSample && r.name === preset.name && r.location === preset.location);
}

function presetIcon(preset: SimulationPreset) {
  if (preset.photo) return null;
  return preset.audio ? <Mic size={28} aria-hidden="true" /> : <FileText size={28} aria-hidden="true" />;
}

function ResultLine({ report }: { report: WitnessReport }) {
  const s = report.screening;
  if (s?.status === "flagged") {
    return (
      <p className="sim-result sim-result-flagged" role="status">
        <ShieldAlert size={14} aria-hidden="true" /> <strong>{report.sourceLabel} withheld by Gemini.</strong> {s.reason}
      </p>
    );
  }
  if (s?.status === "accepted") {
    return (
      <p className="sim-result sim-result-accepted" role="status">
        <ShieldCheck size={14} aria-hidden="true" /> <strong>{report.sourceLabel} in the feed.</strong> {s.reason}
      </p>
    );
  }
  return (
    <p className="sim-result sim-result-unscreened" role="status">
      <strong>{report.sourceLabel} in the feed, not screened.</strong> {s?.reason ?? ""}
    </p>
  );
}

interface SimulationConsoleProps {
  state: DemoState;
  onStateUpdated: (state: DemoState) => void;
  onSelectReport: (reportId: string) => void;
}

function SimulationConsole({ state, onStateUpdated, onSelectReport }: SimulationConsoleProps) {
  const [status, setStatus] = useState<Record<string, SendStatus>>({});
  const [runningAll, setRunningAll] = useState(false);
  const incidentId = state.incident.id;
  const withheld = state.withheldReports ?? [];
  const used = state.reports.length + withheld.length;
  const busy = runningAll || Object.values(status).some((s) => s.kind === "sending");

  const send = async (preset: SimulationPreset, current: DemoState): Promise<DemoState | null> => {
    setStatus((prev) => ({ ...prev, [preset.id]: { kind: "sending" } }));
    try {
      const result = await submitReport(await buildForm(incidentId, preset));
      setStatus((prev) => {
        const next = { ...prev };
        delete next[preset.id];
        return next;
      });
      if (result.state) {
        onStateUpdated(result.state);
        return result.state;
      }
      return current;
    } catch (err: unknown) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "The staged report could not be sent.";
      setStatus((prev) => ({ ...prev, [preset.id]: { kind: "error", message } }));
      return null;
    }
  };

  const sendAll = async () => {
    setRunningAll(true);
    let current: DemoState = state;
    for (const preset of SIMULATION_PRESETS) {
      if (findSubmitted(current, preset)) continue;
      const next = await send(preset, current);
      if (!next) break;
      current = next;
    }
    setRunningAll(false);
  };

  const pending = SIMULATION_PRESETS.filter((p) => !findSubmitted(state, p)).length;

  return (
    <section className="card-light fl-card-pad mode-panel" aria-labelledby="sim-console-heading">
      <div className="mode-panel-head">
        <div>
          <span className="badge badge-sim" style={{ marginBottom: "8px" }}>SIMULATION MODE · STAGED REPORTS</span>
          <h2 id="sim-console-heading" className="mode-panel-title">Simulate witnesses at the La Jolla canyon fire</h2>
          <p className="mode-panel-lede">
            Each staged report goes through the real witness pipeline: upload checks, ElevenLabs transcription and Gemini screening.
            The photos are real San Diego-area wildfire photos from Wikimedia Commons, not pictures of this staged incident.
          </p>
        </div>
        <div className="mode-panel-actions">
          <span className="sim-capacity">{used} of 8 report slots used</span>
          <button type="button" className="btn btn-sm btn-primary" onClick={sendAll} disabled={busy || pending === 0}>
            <Layers size={14} /> {runningAll ? "Sending…" : pending === 0 ? "All reports sent" : `Send all ${pending}`}
          </button>
        </div>
      </div>

      <ul className="sim-grid">
        {SIMULATION_PRESETS.map((preset) => {
          const submitted = findSubmitted(state, preset);
          const s = status[preset.id];
          return (
            <li key={preset.id} className="sim-card">
              <div className={`sim-media${preset.photo ? "" : " is-icon"}`}>
                {preset.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preset.photo.src} alt={`Staged photo for the ${preset.label.toLowerCase()} report`} />
                ) : (
                  <span className="sim-media-icon">{presetIcon(preset)}</span>
                )}
              </div>
              <div className="sim-body">
                <div className="sim-title-row">
                  <h3 className="sim-title">{preset.label}</h3>
                  <span className={`badge ${preset.expected === "flagged" ? "badge-danger" : "badge-blue"}`} style={{ fontSize: "0.625rem" }}>
                    {preset.expected === "flagged" ? "Should be withheld" : "Should be accepted"}
                  </span>
                </div>
                <p className="sim-summary">{preset.summary}</p>
                <p className="sim-meta">
                  {preset.name} · {preset.location}
                </p>
                {preset.text && <p className="sim-quote">“{preset.text}”</p>}
                {preset.audio && (
                  <audio className="sim-audio" controls preload="none" src={preset.audio.src} aria-label={`Preview voice note for ${preset.label}`} />
                )}
                <p className="sim-credit">
                  {[preset.photo?.credit, preset.audio?.credit].filter(Boolean).join(" · ")}
                </p>
                {submitted ? (
                  <>
                    <ResultLine report={submitted} />
                    {submitted.screening?.status !== "flagged" && (
                      <button type="button" className="sim-link" onClick={() => onSelectReport(submitted.id)}>
                        Show in feed
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {s?.kind === "error" && (
                      <p className="sim-result sim-result-error" role="alert">
                        {s.message}
                      </p>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-dark sim-send"
                      onClick={() => void send(preset, state)}
                      disabled={busy}
                    >
                      {s?.kind === "sending" ? "Uploading and screening…" : "Send report"}
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="sim-withheld" aria-live="polite">
        <h3 className="sim-withheld-title">
          <ShieldAlert size={15} aria-hidden="true" /> Withheld by Gemini screening ({withheld.length})
        </h3>
        {withheld.length === 0 ? (
          <p className="sim-withheld-empty">No reports withheld yet. Withheld reports never enter the evidence feed, the map or the brief.</p>
        ) : (
          <ul className="sim-withheld-list">
            {withheld.map((report) => (
              <li key={report.id} className="sim-withheld-item">
                {report.photoId && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/media/${report.photoId}?incidentId=${encodeURIComponent(incidentId)}`}
                    alt={`Photo attached to withheld report ${report.sourceLabel}`}
                  />
                )}
                <div>
                  <p className="sim-withheld-head">
                    <strong>{report.sourceLabel}</strong> · {report.location}
                  </p>
                  <p className="sim-withheld-reason">{report.screening?.reason}</p>
                  <p className="sim-withheld-text">“{report.text.length > 160 ? `${report.text.slice(0, 159)}…` : report.text}”</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="sim-withheld-empty">Screening filters out clearly unreliable reports; it does not verify that accepted reports are true.</p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- panel

interface DemoModePanelProps {
  mode: DemoMode;
  onModeChange: (mode: DemoMode) => void;
  state: DemoState;
  onStateUpdated: (state: DemoState) => void;
  onSelectReport: (reportId: string) => void;
}

export function DemoModePanel({ mode, onModeChange, state, onStateUpdated, onSelectReport }: DemoModePanelProps) {
  return mode === "simulation" ? (
    <SimulationConsole state={state} onStateUpdated={onStateUpdated} onSelectReport={onSelectReport} />
  ) : (
    <WitnessFlowGuide incidentId={state.incident.id} onTrySimulation={() => onModeChange("simulation")} />
  );
}
