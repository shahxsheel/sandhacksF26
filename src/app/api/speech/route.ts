import { z } from "zod";
import { requireOwner } from "@/lib/server/auth";
import { assertSameOrigin, readJson, route, uuidSchema } from "@/lib/server/http";
import { narrateBrief } from "@/lib/server/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({ incidentId: uuidSchema });

/** POST /api/speech: owner only. Narrates the current short brief with a fixed voice/model; identical text is served from disk cache. */
export const POST = route(async (request: Request) => {
  assertSameOrigin(request);
  const { incidentId } = await readJson(request, body);
  const principal = await requireOwner(request, incidentId);
  const audio = await narrateBrief(principal);
  return new Response(new Uint8Array(audio), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(audio.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
