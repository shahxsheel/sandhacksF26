"use client";

import React from "react";
import type { TimelineEvent } from "../lib/types";
import { Clock, MessageSquare, Sparkles, UserCheck, Edit3, Info } from "lucide-react";

interface TimelineFeedProps {
  events: TimelineEvent[];
}

export function TimelineFeed({ events }: TimelineFeedProps) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "report":
        return <MessageSquare size={13} color="var(--soft-blue-text)" />;
      case "brief":
        return <Sparkles size={13} color="var(--accent-lime-text)" />;
      case "assignment":
        return <UserCheck size={13} color="var(--pale-green-text)" />;
      case "note":
        return <Edit3 size={13} color="var(--caution-text)" />;
      case "system":
      default:
        return <Info size={13} color="var(--spruce-muted)" />;
    }
  };

  const getEventBadgeClass = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "report":
        return "badge-blue";
      case "brief":
        return "badge-green";
      case "assignment":
        return "badge-green";
      case "note":
        return "badge-caution";
      case "system":
      default:
        return "badge-dark";
    }
  };

  return (
    <div className="card-light fl-card-pad">
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
        <h3 style={{ fontSize: "1.15rem", color: "var(--spruce-main)", fontWeight: 600 }}>
          Incident Log & Timeline
        </h3>
        <span className="badge badge-dark">
          {events.length} Entries
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "380px", overflowY: "auto" }} className="custom-scroll">
        {sortedEvents.map((evt) => (
          <div
            key={evt.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "10px 12px",
              background: "var(--cream-muted)",
              borderRadius: "2px",
              border: "1px solid var(--cream-hairline)",
            }}
          >
            <div
              style={{
                marginTop: "2px",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "#ffffff",
                border: "1px solid var(--cream-hairline)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {getEventIcon(evt.type)}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <span className={`badge ${getEventBadgeClass(evt.type)}`} style={{ fontSize: "0.6875rem", textTransform: "capitalize", padding: "1px 6px" }}>
                  {evt.type}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "3px" }}>
                  <Clock size={11} />
                  {new Date(evt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
              <p style={{ fontSize: "0.875rem", color: "var(--text-main)", marginTop: "4px" }}>
                {evt.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
