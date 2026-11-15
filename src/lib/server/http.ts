import "server-only";

import { z } from "zod";
import { LIMITS } from "./config";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const NO_STORE = { "Cache-Control": "no-store" } as const;

export function json(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}): Response {
  return Response.json(body, { status: init.status ?? 200, headers: { ...NO_STORE, ...init.headers } });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) return json({ error: error.message }, { status: error.status });
  // Never log raw provider/driver errors: they can embed connection or request details.
  const e = error as { name?: unknown; code?: unknown } | null;
  const name = typeof e?.name === "string" ? e.name.slice(0, 40) : "Error";
  const code = typeof e?.code === "string" || typeof e?.code === "number" ? String(e.code).slice(0, 20) : "-";
  console.error(`[firstlink] unhandled ${name} code=${code}`);
  return json({ error: "Something went wrong on our side. Please try again." }, { status: 500 });
}

/** Wrap a route handler so every failure becomes `{error}` with a meaningful status. */
export function route<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

/** Reject cross-origin browser mutations. Requests without an Origin header (curl, same-origin GET) pass. */
export function assertSameOrigin(request: Request): void {
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new ApiError(403, "Cross-origin requests are not allowed.");
  const origin = request.headers.get("origin");
  if (!origin) return;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new ApiError(403, "Cross-origin requests are not allowed.");
  }
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const expected = forwarded || request.headers.get("host") || new URL(request.url).host;
  if (originHost !== expected) throw new ApiError(403, "Cross-origin requests are not allowed.");
}

const LOOPBACK = /^(?:127\.\d+\.\d+\.\d+|::1|::ffff:127\.\d+\.\d+\.\d+)$/;

/**
 * Client address as seen by the reverse proxy (Caddy replaces untrusted X-Forwarded-For with the peer address and the
 * app port is bound to localhost). Next.js fills in the socket address when the header is absent, so loopback means
 * the request did not come through the proxy (local development, tests) and returns null.
 */
export function proxiedClientIp(request: Request): string | null {
  const last = request.headers.get("x-forwarded-for")?.split(",").pop()?.trim();
  return last && !LOOPBACK.test(last) ? last.slice(0, 64) : null;
}

const ipWindows = new Map<string, { start: number; count: number }>();

/** In-process fixed-window limit per proxied client address (single-server deployment). Unproxied requests pass. */
export function takeIpSlot(request: Request, bucket: string, max: number, windowMs: number): boolean {
  const ip = proxiedClientIp(request);
  if (!ip) return true;
  const now = Date.now();
  if (ipWindows.size > 5000) {
    for (const [key, value] of ipWindows) if (now - value.start >= windowMs) ipWindows.delete(key);
    if (ipWindows.size > 5000) ipWindows.clear();
  }
  const key = `${bucket}|${ip}`;
  const slot = ipWindows.get(key);
  if (!slot || now - slot.start >= windowMs) {
    ipWindows.set(key, { start: now, count: 1 });
    return true;
  }
  if (slot.count >= max) return false;
  slot.count += 1;
  return true;
}

export async function readJson<T>(request: Request, schema: z.ZodType<T>, maxBytes: number = LIMITS.maxJsonBytes): Promise<T> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) throw new ApiError(415, "Send the request as JSON.");
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw new ApiError(413, "The request is too large.");
  const text = await request.text();
  if (text.length > maxBytes) throw new ApiError(413, "The request is too large.");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new ApiError(400, "The request body is not valid JSON.");
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "The request is not valid.");
  return parsed.data;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const uuidSchema = z.string().regex(UUID, "Invalid identifier.");
export const accessSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{16,64}$/, "Invalid access link.")
  .optional();

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

/** Collapse control characters; keep newlines only when asked. */
export function cleanText(value: string, multiline = false): string {
  const stripped = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u2028\u2029]/g, "");
  return (multiline ? stripped.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n") : stripped.replace(/\s+/g, " ")).trim();
}

export function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === "23505";
}
