import "server-only";

import { randomUUID } from "node:crypto";
import { PROVIDERS } from "./config";
import { getDatabase } from "./db";
import { ApiError } from "./http";

export type RateLimit = readonly [bucket: string, max: number, windowSeconds: number];

const HARD_CAPS: Record<string, number> = {
  [PROVIDERS.gemini.provider]: PROVIDERS.gemini.hardCap,
  [PROVIDERS.elevenlabs.provider]: PROVIDERS.elevenlabs.hardCap,
};

export type Reservation = { ok: true; usageId: string } | { ok: false; reason: "rate" | "budget" };

/** Per-session fixed-window rate limit as one atomic statement. Returns false when the limit is reached. */
export async function takeRateSlot(sessionId: string, limit: RateLimit): Promise<boolean> {
  const [bucket, max, windowSeconds] = limit;
  const slot = await getDatabase()`
    INSERT INTO fl_rate_limits (session_id, bucket, window_start, count)
    VALUES (${sessionId}::uuid, ${bucket}, now(), 1)
    ON CONFLICT (session_id, bucket) DO UPDATE SET
      window_start = CASE WHEN fl_rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}::int) THEN now() ELSE fl_rate_limits.window_start END,
      count = CASE WHEN fl_rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}::int) THEN 1 ELSE fl_rate_limits.count + 1 END
    WHERE fl_rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}::int) OR fl_rate_limits.count < ${max}::int
    RETURNING count`;
  return slot.length > 0;
}

/**
 * Rate limit, then an atomic global budget reservation (a single conditional UPDATE + usage INSERT).
 * Reservations are conservative upper bounds and stay counted after a provider call (we never refund a request
 * that was sent); only {@link releaseReservation} frees one, and only for calls that never left the server.
 */
export async function reserveBudget(input: {
  provider: string;
  kind: string;
  units: number;
  sessionId: string;
  incidentId: string;
  limit: RateLimit;
}): Promise<Reservation> {
  if (!(await takeRateSlot(input.sessionId, input.limit))) return { ok: false, reason: "rate" };
  const sql = getDatabase();
  const usageId = randomUUID();
  const hardCap = HARD_CAPS[input.provider] ?? 0;
  const reserved = await sql`
    WITH b AS (
      UPDATE fl_budgets SET reserved = reserved + ${input.units}::bigint, updated_at = now()
      WHERE provider = ${input.provider} AND reserved + ${input.units}::bigint <= LEAST(cap, ${hardCap}::bigint)
      RETURNING provider
    )
    INSERT INTO fl_usage (id, provider, kind, units, session_id, incident_id)
    SELECT ${usageId}::uuid, ${input.provider}::text, ${input.kind}::text, ${input.units}::int, ${input.sessionId}::uuid, ${input.incidentId}::uuid FROM b
    RETURNING id`;
  return reserved.length === 0 ? { ok: false, reason: "budget" } : { ok: true, usageId };
}

/** Free a reservation for a provider call that was never sent (missing key, local validation failure). */
export async function releaseReservation(usageId: string): Promise<void> {
  await getDatabase()`
    WITH u AS (
      UPDATE fl_usage SET status = 'released' WHERE id = ${usageId} AND status = 'reserved' RETURNING provider, units
    )
    UPDATE fl_budgets b SET reserved = GREATEST(b.reserved - u.units, 0), updated_at = now() FROM u WHERE b.provider = u.provider`;
}

/** Record non-sensitive usage detail (token counts) against a reservation. */
export async function recordUsageDetail(usageId: string, detail: Record<string, number | string | null>): Promise<void> {
  await getDatabase()`UPDATE fl_usage SET detail = ${JSON.stringify(detail)}::jsonb WHERE id = ${usageId}`;
}

export function budgetError(reason: "rate" | "budget", what: string): ApiError {
  return reason === "rate"
    ? new ApiError(429, `You have reached the limit for ${what} in this workspace. Please try again later.`)
    : new ApiError(503, `${what[0]?.toUpperCase() ?? ""}${what.slice(1)} is paused because the project's usage allowance for this demo is used up. Typed reports and the sample brief still work.`);
}
