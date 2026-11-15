export type ReportKind = "text" | "photo" | "voice";
export type ClaimKind = "reported" | "observed" | "disputed";
export type AssignmentStatus = "approved" | "accepted" | "declined";
/** Gemini credibility screening of a submitted report. Flagged reports stay out of the feed, map and brief. */
export interface ReportScreening {
  status: "accepted" | "flagged" | "unscreened";
  reason: string;
}
/** Which staged scene an incident uses; selects its schematic map. */
export type IncidentScene = "canyon-fire" | "street-flood" | "bluff-collapse";
/** Set when Gemini chose this report's incident from an unrouted dispatch-intake submission. */
export interface ReportRouting {
  reason: string;
}
export interface Incident {
  id: string;
  /** Short operator reference, e.g. "FL-0412". */
  code: string;
  scene: IncidentScene;
  title: string;
  category: string;
  address: string;
  description: string;
  status: "responding" | "monitoring";
  reportedAt: string;
  location: { lat: number; lng: number };
  stagingArea: string;
}
export interface WitnessReport {
  id: string;
  sourceLabel: string;
  name: string;
  location: string;
  text: string;
  transcript?: string;
  photoId?: string;
  audioId?: string;
  kind: ReportKind;
  createdAt: string;
  isSample?: boolean;
  transcriptionStatus?: "completed" | "failed" | "not_requested";
  screening?: ReportScreening;
  routing?: ReportRouting;
}
/** One active incident in the coordinator's workspace (the incident queue). */
export interface IncidentSummary {
  id: string;
  code: string;
  scene: IncidentScene;
  title: string;
  category: string;
  address: string;
  status: Incident["status"];
  reportedAt: string;
  reportCount: number;
  withheldCount: number;
}
export interface BriefClaim { id: string; text: string; reportIds: string[]; kind: ClaimKind; note?: string }
export interface BriefConflict { text: string; reportIds: string[] }
export interface CoordinatorNote { id: string; text: string; createdAt: string }
export interface IncidentBrief {
  headline: string;
  summary: string;
  claims: BriefClaim[];
  unknowns: string[];
  conflicts: BriefConflict[];
  suggestedNeeds: string[];
  notes: CoordinatorNote[];
  mode: "sample" | "gemini" | "rules";
  updatedAt: string;
  revision: number;
}
export interface Volunteer {
  id: string;
  name: string;
  initials: string;
  role: string;
  skills: string[];
  distanceMeters: number;
  available: boolean;
  bio: string;
}
export interface Assignment {
  id: string;
  volunteerId: string;
  task: string;
  status: AssignmentStatus;
  createdAt: string;
  respondedAt?: string;
}
export interface TimelineEvent { id: string; text: string; type: "report" | "brief" | "assignment" | "note" | "system"; createdAt: string }
export interface DemoState {
  incident: Incident;
  reports: WitnessReport[];
  brief: IncidentBrief;
  volunteers: Volunteer[];
  assignments: Assignment[];
  events: TimelineEvent[];
  access?: { witnessToken: string; volunteerToken: string };
  /** Coordinator only: reports withheld by screening, kept out of `reports`. */
  withheldReports?: WitnessReport[];
  /** Coordinator only: every active incident in this workspace, in queue order (includes `incident`). */
  incidents?: IncidentSummary[];
  viewerRole: "coordinator" | "witness" | "volunteer";
}
