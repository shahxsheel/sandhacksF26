import "server-only";

import { randomUUID } from "node:crypto";
import { createDemoSeed } from "../demo-seed";
import type { Assignment, CoordinatorNote, DemoState, Incident, ReportScreening, TimelineEvent, Volunteer, WitnessReport } from "../types";
import { deriveToken, newSessionSecret, sha256 } from "./auth";
import type { BriefCore } from "./brief-logic";
import { LIMITS } from "./config";
import { getDatabase } from "./db";
import { ApiError, isUniqueViolation } from "./http";
import { removeIncidentMedia } from "./media";
import { pruneSpeechCache } from "./providers";

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Viewer = DemoState["viewerRole"];

const iso = (value: unknown): string => (value instanceof Date ? value : new Date(String(value))).toISOString();
const num = (value: unknown): number => Number(value);

function tokens(secret: string, incidentId: string): { witnessToken: string; volunteerToken: string } {
  return { witnessToken: deriveToken(secret, "witness", incidentId), volunteerToken: deriveToken(secret, "volunteer", incidentId) };
}

// ---------------------------------------------------------------- row mapping

function mapIncident(row: Row): Incident {
  return {
    id: String(row.id),
    title: row.title,
    category: row.category,
    address: row.address,
    description: row.description,
    status: row.status,
    reportedAt: iso(row.reported_at),
    location: { lat: num(row.lat), lng: num(row.lng) },
    stagingArea: row.staging_area,
  };
}

function mapReport(row: Row): WitnessReport {
  const report: WitnessReport = {
    id: String(row.id),
    sourceLabel: row.source_label,
    name: row.name,
    location: row.location,
    text: row.text,
    kind: row.kind,
    createdAt: iso(row.created_at),
  };
  if (row.transcript) report.transcript = row.transcript;
  if (row.photo_media_id) report.photoId = String(row.photo_media_id);
  if (row.audio_media_id) report.audioId = String(row.audio_media_id);
  if (row.is_sample) report.isSample = true;
  if (row.transcription_status) report.transcriptionStatus = row.transcription_status;
  if (row.screening_status) report.screening = { status: row.screening_status, reason: row.screening_reason ?? "" };
  return report;
}

const isWithheld = (report: WitnessReport): boolean => report.screening?.status === "flagged";

const mapVolunteer = (row: Row): Volunteer => ({
  id: String(row.id),
  name: row.name,
  initials: row.initials,
  role: row.role,
  skills: row.skills ?? [],
  distanceMeters: num(row.distance_meters),
  available: Boolean(row.available),
  bio: row.bio,
});

const mapAssignment = (row: Row): Assignment => {
  const a: Assignment = { id: String(row.id), volunteerId: String(row.volunteer_id), task: row.task, status: row.status, createdAt: iso(row.created_at) };
  if (row.responded_at) a.respondedAt = iso(row.responded_at);
  return a;
};

const mapEvent = (row: Row): TimelineEvent => ({ id: String(row.id), text: row.text, type: row.type, createdAt: iso(row.created_at) });
const mapNote = (row: Row): CoordinatorNote => ({ id: String(row.id), text: row.text, createdAt: iso(row.created_at) });

// ---------------------------------------------------------------- reading state

/**
 * Load a workspace as DemoState for a viewer in one read-only HTTP transaction.
 * Shared roles only see what they need: witnesses see the incident; volunteers see the incident, assignments and
 * the volunteers assigned. Coordinator-only data (reports, brief, notes, tokens) is withheld from shared views.
 */
