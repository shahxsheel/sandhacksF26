import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";
import { LIMITS } from "./config";
import { getDatabase } from "./db";
import { ApiError, isUuid } from "./http";

export const SESSION_COOKIE = "fl_session";
type ViewerRole = "coordinator" | "witness" | "volunteer";
export type ShareRole = Exclude<ViewerRole, "coordinator">;

export interface Principal {
  /** Role the caller is acting as. The owner browser acts as `coordinator` unless a role view is requested. */
  role: ViewerRole;
  owner: boolean;
  incidentId: string;
  /** Session that owns the incident; paid usage and rate limits are charged to it. */
  sessionId: string;
  /** The owner's cookie secret; only present for the owner (needed to derive share tokens). */
  secret?: string;
}

export const sha256 = (value: string): string => createHash("sha256").update(value).digest("hex");

export function newSessionSecret(): string {
  return randomBytes(32).toString("base64url");
}

/** Share tokens are HMAC(owner cookie secret, role:incident): the owner can re-derive them, the database only holds their hash. */
export function deriveToken(secret: string, role: ShareRole, incidentId: string): string {
  return createHmac("sha256", secret).update(`${role}:${incidentId}`).digest("base64url");
}

export function readSessionSecret(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0 || part.slice(0, index).trim() !== SESSION_COOKIE) continue;
    const value = part.slice(index + 1).trim();
    return /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
  }
  return null;
}

export function sessionCookie(secret: string, request: Request): string {
  const secure = request.headers.get("x-forwarded-proto") === "https" || new URL(request.url).protocol === "https:";
  const maxAge = LIMITS.sessionTtlDays * 86_400;
  return `${SESSION_COOKIE}=${secret}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

export interface Owner {
  sessionId: string;
  /** First incident in queue order (the default one a fresh dashboard shows). */
  incidentId: string;
  /** Every incident this workspace owns, in queue order. */
  incidentIds: string[];
  /** Scenes already present, aligned with incidentIds. */
  scenes: string[];
  secret: string;
}

const SCENE_ORDER = ["canyon-fire", "street-flood", "bluff-collapse"];

/** Resolve the browser's workspace from its cookie. Slides the expiry at most once an hour. */
export async function resolveOwner(request: Request): Promise<Owner | null> {
  const secret = readSessionSecret(request);
  if (!secret) return null;
  const sql = getDatabase();
  const rows = await sql`
    WITH s AS (
      SELECT s.id AS session_id, i.id AS incident_id, i.scene, s.last_seen_at
      FROM fl_sessions s JOIN fl_incidents i ON i.session_id = s.id
      WHERE s.secret_hash = ${sha256(secret)} AND s.expires_at > now()
      LIMIT 5
    ), touched AS (
      UPDATE fl_sessions SET last_seen_at = now(), expires_at = now() + make_interval(days => ${LIMITS.sessionTtlDays}::int)
      WHERE id IN (SELECT session_id FROM s WHERE last_seen_at < now() - interval '1 hour')
      RETURNING id
    )
    SELECT session_id, incident_id, scene FROM s`;
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => SCENE_ORDER.indexOf(String(a.scene)) - SCENE_ORDER.indexOf(String(b.scene)));
  const incidentIds = sorted.map((r) => String(r.incident_id));
  return { sessionId: String(sorted[0].session_id), incidentId: incidentIds[0], incidentIds, scenes: sorted.map((r) => String(r.scene)), secret };
}

/**
 * Authorize a request against one incident. The owner cookie wins; otherwise `access` must match the hashed
 * role token. `view` lets the owner browser preview a shared-role page without a token.
 */
export async function authorize(
  request: Request,
  incidentId: string,
  options: { access?: string | undefined; allow: readonly ViewerRole[]; view?: ShareRole | undefined },
): Promise<Principal> {
  if (!isUuid(incidentId)) throw new ApiError(404, "Workspace not found or the access link is not valid.");
  const owner = await resolveOwner(request);
  if (owner && owner.incidentIds.includes(incidentId.toLowerCase())) {
    const role: ViewerRole = options.view ?? "coordinator";
    if (!options.allow.includes(role)) throw new ApiError(403, "This action is not available from here.");
    return { role, owner: true, incidentId: incidentId.toLowerCase(), sessionId: owner.sessionId, secret: owner.secret };
  }
  if (options.access) {
    const hash = sha256(options.access);
    const rows = await getDatabase()`
      SELECT session_id, witness_token_hash = ${hash} AS witness, volunteer_token_hash = ${hash} AS volunteer
      FROM fl_incidents WHERE id = ${incidentId}`;
    const row = rows[0];
    const role: ShareRole | null = row?.witness ? "witness" : row?.volunteer ? "volunteer" : null;
    if (row && role) {
      if (options.view && options.view !== role) throw new ApiError(403, "This access link is for a different role.");
      if (!options.allow.includes(role)) throw new ApiError(403, "This access link cannot perform this action.");
      return { role, owner: false, incidentId: incidentId.toLowerCase(), sessionId: String(row.session_id) };
    }
  }
  throw new ApiError(404, "Workspace not found or the access link is not valid.");
}

/** Owner-only actions: coordinator role on the caller's own workspace. */
export async function requireOwner(request: Request, incidentId: string): Promise<Principal> {
  return authorize(request, incidentId, { allow: ["coordinator"] });
}
