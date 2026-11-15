"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, MessageSquare, Mic } from "lucide-react";
import type { WitnessReport } from "../lib/types";

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60000));
  return minutes < 1 ? "now" : minutes < 60 ? `${minutes}m` : minutes < 1440 ? `${Math.floor(minutes / 60)}h` : `${Math.floor(minutes / 1440)}d`;
}

export function WitnessFeed({ reports, selectedReportId, onSelectReport }: { reports: WitnessReport[]; incidentId: string; selectedReportId?: string | null; onSelectReport?: (id: string | null) => void }) {
  const previous = useRef(new Set(reports.map((report) => report.id)));
  const [arrived, setArrived] = useState<Set<string>>(new Set());
  useEffect(() => {
    const added = reports.filter((report) => !previous.current.has(report.id)).map((report) => report.id);
    previous.current = new Set(reports.map((report) => report.id));
    if (added.length) setArrived((current) => new Set([...current, ...added]));
  }, [reports]);
  useEffect(() => {
    if (!arrived.size) return;
    const timer = window.setTimeout(() => setArrived(new Set()), 2100);
    return () => window.clearTimeout(timer);
  }, [arrived]);
  const sorted = [...reports].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return (
    <div className="console-feed">
      <div className="console-section-heading"><h2>Incoming reports</h2><span className="console-count">{reports.length}</span></div>
      {!reports.length && <p className="console-empty">Awaiting witness reports.</p>}
      <div className="console-report-list custom-scroll">
        {sorted.map((report) => {
          const screened = report.screening?.status === "accepted";
          return <button key={report.id} id={`report-${report.id}`} className={`console-report-row ${selectedReportId === report.id ? "is-selected" : ""} ${arrived.has(report.id) ? "is-new" : ""}`} onClick={() => onSelectReport?.(report.id)} aria-pressed={selectedReportId === report.id} aria-label={`Open ${report.sourceLabel}: ${report.text || report.transcript || report.kind + " report"}`}>
            <span className="console-report-meta"><strong className="console-code">{report.sourceLabel}</strong><span className="console-media-icons" aria-label={`${report.kind} report${report.photoId ? ", photo attached" : ""}${report.audioId ? ", audio attached" : ""}`}><MessageSquare size={12} />{(report.photoId || report.kind === "photo") && <Camera size={12} />}{(report.audioId || report.kind === "voice") && <Mic size={12} />}</span><time dateTime={report.createdAt} title={new Date(report.createdAt).toLocaleString()}>{relativeTime(report.createdAt)}</time></span>
            <span className="console-report-excerpt">{report.text || report.transcript || (report.kind === "photo" ? "Photo report" : "Voice report")}</span>
            <span className="console-report-tags">{report.screening && <span title={screened ? "Screened by Gemini" : report.screening.reason || "This report has not been screened"}>{screened ? "✓ Screened" : "Not screened"}</span>}{report.routing && <span className="console-routing-tag" title={report.routing.reason}>Routed</span>}{report.isSample && <span>Staged</span>}</span>
          </button>;
        })}
      </div>
    </div>
  );
}
