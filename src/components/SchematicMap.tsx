"use client";

import React from "react";
import type { WitnessReport } from "../lib/types";
import { Flag, Flame } from "lucide-react";

/** Positions of the two staged sample witnesses in this scenario's schematic. */
const STAGED_POSITIONS = [
  { sourceLabel: "W-01", cx: 160, cy: 255, labelDy: 25 },
  { sourceLabel: "W-02", cx: 460, cy: 115, labelDy: -17 },
];

function shorten(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function MapPin({
  report,
  cx,
  cy,
  labelY,
  label,
  selected,
  onSelect,
}: {
  report: WitnessReport;
  cx: number;
  cy: number;
  labelY: number;
  label: string;
  selected: boolean;
  onSelect?: (reportId: string) => void;
}) {
  const select = () => onSelect?.(report.id);
  return (
    <g
      className="map-pin"
      role="button"
      tabIndex={0}
      aria-label={`Show report ${report.sourceLabel} from ${report.location}`}
      aria-pressed={selected}
      style={{ cursor: "pointer", outline: "none" }}
      onClick={select}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={selected ? 18 : 13}
        fill="#063238"
        stroke={selected ? "var(--accent-lime)" : "var(--spruce-light)"}
        strokeWidth="2"
      />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="var(--cream)" fontSize="10" fontWeight="600">
        {report.sourceLabel}
      </text>
      <text x={cx} y={labelY} textAnchor="middle" fill="var(--spruce-light)" fontSize="10">
        {label}
      </text>
    </g>
  );
}

interface SchematicMapProps {
  reports: WitnessReport[];
  stagingArea: string;
  onSelectReport?: (reportId: string) => void;
  selectedReportId?: string | null;
}

export function SchematicMap({
  reports,
  stagingArea,
  onSelectReport,
  selectedReportId,
}: SchematicMapProps) {
  const stagedPins = STAGED_POSITIONS.flatMap((pos) => {
    const report = reports.find((r) => r.isSample && r.sourceLabel === pos.sourceLabel);
    return report ? [{ report, ...pos }] : [];
  });
  const placedIds = new Set(stagedPins.map((p) => p.report.id));
  const otherReports = reports.filter((r) => !placedIds.has(r.id)).slice(0, 6);

  return (
    <div className="card-light" style={{ overflow: "hidden" }}>
      {/* Map Header & Disclaimer */}
      <div
        style={{
          padding: "12px 18px",
          background: "var(--spruce-deep)",
          color: "var(--cream)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          borderBottom: "1px solid var(--spruce-hairline)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--accent-lime)" }}>
            SCENE SCHEMATIC
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--spruce-light)" }}>
            Arts Building & North Campus Area
          </span>
        </div>
        <div
          className="badge badge-sim-dark"
          style={{ fontSize: "0.6875rem", padding: "2px 8px" }}
        >
          DEMO SCHEMATIC · NOT A TACTICAL MAP
        </div>
      </div>

      {/* SVG Canvas Container: scrolls sideways on phones so labels stay legible */}
      <div
        className="custom-scroll-dark"
        style={{
          position: "relative",
          background: "#072327",
          padding: "12px",
          overflowX: "auto",
          userSelect: "none",
        }}
      >
        <svg
          viewBox="0 0 800 480"
          role="group"
          aria-label="Demo schematic of the staged scene with witness report pins"
          style={{ display: "block", width: "100%", minWidth: "560px", height: "auto" }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(161, 194, 198, 0.07)" strokeWidth="1" />
            </pattern>

            {/* Diagonal hazard stripes for smoke area */}
            <pattern id="smokeStripe" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="12" stroke="rgba(255, 171, 171, 0.25)" strokeWidth="3" />
            </pattern>
          </defs>

          {/* Grid background */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Streets / Campus Pathways */}
          {/* North Road: Campus Way */}
          <rect x="0" y="30" width="800" height="36" fill="#031a1d" stroke="rgba(161, 194, 198, 0.15)" strokeWidth="1" />
          <text x="30" y="53" fill="var(--spruce-light)" fontSize="11" letterSpacing="0.08em" fontWeight="600">
            CAMPUS WAY (NORTH ACCESS)
          </text>

          {/* South Road: Plaza Walk */}
          <rect x="0" y="420" width="800" height="40" fill="#031a1d" stroke="rgba(161, 194, 198, 0.15)" strokeWidth="1" />
          <text x="30" y="445" fill="var(--spruce-light)" fontSize="11" letterSpacing="0.08em" fontWeight="600">
            PLAZA WALK (PEDESTRIAN ACCESS)
          </text>

          {/* West Pathway: Library Walk */}
          <rect x="30" y="66" width="36" height="354" fill="#031a1d" stroke="rgba(161, 194, 198, 0.15)" strokeWidth="1" />
          <text x="-250" y="53" fill="var(--spruce-light)" fontSize="11" letterSpacing="0.08em" fontWeight="600" transform="rotate(-90)">
            LIBRARY WALK
          </text>

          {/* Open Courtyard Area */}
          <rect x="100" y="100" width="660" height="290" fill="#05282d" rx="2" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />

          {/* Main Structure: Arts Building Footprint */}
          <g>
            <rect
              x="260"
              y="160"
              width="280"
              height="180"
              fill="#09383e"
              stroke="#437278"
              strokeWidth="1.5"
              rx="2"
            />
            {/* Building Interior Layout lines */}
            <line x1="260" y1="230" x2="540" y2="230" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="390" y1="160" x2="390" y2="340" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" strokeDasharray="3 3" />

            <text x="280" y="195" fill="var(--cream)" fontSize="14" fontWeight="600" letterSpacing="-0.01em">
              ARTS BUILDING
            </text>
            <text x="280" y="215" fill="var(--spruce-light)" fontSize="11">
              Main Academic Structure · 3 Floors
            </text>

            {/* Second floor smoke origin area */}
            <rect
              x="410"
              y="170"
              width="120"
              height="55"
              fill="url(#smokeStripe)"
              stroke="#ff8f8f"
              strokeWidth="1"
              rx="2"
            />
            <g transform="translate(420, 190)">
              <Flame size={14} color="#ff8f8f" />
              <text x="20" y="11" fill="#ffb4b4" fontSize="10" fontWeight="600">
                2nd Floor Smoke Reported
              </text>
            </g>

            {/* West Entrance */}
            <rect x="254" y="240" width="8" height="30" fill="var(--accent-lime)" rx="1" />
            <text x="180" y="258" fill="var(--cream)" fontSize="10" fontWeight="500">
              West Entrance →
            </text>

            {/* North Entrance */}
            <rect x="340" y="154" width="30" height="8" fill="var(--accent-lime)" rx="1" />
            <text x="330" y="145" fill="var(--cream)" fontSize="10" fontWeight="500">
              ↑ North Entrance
            </text>
          </g>

          {/* Staging Area: North Plaza */}
          <g>
            <rect
              x="520"
              y="85"
              width="230"
              height="65"
              fill="rgba(171, 255, 174, 0.08)"
              stroke="var(--accent-lime)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              rx="2"
            />
            {/* Staging Flag Pin */}
            <g transform="translate(535, 100)">
              <circle cx="12" cy="12" r="14" fill="#042718" stroke="var(--accent-lime)" strokeWidth="1.5" />
              <Flag size={14} color="var(--accent-lime)" x="5" y="5" />
              <text x="35" y="12" fill="var(--cream)" fontSize="11" fontWeight="600">
                DESIGNATED STAGING AREA
              </text>
              <text x="35" y="27" fill="var(--spruce-light)" fontSize="10">
                North Plaza · Volunteer assembly point
              </text>
            </g>
          </g>

          {/* Staged sample witnesses have known positions in this scenario. */}
          {stagedPins.map(({ report, cx, cy, labelDy }) => (
            <MapPin
              key={report.id}
              report={report}
              cx={cx}
              cy={cy}
              labelY={cy + labelDy}
              label={`${report.name.split(" ")[0]} · ${shorten(report.location, 22)}`}
              selected={selectedReportId === report.id}
              onSelect={onSelectReport}
            />
          ))}

          {/* Other reports are not geolocated: list them in order with the location the witness described. */}
          {otherReports.length > 0 && (
            <text x="110" y="352" fill="var(--spruce-light)" fontSize="10" letterSpacing="0.06em">
              OTHER REPORTS · DESCRIBED LOCATION, NOT GEOLOCATED
            </text>
          )}
          {otherReports.map((report, idx) => (
            <MapPin
              key={report.id}
              report={report}
              cx={130 + idx * 100}
              cy={372}
              labelY={398}
              label={shorten(report.location, 16)}
              selected={selectedReportId === report.id}
              onSelect={onSelectReport}
            />
          ))}
        </svg>
      </div>

      {/* Map Legend / Caption Footer */}
      <div
        style={{
          padding: "12px 18px",
          background: "var(--cream-muted)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "0.8125rem",
          color: "var(--text-muted)",
          borderTop: "1px solid var(--cream-hairline)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#437278", display: "inline-block" }} />
            Witness report (select to open)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--pale-green-border)", border: "1px solid var(--accent-lime)", display: "inline-block" }} />
            Staging Area: {stagingArea}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "rgba(255, 143, 143, 0.4)", border: "1px solid #ff8f8f", display: "inline-block" }} />
            Reported smoke zone
          </span>
        </div>
        <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
          Coordinators direct volunteers only to the staging area.
        </span>
      </div>
      <style jsx global>{`
        .map-pin:focus-visible circle {
          stroke: var(--accent-lime);
          stroke-width: 4;
        }
      `}</style>
    </div>
  );
}
