"use client";

import React, { useState } from "react";
import type { CoordinatorNote, DemoState } from "../lib/types";
import { Edit3, Plus, Clock, AlertCircle } from "lucide-react";
import { addCoordinatorNote, ApiError } from "./api";

interface CoordinatorNotesProps {
  notes: CoordinatorNote[];
  incidentId: string;
  onStateUpdated: (state: DemoState) => void;
}

export function CoordinatorNotes({
  notes,
  incidentId,
  onStateUpdated,
}: CoordinatorNotesProps) {
  const [noteText, setNoteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const state = await addCoordinatorNote(incidentId, noteText.trim());
      onStateUpdated(state);
      setNoteText("");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Could not save the note. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card-light" style={{ padding: "24px 28px", marginBottom: "28px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--cream-hairline)",
        }}
      >
        <div>
          <h3 style={{ fontSize: "1.15rem", color: "var(--spruce-main)", fontWeight: 600 }}>
            Coordinator Corrections & Operational Notes
          </h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "2px" }}>
            Add instructions, verify facts, or record staging decisions for arriving units.
          </p>
        </div>
        <span className="badge badge-dark">
          {notes.length} {notes.length === 1 ? "Note" : "Notes"}
        </span>
      </div>

      {errorMsg && (
        <div
          style={{
            background: "var(--danger-bg)",
            border: "1px solid var(--danger-border)",
            borderRadius: "2px",
            padding: "8px 12px",
            marginBottom: "14px",
            fontSize: "0.8125rem",
            color: "var(--danger-text)",
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Existing Notes list */}
      {notes.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "18px" }}>
          No coordinator notes recorded yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
          {notes.map((note) => (
            <div
              key={note.id}
              style={{
                background: "var(--cream-muted)",
                border: "1px solid var(--cream-hairline)",
                borderRadius: "2px",
                padding: "12px 16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--spruce-muted)", textTransform: "uppercase" }}>
                  Coordinator Override / Note
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={12} />
                  {new Date(note.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-main)" }}>
                {note.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* New Note Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          type="text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="e.g. Confirmed north hydrant is clear. Arriving crew staged at North Plaza."
          className="input"
          style={{ flex: 1, minWidth: "240px" }}
        />
        <button
          type="submit"
          disabled={isSubmitting || !noteText.trim()}
          className="btn btn-sm btn-dark"
        >
          <Plus size={14} />
          <span>{isSubmitting ? "Adding..." : "Add Note"}</span>
        </button>
      </form>
    </div>
  );
}
