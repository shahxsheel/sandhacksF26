"use client";

import React from "react";
import type { TimelineEvent } from "../lib/types";

export function TimelineFeed({ events }: { events: TimelineEvent[] }) {
  return <div className="console-event-log">
    <div className="console-section-heading"><h2>Event log</h2><span className="console-count">{events.length} entries</span><span className="console-log-order">Newest first</span></div>
    <div className="console-log-rows custom-scroll" tabIndex={0} role="region" aria-label="Scrollable event log">
      {events.length ? [...events].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).map((event) => <div key={event.id} className="console-log-row"><time dateTime={event.createdAt} title={new Date(event.createdAt).toLocaleString()}>{new Date(event.createdAt).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time><span className={`console-log-type type-${event.type}`}>{event.type}</span><p>{event.text}</p></div>) : <p className="console-empty">No events recorded.</p>}
    </div>
  </div>;
}
