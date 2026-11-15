"use client";

import React, { useState } from "react";
import type { DemoState, IncidentBrief, WitnessReport } from "../lib/types";
import { Sparkles, Volume2, VolumeX, AlertTriangle, HelpCircle, CheckCircle2, AlertOctagon, RotateCw, Play, Pause } from "lucide-react";
import { generateBrief, fetchNarrationAudio, ApiError } from "./api";

interface BriefCardProps {
  brief: IncidentBrief;
  incidentId: string;
  reports: WitnessReport[];
  onStateUpdated: (state: DemoState) => void;
  onSelectReport: (reportId: string) => void;
}

export function BriefCard({
  brief,
  incidentId,
  reports,
  onStateUpdated,
  onSelectReport,
}: BriefCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [isNarrating, setIsNarrating] = useState(false);
  const [narrationError, setNarrationError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const newState = await generateBrief(incidentId);
      onStateUpdated(newState);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setGenerateError(err.message);
      } else {
        setGenerateError("Failed to update brief. Ensure service is accessible.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNarrate = async () => {
    setIsNarrating(true);
    setNarrationError(null);
    try {
      const blob = await fetchNarrationAudio(incidentId);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setIsPlaying(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setNarrationError(err.message);
      } else {
        setNarrationError("Audio narration could not be generated.");
      }
    } finally {
      setIsNarrating(false);
    }
  };

  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Helper to resolve source label for report ID
  const getSourceLabel = (reportId: string): string => {
    const r = reports.find((item) => item.id === reportId);
    return r?.sourceLabel || "W-?";
  };

  return (
    <div className="card-light" style={{ padding: "24px 28px", marginBottom: "28px" }}>
      {/* Header bar: Title, Mode badge, Revision, Action buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "20px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--cream-hairline)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.06em", color: "var(--spruce-muted)", textTransform: "uppercase" }}>
              INCIDENT CONTEXT BRIEF
            </span>

            {/* Mode badge */}
            {brief.mode === "gemini" ? (
              <span className="badge badge-green" title="Synthesized from witness reports via Gemini">
                <Sparkles size={12} /> AI synthesis (Gemini)
              </span>
            ) : brief.mode === "sample" ? (
              <span className="badge badge-sim" title="Starter brief supplied by the server for this demo">
                Sample brief
              </span>
            ) : (
              <span className="badge badge-caution" title="Synthesized using rule-based local logic">
                Rules-based synthesis
              </span>
            )}

            <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
              Rev #{brief.revision} · Updated {new Date(brief.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          <h2 style={{ fontSize: "1.45rem", color: "var(--spruce-main)", fontWeight: 600 }}>
            {brief.headline}
          </h2>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Audio narration button */}
          <button
            onClick={audioUrl ? toggleAudioPlay : handleNarrate}
            disabled={isNarrating}
            className="btn btn-sm btn-outline-dark"
            aria-label="Narrate brief audio"
          >
            {isNarrating ? (
              <>
                <span className="pulse-dot" style={{ background: "var(--spruce-muted)" }} />
                <span>Generating Voice...</span>
              </>
            ) : isPlaying ? (
              <>
                <Pause size={14} />
                <span>Pause Narration</span>
              </>
            ) : (
              <>
                <Volume2 size={14} />
                <span>{audioUrl ? "Play Narration" : "Listen to Brief"}</span>
              </>
            )}
          </button>

          {/* AI generation button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn btn-sm btn-primary"
            aria-label="Generate live brief with Gemini"
          >
            {isGenerating ? (
              <>
                <span className="pulse-dot" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Update Brief (Gemini)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hidden or active HTML audio element */}
      {audioUrl && (
        <div
          style={{
            background: "var(--cream-muted)",
            padding: "10px 16px",
            borderRadius: "2px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            border: "1px solid var(--cream-hairline)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={toggleAudioPlay}
              className="btn btn-sm btn-dark"
              style={{ padding: "4px 12px" }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <span style={{ fontSize: "0.8125rem", color: "var(--spruce-main)" }}>
              Audio Narration · Generated via ElevenLabs
            </span>
          </div>
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            controls
            style={{ height: "30px", maxWidth: "260px" }}
          />
        </div>
      )}

      {/* Errors display */}
      {generateError && (
        <div
          style={{
            background: "var(--danger-bg)",
            border: "1px solid var(--danger-border)",
            borderRadius: "2px",
            padding: "10px 14px",
            marginBottom: "16px",
            fontSize: "0.8125rem",
            color: "var(--danger-text)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertTriangle size={15} />
          <span>{generateError}</span>
        </div>
      )}

      {narrationError && (
        <div
          style={{
            background: "var(--caution-bg)",
            border: "1px solid var(--caution-border)",
            borderRadius: "2px",
            padding: "10px 14px",
            marginBottom: "16px",
            fontSize: "0.8125rem",
            color: "var(--caution-text)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertOctagon size={15} />
          <span>{narrationError}</span>
        </div>
      )}

      {/* Summary Narrative */}
      <div style={{ marginBottom: "22px" }}>
        <p style={{ fontSize: "1.05rem", lineHeight: 1.6, color: "var(--text-main)" }}>
          {brief.summary}
        </p>
      </div>

      {/* Source-Linked Claims Section */}
      <div style={{ marginBottom: "22px" }}>
        <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--spruce-muted)", letterSpacing: "0.04em", marginBottom: "12px", textTransform: "uppercase" }}>
          Source-Linked Observations & Claims
        </h4>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {brief.claims.map((claim) => {
            const isDisputed = claim.kind === "disputed";
            return (
              <div
                key={claim.id}
                style={{
                  background: isDisputed ? "var(--caution-bg)" : "var(--cream-muted)",
                  border: `1px solid ${isDisputed ? "var(--caution-border)" : "var(--cream-hairline)"}`,
                  borderRadius: "2px",
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                    <span
                      className={`badge ${isDisputed ? "badge-caution" : "badge-blue"}`}
                      style={{ fontSize: "0.6875rem", textTransform: "uppercase", padding: "1px 8px" }}
                    >
                      {claim.kind}
                    </span>
                    <span style={{ fontSize: "0.9375rem", color: "var(--text-main)" }}>
                      {claim.text}
                    </span>
                  </div>

                  {/* Clickable Source Chips */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-dim)" }}>Sources:</span>
                    {claim.reportIds.map((rid) => (
                      <button
                        key={rid}
                        onClick={() => onSelectReport(rid)}
                        title={`View report ${getSourceLabel(rid)}`}
                        style={{
                          background: "var(--spruce-main)",
                          color: "var(--cream)",
                          border: "none",
                          borderRadius: "9999px",
                          padding: "2px 8px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {getSourceLabel(rid)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Disputed / Hearsay Context Note */}
                {claim.note && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.8125rem",
                      color: isDisputed ? "var(--caution-text)" : "var(--text-muted)",
                      fontStyle: "italic",
                      marginTop: "2px",
                    }}
                  >
                    <AlertTriangle size={13} />
                    <span>{claim.note}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Operational Highlights: Conflicts & Unknowns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        {/* Conflicts Box */}
        <div
          style={{
            background: "var(--caution-bg)",
            border: "1px solid var(--caution-border)",
            borderRadius: "2px",
            padding: "14px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--caution-text)", marginBottom: "8px" }}>
            <AlertOctagon size={16} />
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Identified Conflicts & Hearsay
            </span>
          </div>

          {brief.conflicts.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "var(--caution-text)" }}>
              No conflicting witness claims detected.
            </p>
          ) : (
            brief.conflicts.map((conflict, i) => (
              <div key={i} style={{ fontSize: "0.875rem", color: "var(--caution-text)", lineHeight: 1.5 }}>
                <p>{conflict.text}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
                  <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Reports referenced:</span>
                  {conflict.reportIds.map((rid) => (
                    <button
                      key={rid}
                      onClick={() => onSelectReport(rid)}
                      style={{
                        background: "rgba(115, 74, 0, 0.2)",
                        color: "var(--caution-text)",
                        border: "none",
                        borderRadius: "9999px",
                        padding: "1px 6px",
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {getSourceLabel(rid)}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Unknowns Box */}
        <div
          style={{
            background: "var(--cream-muted)",
            border: "1px solid var(--cream-hairline)",
            borderRadius: "2px",
            padding: "14px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--spruce-muted)", marginBottom: "8px" }}>
            <HelpCircle size={16} />
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Critical Unknowns
            </span>
          </div>

          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            {brief.unknowns.map((un, idx) => (
              <li key={idx}>{un}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Suggested Staging Needs */}
      {brief.suggestedNeeds && brief.suggestedNeeds.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          <span style={{ fontWeight: 600 }}>Suggested Staging Needs:</span>
          {brief.suggestedNeeds.map((need, idx) => (
            <span key={idx} className="badge badge-dark" style={{ background: "var(--cream-muted)", color: "var(--spruce-main)", border: "1px solid var(--cream-hairline)" }}>
              {need}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
