"use client";

import React from "react";
import type { WitnessReport } from "../lib/types";
import { Flag } from "lucide-react";

/** Positions of the two staged sample witnesses in this scenario's schematic. */
const STAGED_POSITIONS = [
  { sourceLabel: "W-01", cx: 335, cy: 255, labelDy: 25 },
  { sourceLabel: "W-02", cx: 235, cy: 130, labelDy: 30 },
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
            North Campus canyon edge · La Jolla
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

          {/* Campus, rim walkway and canyon are illustrative, not navigation. */}
          <rect x="35" y="180" width="105" height="100" fill="#09383e" stroke="#437278" />
          <rect x="160" y="185" width="100" height="95" fill="#09383e" stroke="#437278" />
          <text x="45" y="205" fill="var(--cream)" fontSize="11">Campus buildings</text>
          <path d="M 310 75 L 310 335" stroke="#437278" strokeWidth="14" fill="none" />
          <text x="320" y="192" fill="var(--spruce-light)" fontSize="11">West walkway · canyon rim</text>
          <path d="M 410 65 Q 350 160 420 330 M 465 65 Q 405 160 475 330 M 520 65 Q 460 160 530 330 M 575 65 Q 515 160 585 330 M 630 65 Q 570 160 640 330 M 685 65 Q 625 160 695 330 M 740 65 Q 680 160 750 330" fill="none" stroke="#437278" strokeOpacity="0.45" strokeWidth="2" />
          <path d="M 485 180 Q 555 150 635 190 L 650 255 Q 560 285 490 245 Z" fill="url(#smokeStripe)" stroke="#ff8f8f" />
          <text x="495" y="215" fill="#ffb4b4" fontSize="11">Reported fire area</text>
          <text x="495" y="230" fill="#ffb4b4" fontSize="10">(canyon slope)</text>
          <path d="M 735 90 Q 655 150 710 220 T 680 315" fill="none" stroke="var(--spruce-light)" strokeWidth="2" strokeDasharray="5 5" />
          <text x="535" y="315" fill="var(--cream)" fontSize="11">Canyon trail (status unknown)</text>
          <rect x="70" y="70" width="200" height="80" fill="rgba(171, 255, 174, 0.08)" stroke="var(--accent-lime)" strokeDasharray="4 4" />
          <g transform="translate(85, 80)">
            <Flag size={14} color="var(--accent-lime)" />
            <text x="22" y="12" fill="var(--cream)" fontSize="11" fontWeight="600">NORTH PLAZA</text>
            <text x="22" y="27" fill="var(--spruce-light)" fontSize="10">Designated staging point</text>
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
            Reported fire area
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
