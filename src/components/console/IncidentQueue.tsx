"use client";

import React from "react";
import type { IncidentSummary } from "../../lib/types";

export function IncidentQueue({ incidents, selectedId, onSelect, disabled }: { incidents: IncidentSummary[]; selectedId: string; onSelect: (id: string) => void; disabled?: boolean }) {
  return (
    <section className="console-queue" aria-label="Incident queue">
      <div className="console-section-heading"><h2>Incident queue</h2><span className="console-count">{incidents.length}</span></div>
      <div className="console-queue-list">
        {incidents.map((incident) => <button key={incident.id} type="button" className={`console-queue-item ${selectedId === incident.id ? "is-selected" : ""}`} aria-pressed={selectedId === incident.id} disabled={disabled} onClick={() => onSelect(incident.id)}>
          <span className="console-queue-code"><span className="console-code">{incident.code}</span><span className="console-queue-status">{incident.status === "responding" ? "Active" : "Monitoring"}</span></span>
          <strong>{incident.title}</strong>
          <span className="console-queue-counts">{incident.reportCount} reports <span>·</span> {incident.withheldCount} held</span>
        </button>)}
      </div>
    </section>
  );
}