export async function loadState(incidentId: string, viewer: Viewer, secret?: string): Promise<DemoState> {
  const sql = getDatabase();
  const [incident, reports, volunteers, assignments, events, notes] = await sql.transaction(
    [
      sql`SELECT * FROM fl_incidents WHERE id = ${incidentId}::uuid`,
      sql`SELECT * FROM fl_reports WHERE incident_id = ${incidentId}::uuid ORDER BY seq LIMIT ${LIMITS.maxReports}::int`,
      sql`SELECT * FROM fl_volunteers WHERE incident_id = ${incidentId}::uuid ORDER BY sort LIMIT 20`,
      sql`SELECT * FROM fl_assignments WHERE incident_id = ${incidentId}::uuid ORDER BY created_at, id LIMIT ${LIMITS.maxAssignments}::int`,
      sql`SELECT id, text, type, created_at FROM (SELECT n, id, text, type, created_at FROM fl_events WHERE incident_id = ${incidentId}::uuid ORDER BY n DESC LIMIT ${LIMITS.maxEventsReturned}::int) e ORDER BY n`,
      sql`SELECT id, text, created_at FROM fl_notes WHERE incident_id = ${incidentId}::uuid ORDER BY created_at, id LIMIT ${LIMITS.maxNotes}::int`,
    ],
    { readOnly: true },
  );
  const row = incident[0];
  if (!row) throw new ApiError(404, "Workspace not found or the access link is not valid.");
  const core = row.brief as BriefCore;
  const brief = { ...core, notes: notes.map(mapNote), mode: row.brief_mode, updatedAt: iso(row.brief_updated_at), revision: num(row.brief_revision) };
  const base = { incident: mapIncident(row), viewerRole: viewer };

  if (viewer === "coordinator") {
    const mapped = reports.map(mapReport);
    const state: DemoState = {
      ...base,
      reports: mapped.filter((r) => !isWithheld(r)),
      withheldReports: mapped.filter(isWithheld),
      brief,
      volunteers: volunteers.map(mapVolunteer),
      assignments: assignments.map(mapAssignment),
      events: events.map(mapEvent),
    };
    if (secret) state.access = tokens(secret, incidentId);
    return state;
  }

  const emptyBrief = { headline: row.title, summary: "", claims: [], unknowns: [], conflicts: [], suggestedNeeds: [], notes: [], mode: brief.mode, updatedAt: brief.updatedAt, revision: brief.revision };
  if (viewer === "witness") return { ...base, reports: [], brief: emptyBrief, volunteers: [], assignments: [], events: [] };

  const assignedIds = new Set(assignments.map((a) => String(a.volunteer_id)));
  return {
    ...base,
    reports: [],
    brief: emptyBrief,
    volunteers: volunteers.filter((v) => assignedIds.has(String(v.id))).map(mapVolunteer),
    assignments: assignments.map(mapAssignment),
    events: [],
  };
}

// ---------------------------------------------------------------- workspaces

