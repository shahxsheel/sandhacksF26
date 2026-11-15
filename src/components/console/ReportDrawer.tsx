"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import type { WitnessReport } from "../../lib/types";

function ReportDetail({ report, incidentId }: { report: WitnessReport; incidentId: string }) {
  const [mediaErrors, setMediaErrors] = useState<Record<string, boolean>>({});
  const mediaUrl = (id: string) => `/api/media/${encodeURIComponent(id)}?incidentId=${encodeURIComponent(incidentId)}`;
  return <article className="console-report-detail">
    <div className="console-detail-meta"><strong className="console-code">{report.sourceLabel}</strong><span>{report.name}</span>{report.isSample && <span className="console-detail-tag">Staged</span>}</div>
    <time className="console-detail-time" dateTime={report.createdAt}>{new Date(report.createdAt).toLocaleString()}</time>
    <p className="console-detail-location"><MapPin size={14} />{report.location || "Location not provided"}</p>
    {report.text && <section><h3>Witness statement</h3><p>{report.text}</p></section>}
    {report.transcript && <section><h3>Voice transcript</h3><p>{report.transcript}</p></section>}
    {report.transcriptionStatus === "failed" && <p className="console-inline-error">Transcription unavailable. Review the original recording.</p>}
    {report.photoId && <section><h3>Photo evidence</h3>{mediaErrors[report.photoId] ? <p className="console-inline-error">Photo unavailable. Try reopening the report.</p> : <a href={mediaUrl(report.photoId)} target="_blank" rel="noreferrer" aria-label={`Open full photo from ${report.sourceLabel}`}><img src={mediaUrl(report.photoId)} alt={`Witness evidence submitted by ${report.sourceLabel}`} onError={() => setMediaErrors((current) => ({ ...current, [report.photoId!]: true }))} /></a>}</section>}
    {report.audioId && <section><h3>Original recording</h3>{mediaErrors[report.audioId] ? <p className="console-inline-error">Recording unavailable. Try reopening the report.</p> : <audio controls preload="none" src={mediaUrl(report.audioId)} onError={() => setMediaErrors((current) => ({ ...current, [report.audioId!]: true }))} />}</section>}
    {report.screening && <section className={report.screening.status === "flagged" ? "console-held-reason" : ""}><h3>{report.screening?.status === "flagged" ? "Held for review" : report.screening?.status === "accepted" ? "✓ Screened" : "Not screened"}</h3><p>{report.screening?.reason || "No screening result available."}</p>{report.screening?.status === "accepted" && <small>Screened by Gemini</small>}</section>}
    {report.routing && <section><h3><span className="console-routing-tag">Routed</span></h3><p>{report.routing.reason}</p><small>Incident routing by Gemini</small></section>}
  </article>;
}

export function ReportDrawer({ report, heldReports, incidentId, open, onClose }: { report?: WitnessReport; heldReports?: WitnessReport[]; incidentId: string; open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => {
    if (open) ref.current?.querySelector(".console-drawer-body")?.scrollTo(0, 0);
  }, [open, report?.id, heldReports]);
  return <dialog ref={ref} className="console-report-drawer" aria-labelledby="report-drawer-title" onCancel={onClose} onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="console-drawer-inner">
      <header className="console-drawer-heading"><div><span className="console-eyebrow">Evidence review</span><h2 id="report-drawer-title">{heldReports ? `Held for review (${heldReports.length})` : `Report ${report?.sourceLabel || ""}`}</h2></div><button className="btn btn-sm btn-outline-dark" onClick={onClose} aria-label="Close report drawer" autoFocus><X size={16} /></button></header>
      <div className="console-drawer-body custom-scroll">{open && (heldReports ? heldReports.length ? [...heldReports].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).map((item) => <ReportDetail key={item.id} report={item} incidentId={incidentId} />) : <p className="console-empty">No reports held for review.</p> : report ? <ReportDetail key={report.id} report={report} incidentId={incidentId} /> : <p className="console-empty">This report is no longer in the feed.</p>)}</div>
    </div>
  </dialog>;
}
