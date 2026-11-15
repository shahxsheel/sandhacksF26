import { assertSameOrigin, json, route } from "@/lib/server/http";
import { submitReport } from "@/lib/server/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/reports (multipart): witness or owner submits a text/photo/voice report. */
export const POST = route(async (request: Request) => {
  assertSameOrigin(request);
  return json(await submitReport(request));
});
