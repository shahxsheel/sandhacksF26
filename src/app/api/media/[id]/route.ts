import { readFile } from "node:fs/promises";
import { authorize } from "@/lib/server/auth";
import { ApiError, accessSchema, isUuid, route, uuidSchema } from "@/lib/server/http";
import { mediaPath } from "@/lib/server/media";
import { findMedia } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseRange(header: string | null, size: number): { start: number; end: number } | "invalid" | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (match[1] === "" && match[2] === "")) return "invalid";
  let start: number;
  let end: number;
  if (match[1] === "") {
    start = Math.max(size - Number(match[2]), 0);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
  }
  return start > end || start >= size ? "invalid" : { start, end };
}

/** GET /api/media/[id]: stream a verified upload to the owner or a role-token holder. Paths come from the database only. */
export const GET = route(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const params = new URL(request.url).searchParams;
  const incidentId = uuidSchema.safeParse(params.get("incidentId"));
  const access = accessSchema.safeParse(params.get("access") || undefined);
  if (!isUuid(id) || !incidentId.success || !access.success) throw new ApiError(404, "Media not found.");
  const principal = await authorize(request, incidentId.data, { access: access.data, allow: ["coordinator", "witness", "volunteer"] });
  const media = await findMedia(principal.incidentId, id);
  if (!media) throw new ApiError(404, "Media not found.");

  let data: Buffer;
  try {
    data = await readFile(mediaPath(principal.incidentId, media.fileName));
  } catch {
    throw new ApiError(404, "Media not found.");
  }
  const headers: Record<string, string> = {
    "Content-Type": media.mime,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, max-age=300",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Accept-Ranges": "bytes",
    "Content-Disposition": "inline",
  };
  const range = parseRange(request.headers.get("range"), data.byteLength);
  if (range === "invalid") return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${data.byteLength}` } });
  if (range) {
    const slice = data.subarray(range.start, range.end + 1);
    return new Response(new Uint8Array(slice), { status: 206, headers: { ...headers, "Content-Length": String(slice.byteLength), "Content-Range": `bytes ${range.start}-${range.end}/${data.byteLength}` } });
  }
  return new Response(new Uint8Array(data), { headers: { ...headers, "Content-Length": String(data.byteLength) } });
});