function seedStatements(incidentId: string, sessionId: string, secret: string, seed: DemoState) {
  const sql = getDatabase();
  const t = tokens(secret, incidentId);
  const core: BriefCore = { headline: seed.brief.headline, summary: seed.brief.summary, claims: seed.brief.claims, unknowns: seed.brief.unknowns, conflicts: seed.brief.conflicts, suggestedNeeds: seed.brief.suggestedNeeds };
  const briefJson = JSON.stringify(core);
  const i = seed.incident;
  return [
    sql`INSERT INTO fl_incidents (id, session_id, title, category, address, description, status, reported_at, lat, lng, staging_area, witness_token_hash, volunteer_token_hash, brief, brief_mode, brief_revision, brief_updated_at)
        SELECT ${incidentId}::uuid, ${sessionId}::uuid, ${i.title}::text, ${i.category}::text, ${i.address}::text, ${i.description}::text, ${i.status}::text, ${i.reportedAt}::timestamptz, ${i.location.lat}::float8, ${i.location.lng}::float8, ${i.stagingArea}::text,
               ${sha256(t.witnessToken)}::text, ${sha256(t.volunteerToken)}::text, ${briefJson}::jsonb, ${seed.brief.mode}::text, ${seed.brief.revision}::int, ${seed.brief.updatedAt}::timestamptz
        WHERE EXISTS (SELECT 1 FROM fl_sessions WHERE id = ${sessionId}::uuid)`,
    sql`INSERT INTO fl_reports (id, incident_id, seq, source_label, name, location, text, kind, is_sample, created_at)
        SELECT x.id, ${incidentId}::uuid, x.seq, x.source_label, x.name, x.location, x.text, x.kind, x.is_sample, x.created_at
        FROM jsonb_to_recordset(${JSON.stringify(seed.reports.map((r, n) => ({ id: r.id, seq: n + 1, source_label: r.sourceLabel, name: r.name, location: r.location, text: r.text, kind: r.kind, is_sample: Boolean(r.isSample), created_at: r.createdAt })))}::jsonb)
             AS x(id uuid, seq int, source_label text, name text, location text, text text, kind text, is_sample boolean, created_at timestamptz)
        WHERE EXISTS (SELECT 1 FROM fl_incidents WHERE id = ${incidentId}::uuid)`,
    sql`INSERT INTO fl_volunteers (id, incident_id, sort, name, initials, role, skills, distance_meters, available, bio)
        SELECT x.id, ${incidentId}::uuid, x.sort, x.name, x.initials, x.role, ARRAY(SELECT jsonb_array_elements_text(x.skills)), x.distance_meters, x.available, x.bio
        FROM jsonb_to_recordset(${JSON.stringify(seed.volunteers.map((v, n) => ({ id: v.id, sort: n, name: v.name, initials: v.initials, role: v.role, skills: v.skills, distance_meters: v.distanceMeters, available: v.available, bio: v.bio })))}::jsonb)
             AS x(id uuid, sort int, name text, initials text, role text, skills jsonb, distance_meters int, available boolean, bio text)
        WHERE EXISTS (SELECT 1 FROM fl_incidents WHERE id = ${incidentId}::uuid)`,
    sql`INSERT INTO fl_events (id, incident_id, text, type, created_at)
        SELECT x.id, ${incidentId}::uuid, x.text, x.type, x.created_at
        FROM jsonb_to_recordset(${JSON.stringify(seed.events.map((e) => ({ id: e.id, text: e.text, type: e.type, created_at: e.createdAt })))}::jsonb) AS x(id uuid, text text, type text, created_at timestamptz)
        WHERE EXISTS (SELECT 1 FROM fl_incidents WHERE id = ${incidentId}::uuid)`,
    sql`INSERT INTO fl_brief_revisions (incident_id, revision, mode, brief)
        SELECT ${incidentId}::uuid, ${seed.brief.revision}::int, ${seed.brief.mode}::text, ${briefJson}::jsonb
        WHERE EXISTS (SELECT 1 FROM fl_incidents WHERE id = ${incidentId}::uuid)`,
  ];
}

function seededState(seed: DemoState, secret: string): DemoState {
  return { ...seed, viewerRole: "coordinator", access: tokens(secret, seed.incident.id) };
}

/** Create a new isolated workspace seeded with the staged scenario. Bounded per day and in total. */
export async function createWorkspace(): Promise<{ secret: string; state: DemoState }> {
  const sql = getDatabase();
  const secret = newSessionSecret();
  const sessionId = randomUUID();
  const incidentId = randomUUID();
  const seed = createDemoSeed(incidentId);
  const results = await sql.transaction([
    sql`INSERT INTO fl_sessions (id, secret_hash, expires_at)
        SELECT ${sessionId}::uuid, ${sha256(secret)}::text, now() + make_interval(days => ${LIMITS.sessionTtlDays}::int)
        WHERE (SELECT count(*) FROM fl_sessions WHERE created_at > now() - interval '1 day') < ${LIMITS.maxWorkspacesPerDay}::int
          AND (SELECT count(*) FROM fl_sessions WHERE expires_at > now()) < ${LIMITS.maxActiveWorkspaces}::int
        RETURNING id`,
    ...seedStatements(incidentId, sessionId, secret, seed),
  ]);
  if ((results[0] ?? []).length === 0) throw new ApiError(503, "This demo has reached its workspace limit for now. Please try again later.");
  if (Math.random() < 0.1) void purgeExpired().catch(() => undefined);
  return { secret, state: seededState(seed, secret) };
}

