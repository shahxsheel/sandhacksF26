"use client";

import React, { useState } from "react";
import type { WitnessReport } from "../lib/types";
import { MessageSquare, Camera, Mic, ChevronDown, ChevronUp, Clock, MapPin, Eye, FileAudio, AlertCircle } from "lucide-react";

interface WitnessFeedProps {
  reports: WitnessReport[];
  incidentId: string;
  selectedReportId?: string | null;
  onSelectReport?: (reportId: string | null) => void;
}

export function WitnessFeed({
  reports,
  incidentId,
  selectedReportId,
  onSelectReport,
}: WitnessFeedProps) {
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [mediaErrors, setMediaErrors] = useState<Record<string, string>>({});

  const markMediaError = (key: string, label: string) => {
    setMediaErrors((prev) => (prev[key] ? prev : { ...prev, [key]: label }));
  };

  // Selecting a source (from the brief or map) opens that report; the header toggles it closed again.
  const toggleReport = (id: string, isExpanded: boolean) => {
    setExpandedReportId(isExpanded ? null : id);
    onSelectReport?.(isExpanded ? null : id);
  };

  React.useEffect(() => {
    if (!activePhoto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActivePhoto(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activePhoto]);

  return (
    <div className="card-light fl-card-pad" style={{ marginBottom: "28px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px 12px",
          marginBottom: "18px",
          paddingBottom: "14px",
          borderBottom: "1px solid var(--cream-hairline)",
        }}
      >
        <div>
          <h3 style={{ fontSize: "1.15rem", color: "var(--spruce-main)", fontWeight: 600 }}>
            Witness Evidence Feed
          </h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "2px" }}>
            Bystander reports, photos and voice notes. Staged sample entries are labeled.
          </p>
        </div>
        <span className="badge badge-dark">
          {reports.length} {reports.length === 1 ? "Report" : "Reports"}
        </span>
      </div>

      {reports.length === 0 ? (
        <div style={{ textAlign: "center", padding: "36px 16px", color: "var(--text-muted)" }}>
          <MessageSquare size={32} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
          <p>No witness reports received yet.</p>
          <p style={{ fontSize: "0.8125rem", marginTop: "4px" }}>
            Share the witness form link with nearby bystanders.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {reports.map((report) => {
            const isSelected = selectedReportId === report.id;
            const isExpanded = expandedReportId === report.id || isSelected;

            return (
              <div
                key={report.id}
                id={`report-${report.id}`}
                style={{
                  background: isSelected ? "var(--pale-green)" : "#ffffff",
                  border: isSelected ? "1px solid var(--pale-green-border)" : "1px solid var(--cream-hairline)",
                  borderRadius: "2px",
                  padding: "16px 20px",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 0 0 2px var(--accent-lime-glow)" : "none",
                }}
              >
                {/* Top header row: Label, Name, Location, Kind, Time, Expand toggle */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                  onClick={() => toggleReport(report.id, isExpanded)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        background: "var(--spruce-main)",
                        color: "var(--cream)",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                      }}
                    >
                      {report.sourceLabel}
                    </span>

                    <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--spruce-main)" }}>
                      {report.name}
                    </span>

                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      <MapPin size={13} />
                      {report.location}
                    </span>

                    {/* Report kind pill */}
                    {report.kind === "photo" && (
                      <span className="badge badge-blue" style={{ fontSize: "0.6875rem" }}>
                        <Camera size={11} /> Photo Included
                      </span>
                    )}
                    {report.kind === "voice" && (
                      <span className="badge badge-green" style={{ fontSize: "0.6875rem" }}>
                        <Mic size={11} /> Voice Recorded
                      </span>
                    )}
                    {report.isSample && (
                      <span className="badge badge-dark" style={{ fontSize: "0.6875rem" }}>
                        Sample
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} />
                      {new Date(report.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>

                    <button
                      type="button"
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} report ${report.sourceLabel}`}
                      aria-expanded={isExpanded}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--spruce-muted)" }}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Primary report text */}
                <div style={{ marginTop: "10px" }}>
                  <p style={{ fontSize: "0.9375rem", color: "var(--text-main)", lineHeight: 1.55 }}>
                    {report.text}
                  </p>
                </div>

                {/* Expanded details (Voice transcript, Photo preview, Audio player) */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: "14px",
                      paddingTop: "14px",
                      borderTop: "1px solid var(--cream-hairline)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {/* Voice audio & transcript */}
                    {report.kind === "voice" && (
                      <div
                        style={{
                          background: "var(--cream-muted)",
                          padding: "12px 14px",
                          borderRadius: "2px",
                          border: "1px solid var(--cream-hairline)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--spruce-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                            <FileAudio size={14} /> Recorded Voice Evidence
                          </span>

                          {report.transcriptionStatus && (
                            <span
                              className={`badge ${
                                report.transcriptionStatus === "completed"
                                  ? "badge-green"
                                  : report.transcriptionStatus === "failed"
                                  ? "badge-danger"
                                  : "badge-dark"
                              }`}
                              style={{ fontSize: "0.6875rem" }}
                            >
                              Transcription: {report.transcriptionStatus}
                            </span>
                          )}
                        </div>

                        {report.audioId && (
                          <>
                            {!mediaErrors[`audio-${report.id}`] ? (
                              <audio
                                controls
                                src={`/api/media/${report.audioId}?incidentId=${incidentId}`}
                                style={{ width: "100%", height: "36px", marginBottom: "8px" }}
                                onError={() => markMediaError(`audio-${report.id}`, "Could not load audio evidence.")}
                              />
                            ) : (
                              <p
                                style={{
                                  fontSize: "0.8125rem",
                                  color: "var(--danger-text)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <AlertCircle size={14} />
                                {mediaErrors[`audio-${report.id}`]}
                              </p>
                            )}
                          </>
                        )}

                        {report.transcript && (
                          <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", background: "#ffffff", padding: "8px 12px", borderRadius: "2px", border: "1px solid var(--cream-hairline)" }}>
                            <strong>Transcript:</strong> “{report.transcript}”
                          </div>
                        )}
                      </div>
                    )}

                    {/* Photo preview */}
                    {report.photoId && (
                      <div style={{ marginTop: "4px" }}>
                        <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--spruce-main)", marginBottom: "6px" }}>
                          Attached Photo:
                        </div>
                        {!mediaErrors[`photo-${report.id}`] ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setActivePhoto(`/api/media/${report.photoId}?incidentId=${incidentId}`)}
                              aria-label={`Enlarge photo from report ${report.sourceLabel}`}
                              style={{ display: "block", padding: 0, border: "none", background: "none", cursor: "pointer", borderRadius: "2px" }}
                            >
                              <img
                                src={`/api/media/${report.photoId}?incidentId=${incidentId}`}
                                alt={`Photo attached to report ${report.sourceLabel} by ${report.name}`}
                                onError={() => markMediaError(`photo-${report.id}`, "Could not load photo evidence.")}
                                style={{
                                  display: "block",
                                  maxWidth: "min(240px, 100%)",
                                  maxHeight: "160px",
                                  objectFit: "cover",
                                  borderRadius: "2px",
                                  border: "1px solid var(--cream-hairline)",
                                }}
                              />
                            </button>
                            <span style={{ fontSize: "0.6875rem", color: "var(--text-dim)", display: "block", marginTop: "4px" }}>
                              Click to enlarge
                            </span>
                          </>
                        ) : (
                          <p
                            style={{
                              fontSize: "0.8125rem",
                              color: "var(--danger-text)",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <AlertCircle size={14} />
                            {mediaErrors[`photo-${report.id}`]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox photo modal */}
      {activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged witness photo"
          onClick={() => setActivePhoto(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 25, 28, 0.85)",
            backdropFilter: "blur(4px)",
            zIndex: 150,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img
              src={activePhoto}
              alt="Enlarged witness evidence"
              style={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.2)" }}
            />
            <button
              type="button"
              autoFocus
              onClick={() => setActivePhoto(null)}
              className="btn btn-sm btn-outline-light"
              style={{ position: "absolute", top: "-40px", right: 0 }}
            >
              Close ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
