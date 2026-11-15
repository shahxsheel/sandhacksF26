import { z } from "zod";
import { requireOwner, resolveOwner } from "@/lib/server/auth";
import { ApiError, assertSameOrigin, json, readJson, route, uuidSchema } from "@/lib/server/http";
import { resetWorkspace } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({ incidentId: uuidSchema.optional() });

/** POST /api/session/reset: owner only; resets only this browser's workspace. The JSON body is optional. */
export const POST = route(async (request: Request) => {
  assertSameOrigin(request);
  const input = request.headers.get("content-type")?.toLowerCase().includes("json") ? await readJson(request, body) : {};
  const owner = await resolveOwner(request);
  if (!owner) throw new ApiError(404, "Workspace not found.");
  const principal = await requireOwner(request, input.incidentId ?? owner.incidentId);
  const state = await resetWorkspace(principal.incidentId, principal.sessionId, owner.secret);
  return json({ state });
});
