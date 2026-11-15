"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { IncidentHeader } from "../../components/IncidentHeader";
import { SchematicMap } from "../../components/SchematicMap";
import { BriefCard } from "../../components/BriefCard";
import { WitnessFeed } from "../../components/WitnessFeed";
import { VolunteerCards } from "../../components/VolunteerCards";
import { CoordinatorNotes } from "../../components/CoordinatorNotes";
import { TimelineFeed } from "../../components/TimelineFeed";
import { SessionLoadPanel } from "../../components/SessionLoadPanel";
import { PresenterPanel } from "../../components/PresenterPanel";
import { IncidentQueue } from "../../components/console/IncidentQueue";
import { ReportDrawer } from "../../components/console/ReportDrawer";
import { fetchSession, resetSession, ApiError } from "../../components/api";
import type { DemoState } from "../../lib/types";

const TABS = ["Feed", "Map", "Brief", "Volunteers", "Log"] as const;
type ConsoleTab = typeof TABS[number];

export default function DashboardPage() {
  const [state, setState] = useState<DemoState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<"report" | "held" | null>(null);
  const [tab, setTab] = useState<ConsoleTab>("Feed");
  const [presenterOpen, setPresenterOpen] = useState(false);
  const currentIncident = useRef<string | undefined>(undefined);
  const requestVersion = useRef(0);

  const writeIncidentUrl = (id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("incident", id);
    url.searchParams.delete("mode");
    window.history.replaceState(window.history.state, "", url);
  };

  const loadSession = useCallback(async (id?: string, quiet = false, chooseFirst = false) => {
    const version = ++requestVersion.current;
    if (quiet) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMsg(null);
    try {
      let next = await fetchSession(id);
      const first = chooseFirst ? next.incidents?.[0]?.id : undefined;
      if (first && first !== next.incident.id) next = await fetchSession(first);
      if (version !== requestVersion.current) return;
      currentIncident.current = next.incident.id;
      setState(next);
      writeIncidentUrl(next.incident.id);
    } catch (err) {
      if (version !== requestVersion.current) return;
      setErrorMsg(err instanceof ApiError ? err.message : "Could not load this incident. Try refreshing.");
    } finally {
      if (version === requestVersion.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("incident") || undefined;
    void loadSession(id, false, !id);
    return () => { requestVersion.current += 1; };
  }, [loadSession]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='textbox']")) return;
      if (event.shiftKey && event.key.toLowerCase() === "s" && !event.ctrlKey && !event.metaKey && !event.altKey && !event.repeat) {
        event.preventDefault();
        setPresenterOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const retryInitialLoad = () => {
    const id = new URLSearchParams(window.location.search).get("incident") || undefined;
    void loadSession(id, false, !id);
  };

  const selectIncident = (id: string) => {
    if (id === currentIncident.current && !isRefreshing) return;
    setSelectedReportId(null);
    setDrawer(null);
    void loadSession(id, true);
  };

  const handleStateUpdated = (next: DemoState) => {
    // A completed mutation for the previous incident must never replace the selected workspace.
    if (next.incident.id === currentIncident.current) setState(next);
  };

  const handleReset = async () => {
    const version = ++requestVersion.current;
    setIsRefreshing(true);
    setErrorMsg(null);
    try {
      const next = await resetSession(currentIncident.current);
      if (version !== requestVersion.current) return;
      currentIncident.current = next.incident.id;
      setState(next);
      writeIncidentUrl(next.incident.id);
      setSelectedReportId(null);
      setDrawer(null);
    } catch (err) {
      if (version === requestVersion.current) setErrorMsg(err instanceof ApiError ? err.message : "Reset failed. Try again.");
    } finally {
      if (version === requestVersion.current) setIsRefreshing(false);
    }
  };

  const selectReport = (id: string | null) => {
    setSelectedReportId(id);
    setDrawer(id ? "report" : null);
  };

  if (isLoading) return (
    <div className="operator-console">
      <Navbar isRefreshing />
      <main className="console-loading" role="status"><span className="pulse-dot" /> Opening coordinator workspace…</main>
    </div>
  );

  if (!state) return (
    <div className="operator-console">
      <Navbar onRefresh={retryInitialLoad} isRefreshing={isRefreshing} />
      <main className="console-loading"><SessionLoadPanel title="Workspace unavailable" message={errorMsg || "The coordinator session could not be loaded."} onRetry={retryInitialLoad} isRetrying={isRefreshing} showDashboardLink={false} /></main>
    </div>
  );

  const queue = state.incidents?.length ? state.incidents : [{ ...state.incident, reportCount: state.reports.length, withheldCount: state.withheldReports?.length ?? 0 }];
  const selectedReport = state.reports.find((report) => report.id === selectedReportId);

  return (
    <div className="operator-console">
      <Navbar state={state} onRefresh={() => void loadSession(currentIncident.current, true)} onReset={handleReset} isRefreshing={isRefreshing} />
      <main aria-label="Coordinator console">
      <IncidentHeader state={state} />
      <div className="console-workspace" aria-busy={isRefreshing}>
        {errorMsg && <div className="console-error" role="alert"><AlertCircle size={15} />{errorMsg}</div>}
        <div className="console-mobile-queue"><IncidentQueue incidents={queue} selectedId={state.incident.id} onSelect={selectIncident} disabled={isRefreshing} /></div>
        <div className="console-tabs" role="tablist" aria-label="Workspace panels">
          {TABS.map((name) => <button key={name} id={`tab-${name}`} role="tab" aria-selected={tab === name} aria-controls={`panel-${name}`} tabIndex={tab === name ? 0 : -1} onClick={() => setTab(name)} onKeyDown={(event) => {
            const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
            const index = event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : direction ? (TABS.indexOf(name) + direction + TABS.length) % TABS.length : -1;
            if (index < 0) return;
            event.preventDefault();
            setTab(TABS[index]);
            document.getElementById(`tab-${TABS[index]}`)?.focus();
          }}>{name}</button>)}
        </div>
        <fieldset className="console-interaction-boundary" disabled={isRefreshing}>
          <div className="console-grid">
            <aside className="console-left">
              <div className="console-desktop-queue"><IncidentQueue incidents={queue} selectedId={state.incident.id} onSelect={selectIncident} disabled={isRefreshing} /></div>
              <section id="panel-Feed" aria-label="Incoming reports" className={`console-panel console-feed-panel ${tab === "Feed" ? "is-visible" : ""}`}>
                <WitnessFeed key={state.incident.id} reports={state.reports} incidentId={state.incident.id} selectedReportId={selectedReportId} onSelectReport={selectReport} />
                <button className="console-held" onClick={() => setDrawer("held")}><AlertCircle size={14} /> Held for review ({state.withheldReports?.length ?? 0})<span aria-hidden="true">↗</span></button>
              </section>
            </aside>
            <section id="panel-Map" aria-label="Incident map" className={`console-panel console-map-panel ${tab === "Map" ? "is-visible" : ""}`}>
              <SchematicMap scene={state.incident.scene} reports={state.reports} stagingArea={state.incident.stagingArea} onSelectReport={selectReport} selectedReportId={selectedReportId} />
            </section>
            <aside className="console-right">
              <section id="panel-Brief" aria-label="Incident brief" className={`console-panel ${tab === "Brief" ? "is-visible" : ""}`}>
                <BriefCard key={`brief-${state.incident.id}`} brief={state.brief} incidentId={state.incident.id} reports={state.reports} onStateUpdated={handleStateUpdated} onSelectReport={selectReport} />
                <CoordinatorNotes key={`notes-${state.incident.id}`} notes={state.brief.notes} incidentId={state.incident.id} onStateUpdated={handleStateUpdated} />
              </section>
              <section id="panel-Volunteers" aria-label="Volunteer staging" className={`console-panel ${tab === "Volunteers" ? "is-visible" : ""}`}>
                <VolunteerCards key={state.incident.id} volunteers={state.volunteers} assignments={state.assignments} incidentId={state.incident.id} stagingArea={state.incident.stagingArea} onStateUpdated={handleStateUpdated} />
              </section>
            </aside>
            <section id="panel-Log" aria-label="Event log" className={`console-panel console-log-panel ${tab === "Log" ? "is-visible" : ""}`}><TimelineFeed events={state.events} /></section>
          </div>
        </fieldset>
      </div>
      </main>
      <ReportDrawer report={drawer === "report" ? selectedReport : undefined} heldReports={drawer === "held" ? state.withheldReports ?? [] : undefined} incidentId={state.incident.id} open={drawer !== null} onClose={() => setDrawer(null)} />
      <button className="console-presenter" aria-label="Open presenter controls" title="Presenter controls · Shift+S" onClick={() => setPresenterOpen(true)}>Presenter</button>
      <PresenterPanel state={state} open={presenterOpen} onClose={() => setPresenterOpen(false)} onStateUpdated={handleStateUpdated} onSelectIncident={selectIncident} />
    </div>
  );
}
