"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Navbar } from "../../components/Navbar";
import { IncidentHeader } from "../../components/IncidentHeader";
import { SchematicMap } from "../../components/SchematicMap";
import { BriefCard } from "../../components/BriefCard";
import { WitnessFeed } from "../../components/WitnessFeed";
import { VolunteerCards } from "../../components/VolunteerCards";
import { CoordinatorNotes } from "../../components/CoordinatorNotes";
import { TimelineFeed } from "../../components/TimelineFeed";
import { SessionLoadPanel } from "../../components/SessionLoadPanel";
import { fetchSession, resetSession, ApiError } from "../../components/api";
import type { DemoState } from "../../lib/types";
import { AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const [state, setState] = useState<DemoState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const loadSession = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMsg(null);

    try {
      const data = await fetchSession();
      setState(data);
    } catch (err: unknown) {
      // A failed manual refresh keeps the workspace already on screen; only the first load shows the error panel.
      if (!quiet) setState(null);
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Could not load the incident workspace. Check your connection and try again.");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handleReset = async () => {
    setIsRefreshing(true);
    setErrorMsg(null);
    try {
      const freshState = await resetSession(state?.incident.id);
      setState(freshState);
      setSelectedReportId(null);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Reset failed. The workspace was not changed.");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStateUpdated = (next: DemoState) => {
    setState(next);
  };

  const handleSelectReport = (reportId: string) => {
    setSelectedReportId(reportId);
    const el = document.getElementById(`report-${reportId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
        <Navbar isRefreshing={true} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
          <span className="pulse-dot" style={{ width: "16px", height: "16px" }} />
          <p style={{ fontSize: "0.9375rem", color: "var(--spruce-muted)", fontWeight: 500 }}>
            Initializing FirstLink incident workspace…
          </p>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
        <Navbar onRefresh={() => loadSession(true)} isRefreshing={isRefreshing} />
        <main style={{ flex: 1, padding: "48px 16px" }}>
          <SessionLoadPanel
            title="Workspace unavailable"
            message={errorMsg || "The coordinator session could not be loaded."}
            onRetry={() => loadSession()}
            isRetrying={isRefreshing}
            showDashboardLink={false}
          />
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
      <Navbar
        state={state}
        onRefresh={() => loadSession(true)}
        onReset={handleReset}
        isRefreshing={isRefreshing}
      />

      <main style={{ flex: 1, padding: "24px 0 64px" }}>
        <div className="container-max">
          {errorMsg && (
            <div
              style={{
                background: "var(--danger-bg)",
                border: "1px solid var(--danger-border)",
                borderRadius: "2px",
                padding: "12px 16px",
                marginBottom: "20px",
                fontSize: "0.875rem",
                color: "var(--danger-text)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <IncidentHeader state={state} />

          <div className="dashboard-columns">
            <div className="dashboard-col">
              <div className="dash-brief">
                <BriefCard
                  brief={state.brief}
                  incidentId={state.incident.id}
                  reports={state.reports}
                  onStateUpdated={handleStateUpdated}
                  onSelectReport={handleSelectReport}
                />
              </div>

              <div className="dash-map">
                <SchematicMap
                  reports={state.reports}
                  stagingArea={state.incident.stagingArea}
                  onSelectReport={handleSelectReport}
                  selectedReportId={selectedReportId}
                />
              </div>

              <div className="dash-feed">
                <WitnessFeed
                  reports={state.reports}
                  incidentId={state.incident.id}
                  selectedReportId={selectedReportId}
                  onSelectReport={setSelectedReportId}
                />
              </div>

              <div className="dash-notes">
                <CoordinatorNotes
                  notes={state.brief.notes}
                  incidentId={state.incident.id}
                  onStateUpdated={handleStateUpdated}
                />
              </div>
            </div>

            <div className="dashboard-col">
              <div className="dash-volunteers">
                <VolunteerCards
                  volunteers={state.volunteers}
                  assignments={state.assignments}
                  incidentId={state.incident.id}
                  onStateUpdated={handleStateUpdated}
                />
              </div>

              <div className="dash-timeline">
                <TimelineFeed events={state.events} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer
        style={{
          background: "var(--spruce-deep)",
          color: "var(--spruce-light)",
          padding: "24px",
          borderTop: "1px solid var(--spruce-hairline)",
          fontSize: "0.8125rem",
        }}
      >
        <div className="container-max" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <strong>FirstLink demonstration workspace</strong> · Staged campus incident scenario
          </div>
          <div style={{ color: "var(--spruce-muted)" }}>
            Professional responders simulated · Keep perimeters clear
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .dashboard-columns {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(0, 1.1fr);
          gap: 28px;
          align-items: start;
        }
        .dashboard-col {
          min-width: 0;
        }
        .dash-map {
          margin-bottom: 28px;
        }
        /* Single column: brief first, then who can help, then the scene and evidence. */
        @media (max-width: 960px) {
          .dashboard-columns {
            display: flex;
            flex-direction: column;
            gap: 0;
          }
          .dashboard-col {
            display: contents;
          }
          .dash-brief { order: 1; }
          .dash-volunteers { order: 2; }
          .dash-map { order: 3; }
          .dash-feed { order: 4; }
          .dash-notes { order: 5; }
          .dash-timeline { order: 6; }
          .dashboard-col > div {
            min-width: 0;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}