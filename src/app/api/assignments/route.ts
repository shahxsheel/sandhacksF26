import { z } from "zod";
import { requireOwner } from "@/lib/server/auth";
import { LIMITS } from "@/lib/server/config";
import { ApiError, assertSameOrigin, cleanText, json, readJson, route, uuidSchema } from "@/lib/server/http";
import { stateFor } from "@/lib/server/services";
import { insertAssignment } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({ incidentId: uuidSchema, volunteerId: uuidSchema, task: z.string().max(LIMITS.maxTaskLength * 2) });

// Volunteers are only ever approved for support at the designated staging point.
const OUT_OF_SCOPE = /\b(enter(?:ing)?|re-?enter|go(?:ing)? inside|search(?:ing)?|rescue|rescuing|fight(?:ing)? (?:the )?fire|extinguish|evacuat\w*|treat(?:ing)?|diagnos\w*)\b/i;

/** POST /api/assignments: owner approves a volunteer for the designated staging point. */
export const POST = route(async (request: Request) => {
  assertSameOrigin(request);
  const input = await readJson(request, body);
  const principal = await requireOwner(request, input.incidentId);
  const task = cleanText(input.task);
  if (task.length < 3 || task.length > LIMITS.maxTaskLength) throw new ApiError(400, `Describe the task in 3 to ${LIMITS.maxTaskLength} characters.`);
  if (OUT_OF_SCOPE.test(task)) throw new ApiError(400, "Volunteers can only be approved for support at the designated staging point, not for entering, searching, rescue, firefighting or medical care.");
  await insertAssignment(principal.incidentId, input.volunteerId, task);
  return json({ state: await stateFor(principal) });
});
