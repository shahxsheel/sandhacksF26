"use client";

import React, { useState } from "react";
import type { Volunteer, Assignment, DemoState } from "../lib/types";
import { assignVolunteer, ApiError } from "./api";

interface VolunteerCardsProps {
  volunteers: Volunteer[];
  assignments: Assignment[];
  incidentId: string;
  stagingArea?: string;
  onStateUpdated: (state: DemoState) => void;
}

export function VolunteerCards({ volunteers, assignments, incidentId, stagingArea = "designated staging point", onStateUpdated }: VolunteerCardsProps) {
  const tasks = [
    `Bring supply kit to ${stagingArea}`,
    `Staff language support desk at ${stagingArea}`,
    `Assist with check-in and roster at ${stagingArea}`,
    `Provide hydration and logistics support at ${stagingArea}`,
  ];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [taskText, setTaskText] = useState(tasks[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAssign = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId || !taskText.trim()) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const next = await assignVolunteer(incidentId, selectedId, taskText.trim());
      setSuccess("Staging task approved · simulated assignment");
      setSelectedId(null);
      onStateUpdated(next);
    } catch (err) { setError(err instanceof ApiError ? err.message : "Could not approve staging task. Try again."); }
    finally { setSubmitting(false); }
  };

  return <div className="console-volunteers">
    <div className="console-section-heading"><h2>Volunteers</h2><span className="console-count">{volunteers.filter((volunteer) => volunteer.available && !assignments.some((assignment) => assignment.volunteerId === volunteer.id && assignment.status !== "declined")).length} available</span></div>
    <div className="console-volunteer-content">
      <span className="console-safety-chip" title={`Coordinator approval required. Destination: ${stagingArea}. No real dispatch.`}>Simulated · staging point only</span>
      {error && <p className="console-inline-error" role="alert">{error}</p>}
      {success && <p className="console-success" role="status">{success}</p>}
      {!volunteers.length && <p className="console-empty">No registered volunteers.</p>}
      {volunteers.map((volunteer) => {
        const active = assignments.find((assignment) => assignment.volunteerId === volunteer.id && assignment.status !== "declined");
        const selected = selectedId === volunteer.id;
        return <div key={volunteer.id} className="console-volunteer-row">
          <div className="console-volunteer-heading"><span className="console-initials" aria-hidden="true">{volunteer.initials}</span><div><strong>{volunteer.name}</strong><span>{volunteer.role}</span></div><span className="console-distance" title="Staged distance, not a travel time">{volunteer.distanceMeters}m</span></div>
          <div className="console-volunteer-skills" title={volunteer.bio}>{volunteer.skills.join(" · ")}</div>
          <div className="console-volunteer-actions"><span className="console-volunteer-status">{active ? active.status === "accepted" ? "Accepted" : "Awaiting acceptance" : volunteer.available ? "Available" : "Unavailable"}</span><button type="button" className="btn btn-sm btn-outline-dark" disabled={!volunteer.available || Boolean(active) || submitting} aria-expanded={selected} aria-label={selected ? `Cancel task for ${volunteer.name}` : `Assign a staging task to ${volunteer.name}`} onClick={() => { setSelectedId(selected ? null : volunteer.id); setTaskText(tasks[0]); setError(null); }}>{selected ? "Cancel" : "Assign task"}</button></div>
        </div>;
      })}
      {selectedId && <form className="console-assignment-form" onSubmit={handleAssign}>
        <h3>Approve {volunteers.find((volunteer) => volunteer.id === selectedId)?.name}</h3>
        <p className="console-assignment-destination">Staging: {stagingArea}</p>
        <label htmlFor="volunteer-task-preset">Staging task</label>
        <select id="volunteer-task-preset" className="select" value={tasks.includes(taskText) ? taskText : ""} onChange={(event) => setTaskText(event.target.value)} disabled={submitting}>{!tasks.includes(taskText) && <option value="" disabled>Custom instruction</option>}{tasks.map((task) => <option key={task} value={task}>{task}</option>)}</select>
        <label htmlFor="volunteer-task-text">Instruction · staging support only</label>
        <textarea id="volunteer-task-text" className="textarea" value={taskText} onChange={(event) => setTaskText(event.target.value)} maxLength={200} required disabled={submitting} />
        <button type="submit" className="btn btn-sm btn-primary" disabled={submitting || !taskText.trim()}>{submitting ? "Approving…" : "Approve for staging point"}</button>
      </form>}
      {assignments.length > 0 && <details className="console-assignments"><summary>Assignments ({assignments.length})</summary>{[...assignments].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).map((assignment) => <div key={assignment.id}><div className="console-assignment-heading"><strong>{volunteers.find((volunteer) => volunteer.id === assignment.volunteerId)?.name || "Volunteer"}</strong><span>{assignment.status === "approved" ? "Pending acceptance" : assignment.status}</span></div><p>{assignment.task}</p><time dateTime={assignment.createdAt}>{new Date(assignment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>)}</details>}
    </div>
  </div>;
}