/** Reset the owner's workspace to the seed. Same incident id and share links; all content, media and notes replaced. */
export async function resetWorkspace(incidentId: string, sessionId: string, secret: string): Promise<DemoState> {
  const sql = getDatabase();
  const seed = createDemoSeed(incidentId);
  await sql.transaction([
    sql`DELETE FROM fl_incidents WHERE id = ${incidentId}::uuid AND session_id = ${sessionId}::uuid`,
    ...seedStatements(incidentId, sessionId, secret, seed),
  ]);
  await removeIncidentMedia(incidentId);
  return seededState(seed, secret);
}

/** Retention: remove up to 10 expired workspaces (rows cascade; files removed here) and old usage rows. */
export async function purgeExpired(): Promise<void> {
  const sql = getDatabase();
  const expired = await sql`
    SELECT s.id AS session_id, i.id AS incident_id FROM fl_sessions s LEFT JOIN fl_incidents i ON i.session_id = s.id
    WHERE s.expires_at < now() ORDER BY s.expires_at LIMIT 10`;
  if (expired.length > 0) {
    await Promise.all(expired.filter((r) => r.incident_id).map((r) => removeIncidentMedia(String(r.incident_id))));
    await sql`DELETE FROM fl_sessions WHERE id = ANY(${expired.map((r) => String(r.session_id))}::uuid[])`;
  }
  await sql`DELETE FROM fl_usage WHERE created_at < now() - interval '120 days'`;
  await sql`DELETE FROM fl_provider_cache WHERE created_at < now() - interval '30 days'`;
  await pruneSpeechCache(7 * 86_400_000);
}

// ---------------------------------------------------------------- reports

export interface NewReport {
  id: string;
  incidentId: string;
  name: string;
  location: string;
  text: string;
  transcript: string | null;
  transcriptionStatus: "completed" | "failed" | "not_requested";
  kind: "text" | "photo" | "voice";
  screening: ReportScreening;
  photo?: { id: string; fileName: string; bytes: number; mime: string };
  audio?: { id: string; fileName: string; bytes: number; mime: string };
}

/** Incident facts the per-report screening prompt needs. */
export async function incidentFacts(incidentId: string): Promise<Pick<Incident, "title" | "category" | "address" | "description">> {
  const rows = await getDatabase()`SELECT title, category, address, description FROM fl_incidents WHERE id = ${incidentId}::uuid`;
  if (!rows[0]) throw new ApiError(404, "Workspace not found or the access link is not valid.");
  return { title: rows[0].title, category: rows[0].category, address: rows[0].address, description: rows[0].description };
}

export async function countReports(incidentId: string): Promise<number> {
  const rows = await getDatabase()`SELECT count(*)::int AS n FROM fl_reports WHERE incident_id = ${incidentId}::uuid`;
  return num(rows[0]?.n ?? 0);
}

