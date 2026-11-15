import { z } from "zod";
import { requireOwner } from "@/lib/server/auth";
import { LIMITS } from "@/lib/server/config";
import { ApiError, assertSameOrigin, cleanText, json, readJson, route, uuidSchema } from "@/lib/server/http";
import { stateFor } from "@/lib/server/services";
import { insertNote } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({ incidentId: uuidSchema, text: z.string().max(LIMITS.maxNoteLength * 2) });

/** POST /api/notes: owner appends a coordinator correction; earlier notes are kept. */
export const POST = route(async (request: Request) => {
  assertSameOrigin(request);
  const input = await readJson(request, body);
  const principal = await requireOwner(request, input.incidentId);
  const text = cleanText(input.text, true);
  if (text.length < 1 || text.length > LIMITS.maxNoteLength) throw new ApiError(400, `Write a note of up to ${LIMITS.maxNoteLength} characters.`);
  await insertNote(principal.incidentId, text);
  return json({ state: await stateFor(principal) });
});
