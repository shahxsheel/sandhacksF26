import { z } from "zod";
import { authorize, resolveOwner, sessionCookie } from "@/lib/server/auth";
import { LIMITS } from "@/lib/server/config";
import { ApiError, accessSchema, json, route, takeIpSlot, uuidSchema } from "@/lib/server/http";
import { createWorkspace, loadState } from "@/lib/server/store";
import { stateFor } from "@/lib/server/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const query = z.object({
  incidentId: uuidSchema.optional(),
  access: accessSchema,
  role: z.enum(["witness", "volunteer"]).optional(),
});

/** GET /api/session: owner coordinator workspace (created on first visit), or a shared witness/volunteer view. */
export const GET = route(async (request: Request) => {
  const params = new URL(request.url).searchParams;
  const raw = Object.fromEntries([...params.entries()].filter(([, value]) => value !== ""));
  const parsed = query.safeParse(raw);
  if (!parsed.success) throw new ApiError(400, "The request is not valid.");
  const { incidentId, access, role } = parsed.data;

  if (incidentId) {
    const principal = await authorize(request, incidentId, { access, allow: ["coordinator", "witness", "volunteer"], view: role });
    return json({ state: await stateFor(principal) });
  }
  if (role || access) throw new ApiError(400, "incidentId is required for shared views.");

  const owner = await resolveOwner(request);
  if (owner) return json({ state: await loadState(owner.incidentId, "coordinator", owner.secret) });

  // One client must not be able to use up the global daily workspace allowance for everyone else.
  if (!takeIpSlot(request, "workspace", LIMITS.maxWorkspacesPerIpPerHour, 3_600_000)) {
    throw new ApiError(429, "Too many new demo workspaces from this network. Please try again later.");
  }
  const { secret, state } = await createWorkspace();
  return json({ state }, { headers: { "Set-Cookie": sessionCookie(secret, request) } });
});