/** Insert the report, its media rows and its timeline event in one statement; the cap is enforced inside it. */
export async function insertReport(r: NewReport): Promise<WitnessReport> {
  const sql = getDatabase();
  const who = r.name.split(" ")[0]?.slice(0, 40) || "A witness";
  const eventText =
    r.screening.status === "flagged"
      ? `A report was withheld from the feed by Gemini screening: ${r.screening.reason.slice(0, 160)}`
      : `${who} shared a report from ${r.location.slice(0, 60)}.`;
  try {
    const rows = await sql`
      WITH cap AS (
        SELECT count(*)::int AS n, coalesce(max(seq), 0) + 1 AS next FROM fl_reports WHERE incident_id = ${r.incidentId}::uuid
      ), rep AS (
        INSERT INTO fl_reports (id, incident_id, seq, source_label, name, location, text, transcript, photo_media_id, audio_media_id, kind, transcription_status, is_sample, screening_status, screening_reason)
        SELECT ${r.id}::uuid, ${r.incidentId}::uuid, cap.next, 'W-' || lpad(cap.next::text, 2, '0'), ${r.name}::text, ${r.location}::text, ${r.text}::text, ${r.transcript}::text,
               ${r.photo?.id ?? null}::uuid, ${r.audio?.id ?? null}::uuid, ${r.kind}::text, ${r.transcriptionStatus}::text, false, ${r.screening.status}::text, ${r.screening.reason}::text
        FROM cap WHERE cap.n < ${LIMITS.maxReports}::int
          AND EXISTS (SELECT 1 FROM fl_incidents WHERE id = ${r.incidentId}::uuid)
        RETURNING id, seq, source_label, created_at
      ), mp AS (
        INSERT INTO fl_media (id, incident_id, kind, mime_type, bytes, file_name)
        SELECT ${r.photo?.id ?? null}::uuid, ${r.incidentId}::uuid, 'photo', ${r.photo?.mime ?? null}::text, ${r.photo?.bytes ?? 0}::int, ${r.photo?.fileName ?? null}::text
        FROM rep WHERE ${Boolean(r.photo)}::boolean RETURNING id
      ), ma AS (
        INSERT INTO fl_media (id, incident_id, kind, mime_type, bytes, file_name)
        SELECT ${r.audio?.id ?? null}::uuid, ${r.incidentId}::uuid, 'audio', ${r.audio?.mime ?? null}::text, ${r.audio?.bytes ?? 0}::int, ${r.audio?.fileName ?? null}::text
        FROM rep WHERE ${Boolean(r.audio)}::boolean RETURNING id
      ), ev AS (
        INSERT INTO fl_events (id, incident_id, text, type) SELECT ${randomUUID()}::uuid, ${r.incidentId}::uuid, ${eventText}::text, 'report' FROM rep RETURNING id
      )
      SELECT id, seq, source_label, created_at FROM rep`;
    const row = rows[0];
    if (!row) throw new ApiError(409, `This incident already has the maximum of ${LIMITS.maxReports} reports.`);
    const report: WitnessReport = { id: r.id, sourceLabel: row.source_label, name: r.name, location: r.location, text: r.text, kind: r.kind, createdAt: iso(row.created_at), transcriptionStatus: r.transcriptionStatus, screening: r.screening };
    if (r.transcript) report.transcript = r.transcript;
    if (r.photo) report.photoId = r.photo.id;
    if (r.audio) report.audioId = r.audio.id;
    return report;
  } catch (error) {
    if (isUniqueViolation(error)) throw new ApiError(409, "Another report was just submitted. Please send yours again.");
    throw error;
  }
}

// ---------------------------------------------------------------- notes

export async function insertNote(incidentId: string, text: string): Promise<void> {
  const rows = await getDatabase()`
    WITH cnt AS (SELECT count(*)::int AS n FROM fl_notes WHERE incident_id = ${incidentId}::uuid),
    bump AS (
      UPDATE fl_incidents SET brief_revision = brief_revision + 1, brief_updated_at = now(), updated_at = now()
      WHERE id = ${incidentId}::uuid AND (SELECT n FROM cnt) < ${LIMITS.maxNotes}::int
      RETURNING brief_revision
    ), note AS (
      INSERT INTO fl_notes (id, incident_id, text, brief_revision) SELECT ${randomUUID()}::uuid, ${incidentId}::uuid, ${text}::text, brief_revision FROM bump RETURNING id
    ), ev AS (
      INSERT INTO fl_events (id, incident_id, text, type) SELECT ${randomUUID()}::uuid, ${incidentId}::uuid, 'Coordinator added a note to the brief.', 'note' FROM note RETURNING id
    )
    SELECT id FROM note`;
  if (rows.length === 0) throw new ApiError(409, `This workspace already has the maximum of ${LIMITS.maxNotes} notes.`);
}

// ---------------------------------------------------------------- assignments

