"use client";

import React from "react";
import type { DemoState } from "../lib/types";
import { AlertTriangle, Clock, MapPin, Shield, Users, FileText, HelpCircle } from "lucide-react";

interface IncidentHeaderProps {
  state: DemoState;
}

export function IncidentHeader({ state }: IncidentHeaderProps) {
  const { incident, reports, brief, volunteers } = state;

  const availableVolunteers = volunteers.filter((v) => v.available).length;
  const metrics = [
    { icon: <FileText size={13} />, label: "Witness reports", value: String(reports.length) },
    { icon: <Shield size={13} />, label: "Source-linked claims", value: String(brief.claims.length) },
    { icon: <HelpCircle size={13} />, label: "Open unknowns", value: String(brief.unknowns.length) },
    { icon: <Users size={13} />, label: "Available volunteers", value: `${availableVolunteers}`, suffix: ` / ${volunteers.length}` },
  ];

  return (
    <div style={{ marginBottom: "24px" }}>
      {/* Calm stay-safe and simulation reminder */}
      <div
        style={{
          background: "var(--caution-bg)",
          border: "1px solid var(--caution-border)",
          borderRadius: "2px",
          padding: "8px 14px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "0.8125rem",
          color: "var(--caution-text)",
        }}
      >
        <AlertTriangle size={15} style={{ flexShrink: 0 }} />
        <span>
          <strong>Staged demonstration.</strong> Professional response is simulated and nothing here is linked to 911 or real dispatch.
        </span>
      </div>

      <div className="card-light fl-card-pad incident-header">
        <div className="incident-header-top">
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
              <span className="badge badge-dark" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {incident.category}
              </span>
              <span className="badge badge-blue" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="pulse-dot" style={{ background: "#05486d" }} />
                {incident.status === "responding" ? "Active response (simulated)" : "Monitoring"}
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(1.75rem, 3.2vw, 2.25rem)",
                color: "var(--spruce-main)",
                lineHeight: 1.1,
                fontWeight: 600,
              }}
            >
              {incident.title}
            </h1>

            <p style={{ marginTop: "8px", color: "var(--text-main)", fontSize: "0.9375rem", maxWidth: "62ch" }}>
              Witness reports become one shared, source-linked brief. You approve nearby volunteers for support at the
              designated staging point only.
            </p>
            <p className="incident-desc" style={{ marginTop: "4px", color: "var(--text-muted)", fontSize: "0.875rem", maxWidth: "62ch" }}>
              {incident.description}
            </p>
          </div>

          <dl className="incident-meta">
            <div>
              <dt><MapPin size={13} /> Address</dt>
              <dd>{incident.address}</dd>
            </div>
            <div>
              <dt><Shield size={13} /> Staging point</dt>
              <dd>{incident.stagingArea}</dd>
            </div>
            <div>
              <dt><Clock size={13} /> Opened</dt>
              <dd>{new Date(incident.reportedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</dd>
            </div>
          </dl>
        </div>

        {/* Compact metrics derived from the workspace data */}
        <div className="incident-metrics">
          {metrics.map((m) => (
            <div key={m.label} className="incident-metric">
              <span className="incident-metric-label">
                {m.icon}
                {m.label}
              </span>
              <span className="incident-metric-value">
                {m.value}
                {m.suffix && <span style={{ fontSize: "0.8125rem", fontWeight: 475, color: "var(--text-muted)" }}>{m.suffix}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .incident-header-top {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(220px, 300px);
          gap: 24px;
          align-items: start;
        }
        .incident-meta {
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.8125rem;
          padding: 12px 16px;
          background: var(--cream-muted);
          border: 1px solid var(--cream-hairline);
          border-radius: 2px;
        }
        .incident-meta dt {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        .incident-meta dd {
          margin: 2px 0 0;
          color: var(--spruce-main);
        }
        .incident-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          margin-top: 18px;
          border-top: 1px solid var(--cream-hairline);
        }
        .incident-metric {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 12px 16px 0 0;
        }
        .incident-metric + .incident-metric {
          padding-left: 16px;
          border-left: 1px solid var(--cream-hairline);
        }
        .incident-metric-label {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        .incident-metric-value {
          font-size: 1.35rem;
          font-weight: 600;
          color: var(--spruce-main);
          line-height: 1.2;
        }
        @media (max-width: 760px) {
          .incident-header-top {
            grid-template-columns: minmax(0, 1fr);
            gap: 16px;
          }
          .incident-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .incident-metric:nth-child(3) {
            padding-left: 0;
            border-left: none;
          }
          .incident-metric-value {
            font-size: 1.15rem;
          }
          .incident-desc {
            display: none;
          }
          .incident-meta {
            gap: 4px;
            padding: 10px 12px;
          }
          .incident-meta > div {
            display: flex;
            align-items: baseline;
            gap: 6px;
          }
          .incident-meta dt {
            flex-shrink: 0;
          }
          .incident-meta dt::after {
            content: ":";
          }
          .incident-meta dd {
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
