"use client";

import React from "react";
import type { Incident, DemoState } from "../lib/types";
import { AlertTriangle, Clock, MapPin, Shield, Users, FileText, HelpCircle } from "lucide-react";

interface IncidentHeaderProps {
  state: DemoState;
}

export function IncidentHeader({ state }: IncidentHeaderProps) {
  const { incident, reports, brief, volunteers } = state;

  const availableVolunteers = volunteers.filter((v) => v.available).length;
  const reportsCount = reports.length;
  const claimsCount = brief.claims.length;
  const unknownsCount = brief.unknowns.length;

  return (
    <div style={{ marginBottom: "28px" }}>
      {/* Calm Stay-Safe & Simulation Reminder Banner */}
      <div
        style={{
          background: "var(--caution-bg)",
          border: "1px solid var(--caution-border)",
          borderRadius: "2px",
          padding: "10px 16px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          fontSize: "0.8125rem",
          color: "var(--caution-text)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>
            <strong>Staged Demonstration:</strong> Professional emergency response is simulated. Keep perimeters clear and stay in safe designated zones.
          </span>
        </div>
        <span style={{ fontSize: "0.75rem", opacity: 0.85 }}>
          Not linked to live 911 dispatch
        </span>
      </div>

      {/* Main Header Container */}
      <div
        className="card-light"
        style={{
          padding: "24px 28px",
          background: "#ffffff",
          border: "1px solid var(--cream-hairline)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
              <span className="badge badge-dark" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {incident.category}
              </span>
              <span
                className="badge badge-blue"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span className="pulse-dot" style={{ background: "#05486d" }} />
                Status: {incident.status === "responding" ? "Active Response (Simulated)" : "Monitoring"}
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(1.75rem, 3.5vw, 2.35rem)",
                color: "var(--spruce-main)",
                lineHeight: 1.15,
                fontWeight: 600,
              }}
            >
              {incident.title}
            </h1>

            <p style={{ marginTop: "6px", color: "var(--text-muted)", fontSize: "0.9375rem" }}>
              {incident.description}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              background: "var(--cream-muted)",
              padding: "12px 16px",
              borderRadius: "2px",
              border: "1px solid var(--cream-hairline)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={14} color="var(--spruce-muted)" />
              <span><strong>Address:</strong> {incident.address}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Shield size={14} color="var(--spruce-muted)" />
              <span><strong>Staging Area:</strong> {incident.stagingArea}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={14} color="var(--spruce-muted)" />
              <span>
                <strong>Opened:</strong>{" "}
                {new Date(incident.reportedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>

        {/* Operational Metrics Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid var(--cream-hairline)",
          }}
        >
          <div style={{ padding: "10px 14px", background: "var(--cream)", borderRadius: "2px", border: "1px solid var(--cream-hairline)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.75rem" }}>
              <FileText size={13} />
              <span>WITNESS REPORTS</span>
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 600, color: "var(--spruce-main)", marginTop: "2px" }}>
              {reportsCount}
            </div>
          </div>

          <div style={{ padding: "10px 14px", background: "var(--cream)", borderRadius: "2px", border: "1px solid var(--cream-hairline)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.75rem" }}>
              <Shield size={13} />
              <span>SYNTHESIZED CLAIMS</span>
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 600, color: "var(--spruce-main)", marginTop: "2px" }}>
              {claimsCount}
            </div>
          </div>

          <div style={{ padding: "10px 14px", background: "var(--cream)", borderRadius: "2px", border: "1px solid var(--cream-hairline)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.75rem" }}>
              <HelpCircle size={13} />
              <span>OPEN UNKNOWNS</span>
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 600, color: "var(--spruce-main)", marginTop: "2px" }}>
              {unknownsCount}
            </div>
          </div>

          <div style={{ padding: "10px 14px", background: "var(--cream)", borderRadius: "2px", border: "1px solid var(--cream-hairline)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.75rem" }}>
              <Users size={13} />
              <span>AVAILABLE VOLUNTEERS</span>
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 600, color: "var(--spruce-main)", marginTop: "2px" }}>
              {availableVolunteers} <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--text-muted)" }}>/ {volunteers.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
