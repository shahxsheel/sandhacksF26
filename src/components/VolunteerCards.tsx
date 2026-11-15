"use client";

import React, { useState } from "react";
import type { Volunteer, Assignment, DemoState } from "../lib/types";
import { Users, UserCheck, Shield, Send, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { assignVolunteer, ApiError } from "./api";

interface VolunteerCardsProps {
  volunteers: Volunteer[];
  assignments: Assignment[];
  incidentId: string;
  onStateUpdated: (state: DemoState) => void;
}

const PRESET_TASKS = [
  "Bring campus supply kit to North Plaza staging point",
  "Staff language support desk at North Plaza",
  "Assist with staging check-in and roster at North Plaza",
  "Provide hydration and basic logistics support at staging point",
];

export function VolunteerCards({
  volunteers,
  assignments,
  incidentId,
  onStateUpdated,
}: VolunteerCardsProps) {
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(null);
  const [taskText, setTaskText] = useState(PRESET_TASKS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVolunteerId || !taskText.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const next = await assignVolunteer(incidentId, selectedVolunteerId, taskText.trim());
      const vol = next.volunteers.find((v) => v.id === selectedVolunteerId);
      setSuccessMsg(`${vol?.name || "Volunteer"} approved for the staging point. Simulation only: no message was sent; they respond from the volunteer link.`);
      setSelectedVolunteerId(null);
      onStateUpdated(next);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to assign volunteer. Ensure staging task is valid.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVolunteerName = (volId: string) => {
    return volunteers.find((v) => v.id === volId)?.name || "Registered Volunteer";
  };

  return (
    <div className="card-light fl-card-pad" style={{ marginBottom: "28px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
          paddingBottom: "14px",
          borderBottom: "1px solid var(--cream-hairline)",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div>
          <h3 style={{ fontSize: "1.15rem", color: "var(--spruce-main)", fontWeight: 600 }}>
            Nearby Registered Volunteers
          </h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "2px" }}>
            Staging support only. Volunteers are tasked exclusively to the designated North Plaza staging area.
          </p>
        </div>
        <span className="badge badge-green">
          Staging point only
        </span>
      </div>

      {errorMsg && (
        <div
          style={{
            background: "var(--danger-bg)",
            border: "1px solid var(--danger-border)",
            borderRadius: "2px",
            padding: "10px 14px",
            marginBottom: "16px",
            fontSize: "0.8125rem",
            color: "var(--danger-text)",
          }}
        >
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            background: "var(--pale-green)",
            border: "1px solid var(--pale-green-border)",
            borderRadius: "2px",
            padding: "10px 14px",
            marginBottom: "16px",
            fontSize: "0.8125rem",
            color: "var(--pale-green-text)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={15} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid of Volunteer Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        {volunteers.map((vol) => {
          const hasActiveAssignment = assignments.some(
            (a) => a.volunteerId === vol.id && a.status !== "declined"
          );
          const isSelected = selectedVolunteerId === vol.id;

          return (
            <div
              key={vol.id}
              style={{
                background: isSelected ? "var(--pale-green)" : "#ffffff",
                border: isSelected ? "1px solid var(--pale-green-border)" : "1px solid var(--cream-hairline)",
                borderRadius: "2px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "12px",
                boxShadow: isSelected ? "0 0 0 2px var(--accent-lime-glow)" : "none",
              }}
            >
              <div>
                {/* Avatar + Name + Distance */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "var(--spruce-panel)",
                      color: "var(--accent-lime)",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {vol.initials}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--spruce-main)" }}>
                        {vol.name}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                        {vol.distanceMeters}m away
                      </span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {vol.role}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.45, marginBottom: "8px" }}>
                  {vol.bio}
                </p>

                {/* Skills tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {vol.skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      style={{
                        background: "var(--cream-muted)",
                        color: "var(--spruce-muted)",
                        padding: "1px 6px",
                        borderRadius: "2px",
                        fontSize: "0.6875rem",
                        fontWeight: 500,
                        border: "1px solid var(--cream-hairline)",
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status and Action */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "10px", borderTop: "1px solid var(--cream-hairline)" }}>
                <div>
                  {hasActiveAssignment ? (
                    <span className="badge badge-blue" style={{ fontSize: "0.6875rem" }}>
                      Assigned
                    </span>
                  ) : vol.available ? (
                    <span className="badge badge-green" style={{ fontSize: "0.6875rem" }}>
                      Available
                    </span>
                  ) : (
                    <span className="badge badge-caution" style={{ fontSize: "0.6875rem" }}>
                      Unavailable
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!vol.available || hasActiveAssignment}
                  onClick={() => setSelectedVolunteerId(isSelected ? null : vol.id)}
                  aria-expanded={isSelected}
                  aria-label={isSelected ? `Cancel task for ${vol.name}` : `Assign a staging task to ${vol.name}`}
                  className={`btn btn-sm ${isSelected ? "btn-dark" : "btn-outline-dark"}`}
                  style={{ padding: "4px 12px", fontSize: "0.75rem" }}
                >
                  {isSelected ? "Cancel" : "Assign Task"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Assignment Form (Shown when volunteer selected) */}
      {selectedVolunteerId && (
        <form
          onSubmit={handleAssign}
          style={{
            background: "var(--cream-muted)",
            border: "1px solid var(--cream-hairline)",
            borderRadius: "2px",
            padding: "18px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Send size={15} color="var(--spruce-main)" />
            <h4 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--spruce-main)" }}>
              Approve {getVolunteerName(selectedVolunteerId)} for a staging task
            </h4>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="volunteer-task-preset" style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
              Staging task
            </label>
            <select
              id="volunteer-task-preset"
              value={PRESET_TASKS.includes(taskText) ? taskText : ""}
              onChange={(e) => setTaskText(e.target.value)}
              className="select"
              style={{ marginBottom: "8px" }}
            >
              {!PRESET_TASKS.includes(taskText) && <option value="" disabled>Custom instruction below</option>}
              {PRESET_TASKS.map((preset, pIdx) => (
                <option key={pIdx} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label htmlFor="volunteer-task-text" style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
              Or edit the instruction (staging point support only)
            </label>
            <input
              id="volunteer-task-text"
              type="text"
              maxLength={200}
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              className="input"
              placeholder="e.g. Bring extra first aid supplies to North Plaza staging point"
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setSelectedVolunteerId(null)}
              className="btn btn-sm btn-outline-dark"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !taskText.trim()}
              className="btn btn-sm btn-primary"
            >
              {isSubmitting ? "Approving..." : "Approve for staging point"}
            </button>
          </div>
        </form>
      )}

      {/* Active Assignments Table */}
      {assignments.length > 0 && (
        <div>
          <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--spruce-muted)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "12px" }}>
            Staging assignments ({assignments.length})
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {assignments.map((asg) => (
              <div
                key={asg.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid var(--cream-hairline)",
                  borderRadius: "2px",
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--spruce-main)" }}>
                      {getVolunteerName(asg.volunteerId)}
                    </span>
                    <span
                      className={`badge ${
                        asg.status === "accepted"
                          ? "badge-green"
                          : asg.status === "declined"
                          ? "badge-danger"
                          : "badge-blue"
                      }`}
                      style={{ fontSize: "0.6875rem", textTransform: "capitalize" }}
                    >
                      {asg.status === "accepted" && <CheckCircle2 size={11} />}
                      {asg.status === "declined" && <XCircle size={11} />}
                      {asg.status === "approved" && <Clock size={11} />}
                      {asg.status === "approved" ? "Pending Volunteer Acceptance" : asg.status}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "3px" }}>
                    {asg.task}
                  </p>
                </div>

                <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                  Approved {new Date(asg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
