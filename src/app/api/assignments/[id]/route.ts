import { z } from "zod";
import { authorize } from "@/lib/server/auth";
import { ApiError, accessSchema, assertSameOrigin, isUuid, json, readJson, route, uuidSchema } from "@/lib/server/http";
import { stateFor } from "@/lib/server/services";
import { respondToAssignment } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// `role: "volunteer"` lets the owner browser test the volunteer page and get the volunteer view back.
const body = z.object({
  action: z.enum(["accept", "decline"]),
  incidentId: uuidSchema,
  access: accessSchema,
  role: z.literal("volunteer").optional(),
});

/** POST /api/assignments/[id]: owner or volunteer-token holder accepts or declines an approved assignment. */
export const POST = route(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  assertSameOrigin(request);
  const { id } = await context.params;
  if (!isUuid(id)) throw new ApiError(404, "Assignment not found.");
  const input = await readJson(request, body);
  const principal = await authorize(request, input.incidentId, { access: input.access, allow: ["coordinator", "volunteer"], view: input.role });
  await respondToAssignment(principal.incidentId, id, input.action);
  return json({ state: await stateFor(principal) });
});