export async function insertAssignment(incidentId: string, volunteerId: string, task: string): Promise<void> {
  const sql = getDatabase();
  try {
    const rows = await sql`
      WITH v AS (
        SELECT id, name FROM fl_volunteers WHERE id = ${volunteerId}::uuid AND incident_id = ${incidentId}::uuid AND available
      ), a AS (
        INSERT INTO fl_assignments (id, incident_id, volunteer_id, task, status)
        SELECT ${randomUUID()}::uuid, ${incidentId}::uuid, v.id, ${task}::text, 'approved' FROM v
        WHERE (SELECT count(*) FROM fl_assignments WHERE incident_id = ${incidentId}::uuid) < ${LIMITS.maxAssignments}::int
          AND NOT EXISTS (SELECT 1 FROM fl_assignments x WHERE x.volunteer_id = v.id AND x.status IN ('approved', 'accepted'))
        RETURNING id, volunteer_id
      ), ev AS (
        INSERT INTO fl_events (id, incident_id, text, type)
        SELECT ${randomUUID()}::uuid, ${incidentId}::uuid, 'Coordinator approved ' || v.name || ' for the designated staging point (simulation; no message was sent).', 'assignment'
        FROM a JOIN v ON v.id = a.volunteer_id RETURNING id
      )
      SELECT id FROM a`;
    if (rows.length > 0) return;
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    throw new ApiError(409, "That volunteer already has an active assignment.");
  }
  // Explain the refusal.
  const found = await sql`
    SELECT v.available,
           EXISTS (SELECT 1 FROM fl_assignments x WHERE x.volunteer_id = v.id AND x.status IN ('approved', 'accepted')) AS active,
           (SELECT count(*) FROM fl_assignments WHERE incident_id = ${incidentId}::uuid) AS total
    FROM fl_volunteers v WHERE v.id = ${volunteerId}::uuid AND v.incident_id = ${incidentId}::uuid`;
  const row = found[0];
  if (!row) throw new ApiError(404, "Volunteer not found.");
  if (!row.available) throw new ApiError(409, "That volunteer is not available.");
  if (row.active) throw new ApiError(409, "That volunteer already has an active assignment.");
  throw new ApiError(409, `This workspace already has the maximum of ${LIMITS.maxAssignments} assignments.`);
}

/** approved -> accepted | declined only. Repeating the same response is a no-op; any other change is a conflict. */
export async function respondToAssignment(incidentId: string, assignmentId: string, action: "accept" | "decline"): Promise<void> {
  const sql = getDatabase();
  const next = action === "accept" ? "accepted" : "declined";
  const rows = await sql`
    WITH a AS (
      UPDATE fl_assignments SET status = ${next}::text, responded_at = now()
      WHERE id = ${assignmentId}::uuid AND incident_id = ${incidentId}::uuid AND status = 'approved'
      RETURNING volunteer_id
    ), ev AS (
      INSERT INTO fl_events (id, incident_id, text, type)
      SELECT ${randomUUID()}::uuid, ${incidentId}::uuid, v.name || ${action === "accept" ? " accepted the staging-point assignment." : " declined the staging-point assignment."}, 'assignment'
      FROM a JOIN fl_volunteers v ON v.id = a.volunteer_id RETURNING id
    )
    SELECT volunteer_id FROM a`;
  if (rows.length > 0) return;
  const current = await sql`SELECT status FROM fl_assignments WHERE id = ${assignmentId}::uuid AND incident_id = ${incidentId}::uuid`;
  const status = current[0]?.status as string | undefined;
  if (!status) throw new ApiError(404, "Assignment not found.");
  if (status === next) return;
  throw new ApiError(409, `This assignment was already ${status}.`);
}

// ---------------------------------------------------------------- brief

export interface BriefContext {
  incident: Incident;
  reports: WitnessReport[];
  notes: CoordinatorNote[];
  photos: { reportId: string; fileName: string }[];
  currentRevision: number;
}

