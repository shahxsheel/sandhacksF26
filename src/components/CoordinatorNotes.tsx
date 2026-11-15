"use client";

import React, { useState } from "react";
import type { CoordinatorNote, DemoState } from "../lib/types";
import { addCoordinatorNote, ApiError } from "./api";

export function CoordinatorNotes({ notes, incidentId, onStateUpdated }: { notes: CoordinatorNote[]; incidentId: string; onStateUpdated: (state: DemoState) => void }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError(null);
    try { onStateUpdated(await addCoordinatorNote(incidentId, text.trim())); setText(""); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Could not save note. Try again."); }
    finally { setSubmitting(false); }
  };
  return <details className="console-notes">
    <summary>Add note <span>{notes.length > 0 ? `(${notes.length})` : "+"}</span></summary>
    <div className="console-notes-body">
      {notes.map((note) => <article key={note.id}><time dateTime={note.createdAt}>{new Date(note.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time><p>{note.text}</p></article>)}
      {error && <p className="console-inline-error" role="alert">{error}</p>}
      <form onSubmit={handleSubmit}><label htmlFor="coordinator-note">Coordinator note or correction</label><textarea id="coordinator-note" className="textarea" value={text} onChange={(event) => setText(event.target.value)} maxLength={500} placeholder="Add an observation or correction…" disabled={submitting} /><button type="submit" className="btn btn-sm btn-dark" disabled={submitting || !text.trim()}>{submitting ? "Saving…" : "Save note"}</button></form>
    </div>
  </details>;
}
