"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "../../../components/Navbar";
import { SessionLoadPanel } from "../../../components/SessionLoadPanel";
import { fetchSession, respondAssignment, ApiError } from "../../../components/api";
import { isIncidentUuid } from "../../../components/share-links";
import type { DemoState, Assignment, Volunteer } from "../../../lib/types";
import { Shield, MapPin, CheckCircle2, XCircle, AlertTriangle, ArrowRight, ChevronLeft } from "lucide-react";

interface VolunteerPageProps {
  params: Promise<{ incidentId: string }>;
}

export default function VolunteerPortalPage({ params }: VolunteerPageProps) {
  const { incidentId } = use(params);
  const searchParams = useSearchParams();
  const access = searchParams?.get("access") || undefined;

  const [state, setState] = useState<DemoState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    if (!isIncidentUuid(incidentId)) {
      setState(null);
      setLoadError("This incident link is not valid. Ask the coordinator for a current volunteer link.");
      setIsLoading(false);
      return;
    }

    try {
      const s = await fetchSession(incidentId, access, "volunteer");
      setState(s);
      if (s.volunteers.length > 0) {
        setSelectedVolunteerId(s.volunteers[0].id);
      }
    } catch (err: unknown) {
      setState(null);
      if (err instanceof ApiError) {
        setLoadError(err.message);
      } else {
        setLoadError("Could not load the volunteer portal. Check the link or try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [incidentId, access]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const currentVolunteer: Volunteer | undefined = state?.volunteers.find((v) => v.id === selectedVolunteerId);

  const currentAssignment: Assignment | undefined = state?.assignments.find((a) => a.volunteerId === selectedVolunteerId);

  const handleRespond = async (action: "accept" | "decline") => {
    if (!currentAssignment || !state) return;
    setActionInProgress(action);
    setErrorMsg(null);
    setStatusNotice(null);

    try {
      const newState = await respondAssignment(currentAssignment.id, incidentId, action, access);
      setState(newState);
      const staging = newState.incident.stagingArea;
      setStatusNotice(
        action === "accept"
          ? `Assignment accepted. Report to ${staging}.`
          : "Assignment declined. Remain on safe standby."
      );
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Could not update the assignment. Try again.");
      }
    } finally {
      setActionInProgress(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
          <span className="pulse-dot" style={{ width: "16px", height: "16px" }} />
          <p style={{ fontSize: "0.9375rem", color: "var(--spruce-muted)" }}>
            Loading volunteer portal…
          </p>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main style={{ flex: 1, padding: "48px 24px" }}>
          <SessionLoadPanel
            title="Access denied"
            message={loadError || "This volunteer link is not valid or has expired."}
            onRetry={loadData}
            isRetrying={isLoading}
          />
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
      <Navbar state={state} />

      <main style={{ flex: 1, padding: "32px 24px 64px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.75rem", color: "var(--spruce-main)", fontWeight: 600, marginBottom: "16px" }}>
            Volunteer portal
          </h1>

          <div
            style={{
              background: "var(--caution-bg)",
              border: "1px solid var(--caution-border)",
              borderRadius: "2px",
              padding: "12px 18px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              fontSize: "0.875rem",
              color: "var(--caution-text)",
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong>Designated staging only:</strong> Do not enter the hazard perimeter. Move to the coordinator&apos;s designated staging area only after an assignment is approved.
            </div>
          </div>

          <div
            className="card-light"
            style={{
              padding: "20px 24px",
              background: "#ffffff",
              marginBottom: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--spruce-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                VOLUNTEER ROSTER IDENTITY
              </div>
              <div style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--spruce-main)", marginTop: "2px" }}>
                {currentVolunteer?.name || "Volunteer"}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "2px" }}>
                {currentVolunteer?.role} · {currentVolunteer?.skills.join(", ")}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Demo view as:</span>
              <select
                value={selectedVolunteerId}
                onChange={(e) => {
                  setSelectedVolunteerId(e.target.value);
                  setStatusNotice(null);
                  setErrorMsg(null);
                }}
                className="select"
                style={{ fontSize: "0.8125rem", padding: "6px 12px" }}
              >
                {state.volunteers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.available ? "Available" : "Unavailable"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMsg && (
            <div
              style={{
                background: "var(--danger-bg)",
                border: "1px solid var(--danger-border)",
                borderRadius: "2px",
                padding: "10px 14px",
                marginBottom: "20px",
                fontSize: "0.8125rem",
                color: "var(--danger-text)",
              }}
            >
              {errorMsg}
            </div>
          )}

          {statusNotice && (
            <div
              style={{
                background: "var(--pale-green)",
                border: "1px solid var(--pale-green-border)",
                borderRadius: "2px",
                padding: "12px 16px",
                marginBottom: "20px",
                fontSize: "0.875rem",
                color: "var(--pale-green-text)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={16} />
              <span>{statusNotice}</span>
            </div>
          )}

          {currentAssignment ? (
            <div
              className="card-light"
              style={{
                padding: "28px 28px",
                background: "#ffffff",
                border: "1px solid var(--cream-hairline)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span
                      className={`badge ${
                        currentAssignment.status === "accepted"
                          ? "badge-green"
                          : currentAssignment.status === "declined"
                          ? "badge-danger"
                          : "badge-blue"
                      }`}
                      style={{ textTransform: "uppercase" }}
                    >
                      {currentAssignment.status === "approved" ? "Assignment approved" : currentAssignment.status}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                      Dispatched {new Date(currentAssignment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <h2 style={{ fontSize: "1.35rem", color: "var(--spruce-main)", fontWeight: 600 }}>
                    Staging task directive
                  </h2>
                </div>

                <div className="badge badge-dark" style={{ background: "var(--cream-muted)", color: "var(--spruce-main)" }}>
                  <MapPin size={12} /> {state.incident.stagingArea}
                </div>
              </div>

              <div
                style={{
                  background: "var(--cream-muted)",
                  padding: "16px 20px",
                  borderRadius: "2px",
                  border: "1px solid var(--cream-hairline)",
                  marginBottom: "24px",
                }}
              >
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--spruce-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Task from coordinator
                </div>
                <p style={{ fontSize: "1.05rem", fontWeight: 500, color: "var(--text-main)", lineHeight: 1.5 }}>
                  {currentAssignment.task}
                </p>
              </div>

              {currentAssignment.status === "approved" && (
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    disabled={actionInProgress !== null}
                    onClick={() => handleRespond("decline")}
                    className="btn btn-outline-dark"
                  >
                    <XCircle size={15} />
                    <span>Decline task</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionInProgress !== null}
                    onClick={() => handleRespond("accept")}
                    className="btn btn-primary"
                  >
                    <CheckCircle2 size={15} />
                    <span>{actionInProgress === "accept" ? "Accepting…" : "Accept & proceed to staging"}</span>
                  </button>
                </div>
              )}

              {currentAssignment.status === "accepted" && (
                <div
                  style={{
                    background: "var(--pale-green)",
                    border: "1px solid var(--pale-green-border)",
                    borderRadius: "2px",
                    padding: "16px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontWeight: 600, color: "var(--pale-green-text)", fontSize: "0.9375rem" }}>
                    You accepted this task.
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--pale-green-text)", marginTop: "4px" }}>
                    Report to <strong>{state.incident.stagingArea}</strong> and check in with the coordinator.
                  </p>
                </div>
              )}

              {currentAssignment.status === "declined" && (
                <div
                  style={{
                    background: "var(--danger-bg)",
                    border: "1px solid var(--danger-border)",
                    borderRadius: "2px",
                    padding: "14px",
                    textAlign: "center",
                    color: "var(--danger-text)",
                    fontSize: "0.875rem",
                  }}
                >
                  Task declined. Remain on safe standby until further notice.
                </div>
              )}
            </div>
          ) : (
            <div
              className="card-light"
              style={{
                padding: "48px 32px",
                background: "#ffffff",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "var(--cream-muted)",
                  color: "var(--spruce-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Shield size={26} />
              </div>

              <h3 style={{ fontSize: "1.35rem", color: "var(--spruce-main)", fontWeight: 600, marginBottom: "8px" }}>
                Standing by in a safe area
              </h3>

              <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: "460px", margin: "0 auto 24px" }}>
                No approved assignments yet. Stay outside the perimeter until the coordinator dispatches a staging task for {state.incident.stagingArea}.
              </p>

              <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                <Link href="/dashboard" className="btn btn-outline-dark">
                  <span>Open coordinator workspace to dispatch a task</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}

          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <Link href="/dashboard" style={{ fontSize: "0.875rem", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <ChevronLeft size={14} />
              <span>Back to incident workspace</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}