"use client";

import React, { useId } from "react";
import type { IncidentScene, WitnessReport } from "../lib/types";
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
  scene?: IncidentScene;
  reports: WitnessReport[];
  stagingArea: string;
  onSelectReport?: (reportId: string) => void;
  selectedReportId?: string | null;
}

export function SchematicMap({
  scene = "canyon-fire",
  reports,
  stagingArea,
  onSelectReport,
  selectedReportId,
}: SchematicMapProps) {
  const mapId = useId();
  const gridId = `${mapId}-grid`;
  const stripeId = `${mapId}-reported`;
  const isCanyon = scene === "canyon-fire";
  const sceneLabel = scene === "street-flood"
    ? "Genesee Avenue underpass · University City"
    : scene === "bluff-collapse"
      ? "Coastal bluff · Torrey Pines / Black’s Beach"
      : "North Campus canyon edge · La Jolla";
  const reportedArea = scene === "street-flood"
    ? "Reported flooding (underpass)"
    : scene === "bluff-collapse" ? "Reported bluff failure" : "Reported fire area";
  const stagedPins = (isCanyon ? STAGED_POSITIONS : []).flatMap((pos) => {
    const report = reports.find((r) => r.isSample && r.sourceLabel === pos.sourceLabel);
    return report ? [{ report, ...pos }] : [];
  });
  const placedIds = new Set(stagedPins.map((p) => p.report.id));
  const otherReports = reports.filter((r) => !placedIds.has(r.id)).slice(0, isCanyon ? 6 : 8);

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
            {sceneLabel}
          </span>
        </div>
        <div
          className="badge badge-sim-dark"
          style={{ fontSize: "0.6875rem", padding: "2px 8px" }}
        >
          DEMO MAP · SCHEMATIC, NOT TO SCALE
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
          viewBox={isCanyon ? "0 0 800 480" : "0 0 800 620"}
          role="group"
          aria-label={`Demo map — schematic, not to scale. ${sceneLabel}. Witness pins show described locations.`}
          style={{ display: "block", width: "100%", minWidth: isCanyon ? "560px" : "800px", height: "auto" }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id={gridId} width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(161, 194, 198, 0.07)" strokeWidth="1" />
            </pattern>

            {/* Diagonal hazard stripes for smoke area */}
            <pattern id={stripeId} width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="12" stroke="rgba(255, 171, 171, 0.25)" strokeWidth="3" />
            </pattern>
          </defs>

          {/* Grid background */}
          <rect width="100%" height="100%" fill={`url(#${gridId})`} />

          {isCanyon && (
            <g>
          {/* Campus, rim walkway and canyon are illustrative, not navigation. */}
          <rect x="35" y="180" width="105" height="100" fill="#09383e" stroke="#437278" />
          <rect x="160" y="185" width="100" height="95" fill="#09383e" stroke="#437278" />
          <text x="45" y="205" fill="var(--cream)" fontSize="11">Campus buildings</text>
          <path d="M 310 75 L 310 335" stroke="#437278" strokeWidth="14" fill="none" />
          <text x="320" y="192" fill="var(--spruce-light)" fontSize="11">West walkway · canyon rim</text>
          <path d="M 410 65 Q 350 160 420 330 M 465 65 Q 405 160 475 330 M 520 65 Q 460 160 530 330 M 575 65 Q 515 160 585 330 M 630 65 Q 570 160 640 330 M 685 65 Q 625 160 695 330 M 740 65 Q 680 160 750 330" fill="none" stroke="#437278" strokeOpacity="0.45" strokeWidth="2" />
          <path d="M 485 180 Q 555 150 635 190 L 650 255 Q 560 285 490 245 Z" fill={`url(#${stripeId})`} stroke="#ff8f8f" />
          <text x="495" y="215" fill="#ffb4b4" fontSize="11">Reported fire area</text>
          <text x="495" y="230" fill="#ffb4b4" fontSize="10">(canyon slope)</text>
          <path d="M 735 90 Q 655 150 710 220 T 680 315" fill="none" stroke="var(--spruce-light)" strokeWidth="2" strokeDasharray="5 5" />
          <text x="535" y="315" fill="var(--cream)" fontSize="11">Canyon trail (status unknown)</text>
          <rect x="70" y="70" width="200" height="80" fill="rgba(171, 255, 174, 0.08)" stroke="var(--accent-lime)" strokeDasharray="4 4" />
          <g transform="translate(85, 80)">
            <Flag size={14} color="var(--accent-lime)" />
            <text x="22" y="12" fill="var(--cream)" fontSize="11" fontWeight="600">{stagingArea}</text>
            <text x="22" y="27" fill="var(--spruce-light)" fontSize="10">Designated staging point</text>
          </g>

            </g>
          )}

          {scene === "street-flood" && (
            <g>
              <text x="28" y="30" fill="var(--cream)" fontSize="12" fontWeight="600">GENESEE AVENUE · STAGED UNDERPASS</text>
              <path d="M 65 50 L 65 390 M 325 50 L 325 390" stroke="#437278" strokeWidth="2" />
              <rect x="70" y="50" width="250" height="340" fill="#09383e" />
              <path d="M 150 50 V 390 M 240 50 V 390" stroke="#a1c2c6" strokeOpacity="0.5" strokeDasharray="12 12" />
              <path d="M 195 50 V 390" stroke="#a1c2c6" strokeOpacity="0.5" />
              <rect x="25" y="95" width="725" height="75" fill="#0b363b" stroke="#437278" strokeWidth="2" />
              <path d="M 25 124 H 750" stroke="#a1c2c6" strokeDasharray="16 12" />
              <path d="M 25 148 H 750 M 25 155 H 750" stroke="#437278" strokeWidth="2" />
              <text x="365" y="116" fill="var(--cream)" fontSize="12">Freeway / trolley overpass deck</text>
              <text x="365" y="141" fill="var(--spruce-light)" fontSize="11">Illustrative crossing</text>
              <path d="M 80 183 Q 140 173 190 188 T 310 181 L 312 290 Q 220 309 80 289 Z" fill={`url(#${stripeId})`} stroke="#ff8f8f" />
              <text x="92" y="209" fill="#ffb4b4" fontSize="12">Reported flooding (underpass)</text>
              <g transform="translate(100, 234)">
                <rect width="28" height="45" rx="2" fill="#0b363b" stroke="#ffb4b4" />
                <path d="M 104 240 H 124 M 104 264 H 124" transform="translate(-100, -234)" stroke="#ffb4b4" />
                <text x="40" y="15" fill="var(--cream)" fontSize="11">Reported stalled vehicle</text>
                <text x="40" y="31" fill="var(--spruce-light)" fontSize="11">(unconfirmed)</text>
              </g>
              <rect x="335" y="272" width="34" height="24" fill="#072327" stroke="#437278" />
              <path d="M 342 275 V 293 M 350 275 V 293 M 358 275 V 293" stroke="#a1c2c6" />
              <text x="380" y="288" fill="var(--spruce-light)" fontSize="11">Storm drain</text>
              <path d="M 85 328 L 175 344 M 85 344 L 175 328" stroke="#ffb4b4" strokeWidth="2" />
              <text x="86" y="369" fill="var(--cream)" fontSize="11">Closed-lane indication</text>
              <text x="86" y="385" fill="var(--spruce-light)" fontSize="11">Status unknown</text>
              <rect x="480" y="210" width="270" height="155" fill="rgba(171, 255, 174, 0.06)" stroke="var(--accent-lime)" strokeDasharray="4 4" />
              <path d="M 500 305 H 730 M 520 305 V 345 M 560 305 V 345 M 600 305 V 345 M 640 305 V 345 M 680 305 V 345 M 720 305 V 345" stroke="#437278" />
              <Flag x={498} y={226} size={15} color="var(--accent-lime)" />
              <text x="522" y="240" fill="var(--cream)" fontSize="11">Staging: {stagingArea.split(" — ")[0]}</text>
              <text x="500" y="264" fill="var(--spruce-light)" fontSize="11">Nearby parking lot · designated point</text>
            </g>
          )}

          {scene === "bluff-collapse" && (
            <g>
              <text x="28" y="30" fill="var(--cream)" fontSize="12" fontWeight="600">COASTAL BLUFF · STAGED SCENE</text>
              <path d="M 20 55 H 95 Q 70 145 95 230 T 85 395 H 20 Z" fill="#0b363b" />
              <path d="M 38 80 Q 65 95 76 80 M 32 170 Q 55 185 77 170 M 35 305 Q 58 320 77 305" fill="none" stroke="#437278" />
              <text x="35" y="370" fill="var(--spruce-light)" fontSize="11" transform="rotate(-90 35 370)">Pacific Ocean</text>
              <path d="M 95 55 Q 70 145 95 230 T 85 395 L 320 395 Q 285 310 330 230 T 320 55 Z" fill="rgba(255, 252, 246, 0.06)" />
              <text x="125" y="90" fill="var(--cream)" fontSize="12">Beach below the bluff</text>
              <path d="M 140 143 Q 205 125 284 155 L 302 265 Q 220 286 134 263 Z" fill={`url(#${stripeId})`} stroke="#ff8f8f" />
              <text x="148" y="195" fill="#ffb4b4" fontSize="12">Reported bluff failure</text>
              <text x="148" y="214" fill="#ffb4b4" fontSize="11">Beach below cliff</text>
              <path d="M 320 55 Q 350 135 330 230 T 320 395" fill="none" stroke="#a1c2c6" strokeWidth="3" />
              <path d="M 355 55 Q 385 135 365 230 T 355 395 M 390 55 Q 420 135 400 230 T 390 395 M 425 55 Q 455 135 435 230 T 425 395 M 460 55 Q 490 135 470 230 T 460 395" fill="none" stroke="#437278" strokeOpacity="0.6" />
              <text x="480" y="300" fill="var(--cream)" fontSize="12">Sandstone bluff edge</text>
              <text x="480" y="319" fill="var(--spruce-light)" fontSize="11">Illustrative contours</text>
              <path d="M 530 345 L 460 350 L 420 325 L 385 351 L 355 330 L 310 365 L 265 345 L 225 377" fill="none" stroke="#a1c2c6" strokeDasharray="5 5" strokeWidth="2" />
              <text x="130" y="319" fill="var(--cream)" fontSize="11">Beach access trail</text>
              <text x="130" y="336" fill="var(--spruce-light)" fontSize="11">Trail status unknown</text>
              <rect x="490" y="70" width="265" height="145" fill="rgba(171, 255, 174, 0.06)" stroke="var(--accent-lime)" strokeDasharray="4 4" />
              <Flag x={506} y={87} size={15} color="var(--accent-lime)" />
              <text x="530" y="101" fill="var(--cream)" fontSize="11">Staging: {stagingArea.split(" — ")[0]}</text>
              <text x="508" y="128" fill="var(--spruce-light)" fontSize="11">Clifftop parking / Gliderport</text>
              <path d="M 508 160 H 735 M 520 160 V 195 M 560 160 V 195 M 600 160 V 195 M 640 160 V 195 M 680 160 V 195 M 720 160 V 195" stroke="#437278" />
            </g>
          )}

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
            <text x={isCanyon ? 110 : 28} y={isCanyon ? 352 : 432} fill="var(--spruce-light)" fontSize="10" letterSpacing="0.06em">
              {isCanyon ? "OTHER REPORTS" : "REPORT PINS"} · DESCRIBED LOCATION, NOT GEOLOCATED
            </text>
          )}
          {otherReports.map((report, idx) => (
            <MapPin
              key={report.id}
              report={report}
              cx={isCanyon ? 130 + idx * 100 : 108 + (idx % 4) * 194}
              cy={isCanyon ? 372 : 462 + Math.floor(idx / 4) * 80}
              labelY={isCanyon ? 398 : 490 + Math.floor(idx / 4) * 80}
              label={shorten(report.location, isCanyon ? 16 : 29)}
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
            {reportedArea}
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
