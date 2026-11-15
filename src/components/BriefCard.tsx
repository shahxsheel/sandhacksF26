"use client";

import React, { useEffect, useRef, useState } from "react";
import { Pause, Volume2, RotateCw } from "lucide-react";
import type { DemoState, IncidentBrief, WitnessReport } from "../lib/types";
import { generateBrief, fetchNarrationAudio, ApiError } from "./api";

interface BriefCardProps {
  brief: IncidentBrief;
  incidentId: string;
  reports: WitnessReport[];
  onStateUpdated: (state: DemoState) => void;
  onSelectReport: (reportId: string) => void;
}

export function BriefCard({ brief, incidentId, reports, onStateUpdated, onSelectReport }: BriefCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isNarrating, setIsNarrating] = useState(false);
  const [narrationError, setNarrationError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const narrationVersion = useRef(0);

  useEffect(() => {
    if (!audioUrl) return;
    return () => URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);
  useEffect(() => {
    narrationVersion.current += 1;
    setAudioUrl(null);
    setIsPlaying(false);
    setIsNarrating(false);
    setNarrationError(null);
    return () => { narrationVersion.current += 1; };
  }, [brief.revision, incidentId]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try { onStateUpdated(await generateBrief(incidentId)); }
    catch (err) { setGenerateError(err instanceof ApiError ? err.message : "Could not regenerate brief. Try again."); }
    finally { setIsGenerating(false); }
  };
  const handleNarrate = async () => {
    const version = ++narrationVersion.current;
    setIsNarrating(true);
    setNarrationError(null);
    try {
      const blob = await fetchNarrationAudio(incidentId);
      if (version === narrationVersion.current) setAudioUrl(URL.createObjectURL(blob));
    } catch (err) {
      if (version === narrationVersion.current) setNarrationError(err instanceof ApiError ? err.message : "Audio narration unavailable. Try again.");
    } finally { if (version === narrationVersion.current) setIsNarrating(false); }
  };
  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else void audioRef.current.play().catch(() => setNarrationError("Use the audio player to start playback."));
  };
  const sources = (ids: string[]) => <span className="console-source-links">{ids.map((id) => <button key={id} onClick={() => onSelectReport(id)} title="Open source report" aria-label={`View source report ${reports.find((report) => report.id === id)?.sourceLabel || id}`}>{reports.find((report) => report.id === id)?.sourceLabel || "W-?"}</button>)}</span>;
  const sourceCount = new Set(brief.claims.flatMap((claim) => claim.reportIds).concat(brief.conflicts.flatMap((conflict) => conflict.reportIds))).size;
  const provenance = brief.mode === "gemini" ? "Synthesized by Gemini from witness reports" : brief.mode === "sample" ? "Staged starter brief" : "Prepared locally from report text without AI";

  return <div className="console-brief">
    <div className="console-section-heading"><h2>Incident brief</h2><button className="btn btn-sm btn-outline-dark" onClick={audioUrl ? toggleAudio : handleNarrate} disabled={isNarrating} title="Audio narration by ElevenLabs" aria-label={isPlaying ? "Pause brief narration" : "Listen to brief"}>{isPlaying ? <Pause size={12} /> : <Volume2 size={12} />}{isNarrating ? "Preparing…" : isPlaying ? "Pause" : "Listen"}</button></div>
    <div className="console-brief-content custom-scroll" tabIndex={0} role="region" aria-label="Brief content">
      <p className="console-brief-version" title={provenance}>Brief v{brief.revision} · {sourceCount} sources · <time dateTime={brief.updatedAt}>{new Date(brief.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></p>
      <h3 className="console-brief-headline">{brief.headline}</h3>
      <p className="console-brief-summary">{brief.summary}</p>
      {audioUrl && <audio ref={audioRef} src={audioUrl} autoPlay controls onEnded={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onError={() => setNarrationError("Recording could not be played. Try again.")} className="console-brief-audio" />}
      {generateError && <p className="console-inline-error" role="alert">{generateError}</p>}
      {narrationError && <p className="console-inline-error" role="alert">{narrationError}</p>}
      <div className="console-claims">
        <h4>Observations & claims</h4>
        {brief.claims.length ? brief.claims.map((claim) => <div key={claim.id} className={`console-claim ${claim.kind === "disputed" ? "is-disputed" : ""}`}><span className="console-claim-kind">{claim.kind}</span><p>{claim.text} {sources(claim.reportIds)}</p>{claim.note && <small>{claim.note}</small>}</div>) : <p className="console-empty">No source-linked claims yet.</p>}
      </div>
      {brief.conflicts.length > 0 && <div className="console-brief-section console-conflicts"><h4>Conflicts & hearsay</h4>{brief.conflicts.map((conflict, index) => <p key={index}>{conflict.text} {sources(conflict.reportIds)}</p>)}</div>}
      {brief.unknowns.length > 0 && <div className="console-brief-section"><h4>Still unknown</h4><ul>{brief.unknowns.map((unknown, index) => <li key={index}>{unknown}</li>)}</ul></div>}
      {brief.suggestedNeeds.length > 0 && <div className="console-brief-section"><h4>Staging needs</h4><p>{brief.suggestedNeeds.join(" · ")}</p></div>}
    </div>
    <div className="console-brief-actions">
      <button className="btn btn-sm btn-primary console-regenerate" onClick={handleGenerate} disabled={isGenerating} title="Regenerate from current reports with Gemini"><RotateCw size={13} className={isGenerating ? "spin" : ""} />{isGenerating ? "Regenerating…" : "Regenerate brief"}</button>
    </div>
  </div>;
}