export async function loadBriefContext(incidentId: string): Promise<BriefContext> {
  const sql = getDatabase();
  const [incident, reports, notes, photos] = await sql.transaction(
    [
      sql`SELECT * FROM fl_incidents WHERE id = ${incidentId}::uuid`,
      sql`SELECT * FROM fl_reports WHERE incident_id = ${incidentId}::uuid AND screening_status IS DISTINCT FROM 'flagged' ORDER BY seq LIMIT ${LIMITS.maxReports}::int`,
      sql`SELECT id, text, created_at FROM fl_notes WHERE incident_id = ${incidentId}::uuid ORDER BY created_at, id LIMIT ${LIMITS.maxNotes}::int`,
      sql`SELECT r.id AS report_id, m.file_name FROM fl_reports r JOIN fl_media m ON m.id = r.photo_media_id
          WHERE r.incident_id = ${incidentId}::uuid AND r.screening_status IS DISTINCT FROM 'flagged' ORDER BY r.seq DESC LIMIT ${LIMITS.briefPhotoCount}::int`,
    ],
    { readOnly: true },
  );
  if (!incident[0]) throw new ApiError(404, "Workspace not found or the access link is not valid.");
  return {
    incident: mapIncident(incident[0]),
    reports: reports.map(mapReport),
    notes: notes.map(mapNote),
    photos: photos.map((p) => ({ reportId: String(p.report_id), fileName: String(p.file_name) })),
    currentRevision: num(incident[0].brief_revision),
  };
}

export async function currentBrief(incidentId: string): Promise<{ core: BriefCore; mode: string } | null> {
  const rows = await getDatabase()`SELECT brief, brief_mode FROM fl_incidents WHERE id = ${incidentId}::uuid`;
  return rows[0] ? { core: rows[0].brief as BriefCore, mode: String(rows[0].brief_mode) } : null;
}

/** Replace the current brief, keeping the previous one in fl_brief_revisions. Notes are untouched. */
export async function saveBrief(incidentId: string, core: BriefCore, mode: "gemini" | "rules"): Promise<void> {
  const sql = getDatabase();
  const json = JSON.stringify(core);
  const eventText = mode === "gemini" ? "Brief regenerated with Gemini from the current reports and notes." : "Rules-based brief prepared locally from the current reports (no AI).";
  await sql.transaction([
    sql`WITH u AS (
          UPDATE fl_incidents SET brief = ${json}::jsonb, brief_mode = ${mode}::text, brief_revision = brief_revision + 1, brief_updated_at = now(), updated_at = now()
          WHERE id = ${incidentId}::uuid RETURNING brief_revision
        )
        INSERT INTO fl_brief_revisions (incident_id, revision, mode, brief) SELECT ${incidentId}::uuid, brief_revision, ${mode}::text, ${json}::jsonb FROM u`,
    sql`INSERT INTO fl_events (id, incident_id, text, type)
        SELECT ${randomUUID()}::uuid, ${incidentId}::uuid, ${eventText}::text, 'brief' WHERE EXISTS (SELECT 1 FROM fl_incidents WHERE id = ${incidentId}::uuid)`,
  ]);
}

// ---------------------------------------------------------------- media

export async function findMedia(incidentId: string, mediaId: string): Promise<{ kind: string; mime: string; bytes: number; fileName: string } | null> {
  const rows = await getDatabase()`SELECT kind, mime_type, bytes, file_name FROM fl_media WHERE id = ${mediaId}::uuid AND incident_id = ${incidentId}::uuid`;
  const row = rows[0];
  return row ? { kind: row.kind, mime: row.mime_type, bytes: num(row.bytes), fileName: row.file_name } : null;
}

export async function deleteMediaRows(incidentId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await getDatabase()`DELETE FROM fl_media WHERE incident_id = ${incidentId}::uuid AND id = ANY(${ids}::uuid[])`;
}

// ---------------------------------------------------------------- provider result cache

/** A cached provider result (small JSON) for an exact-input key, or null. One indexed read. */
export async function readProviderCache<T>(key: string): Promise<T | null> {
  const rows = await getDatabase()`SELECT value FROM fl_provider_cache WHERE key = ${key}`;
  return rows[0] ? (rows[0].value as T) : null;
}

export async function writeProviderCache(key: string, kind: "transcript" | "screening", value: unknown): Promise<void> {
  await getDatabase()`
    INSERT INTO fl_provider_cache (key, kind, value) VALUES (${key}, ${kind}, ${JSON.stringify(value)}::jsonb)
    ON CONFLICT (key) DO NOTHING`;
}
