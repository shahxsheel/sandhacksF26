import { z } from "zod";
import { requireOwner } from "@/lib/server/auth";
import { assertSameOrigin, json, readJson, route, uuidSchema } from "@/lib/server/http";
import { generateBrief } from "@/lib/server/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// `mode: "rules"` is an explicit, local, no-AI summary the coordinator can ask for when Gemini is unavailable.
const body = z.object({ incidentId: uuidSchema, mode: z.enum(["gemini", "rules"]).optional() });

/** POST /api/brief: owner only, explicit user action. One Gemini request, no retries; keeps the last good brief on failure. */
export const POST = route(async (request: Request) => {
  assertSameOrigin(request);
  const { incidentId, mode } = await readJson(request, body);
  const principal = await requireOwner(request, incidentId);
  return json({ state: await generateBrief(principal, mode ?? "gemini") });
});
