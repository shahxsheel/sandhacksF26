"use client";

import React, { useEffect, useState } from "react";
import { Clock, Flag, MapPin } from "lucide-react";
import type { DemoState } from "../lib/types";

export function IncidentHeader({ state }: { state: DemoState }) {
  const { incident } = state;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    // Display clock only. Network requests always follow explicit user actions.
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const seconds = now === null ? 0 : Math.max(0, Math.floor((now - Date.parse(incident.reportedAt)) / 1000)) || 0;
  const elapsed = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map((value) => String(value).padStart(2, "0")).join(":");
  return (
    <div className="console-incident-bar">
      <div className="console-incident-heading">
        <span className="console-code">{incident.code}</span>
        <h1>{incident.title}</h1>
        <span className="console-active"><span />{incident.status === "responding" ? "ACTIVE" : "MONITORING"}</span>
        <span className="console-clock" title="Elapsed since incident reported"><Clock size={13} />{now === null ? "--:--:--" : elapsed}</span>
        <span className="console-training" title="Staged exercise. No real emergency response or volunteer dispatch.">TRAINING EXERCISE</span>
      </div>
      <div className="console-incident-meta">
        <span><MapPin size={13} /><span>{incident.address}</span></span>
        <span><Flag size={13} /><span><span className="console-meta-label">Staging</span> {incident.stagingArea}</span></span>
      </div>
    </div>
  );
}
