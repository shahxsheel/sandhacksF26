// Backend integration test: drives the real route handlers against an in-memory Postgres (PGlite) with
// mocked Gemini/ElevenLabs. No network, no Neon, no paid calls. See tests/backend/README.md.
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import sharp from "sharp";
import { initSchema, pg } from "./db-shim.mjs";
import { calls, mock } from "./providers-mock.mts";
import * as sessionRoute from "../../src/app/api/session/route";
import * as resetRoute from "../../src/app/api/session/reset/route";
import * as reportsRoute from "../../src/app/api/reports/route";
import * as briefRoute from "../../src/app/api/brief/route";
import * as notesRoute from "../../src/app/api/notes/route";
import * as assignRoute from "../../src/app/api/assignments/route";
import * as assignIdRoute from "../../src/app/api/assignments/[id]/route";
import * as speechRoute from "../../src/app/api/speech/route";
import * as mediaRoute from "../../src/app/api/media/[id]/route";
import { containerFor, durationFromPackets } from "../../src/lib/server/media-parse";
import { parseGeminiBrief, speechText, buildRulesBrief } from "../../src/lib/server/brief-logic";
import { purgeExpired } from "../../src/lib/server/store";

const HOST = "http://localhost:3000";
class Jar { cookie = ""; }
async function call(handler: any, method: string, path: string, opts: { jar?: Jar; json?: unknown; form?: FormData; headers?: Record<string, string>; ctx?: any } = {}) {
  const headers: Record<string, string> = { host: "localhost:3000", ...opts.headers };
  if (opts.jar?.cookie) headers.cookie = opts.jar.cookie;
  let body: any;
  if (opts.json !== undefined) { headers["content-type"] = "application/json"; body = JSON.stringify(opts.json); }
  if (opts.form) { body = opts.form; }
  let req = new Request(HOST + path, { method, headers, body });
  if (opts.form) {
    // compute content-length for the multipart body
    const buf = Buffer.from(await new Response(opts.form).arrayBuffer());
    const ct = new Response(opts.form).headers.get("content-type")!;
    req = new Request(HOST + path, { method, headers: { ...headers, "content-type": ct, "content-length": String(buf.length) }, body: buf });
  }
  const res: Response = await handler(req, opts.ctx);
  const set = res.headers.get("set-cookie");
  if (set && opts.jar) opts.jar.cookie = set.split(";")[0];
  return res;
}
const j = async (res: Response) => res.json() as Promise<any>;
const pass: string[] = [];
const ok = (name: string) => { pass.push(name); console.log("ok -", name); };

// ---- pure helpers
assert.deepEqual(containerFor("matroska,webm"), { ext: "webm", mime: "audio/webm" });
assert.equal(containerFor("mov,mp4,m4a,3gp,3g2,mj2")?.ext, "m4a");
assert.equal(containerFor("avi"), null);
assert.equal(durationFromPackets("0.000000,0.020000\n0.020000,0.020000\nN/A,N/A\n44.960000,0.040000\n"), 45);
assert.equal(durationFromPackets(""), null);
ok("media parse helpers");

const budgets: [string, string, number][] = [["gemini", "micro_usd", 14_000_000], ["elevenlabs", "credits", 40_000]];
const n = await initSchema(readFileSync(new URL("../../db/schema.sql", import.meta.url), "utf8"), budgets);
ok(`schema applies (${n} statements)`);
// idempotent
await initSchema(readFileSync(new URL("../../db/schema.sql", import.meta.url), "utf8"), budgets);
ok("schema idempotent");

// ---- session
const A = new Jar();
let res = await call(sessionRoute.GET, "GET", "/api/session", { jar: A });
assert.equal(res.status, 200);
assert.match(A.cookie, /^fl_session=/);
assert.match(res.headers.get("set-cookie")!, /HttpOnly; SameSite=Lax/);
let { state } = await j(res);
const incidentId: string = state.incident.id;
const { witnessToken, volunteerToken } = state.access;
assert.equal(state.viewerRole, "coordinator");
assert.equal(state.reports.length, 2);
assert.equal(state.volunteers.length, 4);
assert.equal(state.events.length, 4);
assert.equal(state.brief.mode, "sample");
ok("GET /api/session creates seeded workspace + cookie");

res = await call(sessionRoute.GET, "GET", "/api/session", { jar: A });
const again = (await j(res)).state;
assert.equal(again.incident.id, incidentId);
assert.deepEqual(again.access, state.access);
assert.equal(again.reports.length, 2);
assert.equal(again.reports[0].sourceLabel, "W-01");
ok("owner reload returns same workspace and stable share tokens");

res = await call(sessionRoute.GET, "GET", `/api/session?incidentId=${incidentId}&role=witness`, { jar: A });
let v = (await j(res)).state;
assert.equal(v.viewerRole, "witness"); assert.equal(v.access, undefined); assert.equal(v.reports.length, 0);
ok("owner can preview witness view without token");

const anon = new Jar();
res = await call(sessionRoute.GET, "GET", `/api/session?incidentId=${incidentId}&access=${witnessToken}&role=witness`, { jar: anon });
v = (await j(res)).state;
assert.equal(res.status, 200); assert.equal(v.viewerRole, "witness"); assert.equal(v.access, undefined); assert.equal(v.reports.length, 0);
assert.equal(anon.cookie, "");
res = await call(sessionRoute.GET, "GET", `/api/session?incidentId=${incidentId}&access=${volunteerToken}&role=volunteer`);
v = (await j(res)).state; assert.equal(v.viewerRole, "volunteer"); assert.equal(v.volunteers.length, 0);
res = await call(sessionRoute.GET, "GET", `/api/session?incidentId=${incidentId}&access=${volunteerToken}&role=witness`);
assert.equal(res.status, 403);
res = await call(sessionRoute.GET, "GET", `/api/session?incidentId=${incidentId}&access=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA&role=witness`);
assert.equal(res.status, 404); assert.ok((await j(res)).error);
res = await call(sessionRoute.GET, "GET", `/api/session?incidentId=${incidentId}`);
assert.equal(res.status, 404);
res = await call(sessionRoute.GET, "GET", `/api/session?role=witness`);
assert.equal(res.status, 400);
ok("role tokens: right role works, wrong role 403, bad token 404, no tokens leak");

// ---- isolation
const B = new Jar();
const stateB = (await j(await call(sessionRoute.GET, "GET", "/api/session", { jar: B }))).state;
assert.notEqual(stateB.incident.id, incidentId);
res = await call(notesRoute.POST, "POST", "/api/notes", { jar: B, json: { incidentId, text: "intrusion" } });
assert.equal(res.status, 404);
res = await call(sessionRoute.GET, "GET", `/api/session?incidentId=${incidentId}`, { jar: B });
assert.equal(res.status, 404);
ok("workspaces isolated: other session cannot read or mutate");

// ---- same origin
res = await call(notesRoute.POST, "POST", "/api/notes", { jar: A, json: { incidentId, text: "x" }, headers: { origin: "https://evil.example" } });
assert.equal(res.status, 403);
res = await call(notesRoute.POST, "POST", "/api/notes", { jar: A, json: { incidentId, text: "x" }, headers: { origin: "http://localhost:3000" } });
assert.equal(res.status, 200);
ok("same-origin enforcement");

// ---- notes
res = await call(notesRoute.POST, "POST", "/api/notes", { jar: A, json: { incidentId, text: "Correction: the east door is clear." } });
state = (await j(res)).state;
assert.equal(state.brief.notes.length, 2); assert.equal(state.brief.revision, 3);
assert.ok(state.events.some((e: any) => e.type === "note"));
res = await call(notesRoute.POST, "POST", "/api/notes", { jar: A, json: { incidentId, text: "   " } });
assert.equal(res.status, 400);
ok("notes append, revision bumps, validation");

// ---- assignments
const maya = state.volunteers.find((x: any) => x.name === "Maya Chen"); const ethan = state.volunteers.find((x: any) => x.name === "Ethan Brooks"); const dan = state.volunteers[1];
res = await call(assignRoute.POST, "POST", "/api/assignments", { jar: A, json: { incidentId, volunteerId: ethan.id, task: "Bring first aid kit to staging" } });
assert.equal(res.status, 409);
res = await call(assignRoute.POST, "POST", "/api/assignments", { jar: A, json: { incidentId, volunteerId: maya.id, task: "Go inside the building and search" } });
assert.equal(res.status, 400);
res = await call(assignRoute.POST, "POST", "/api/assignments", { jar: A, json: { incidentId, volunteerId: maya.id, task: "Bring the supply kit to North Plaza" } });
assert.equal(res.status, 200); state = (await j(res)).state;
assert.equal(state.assignments.length, 1); assert.equal(state.assignments[0].status, "approved");
res = await call(assignRoute.POST, "POST", "/api/assignments", { jar: A, json: { incidentId, volunteerId: maya.id, task: "Second task at staging" } });
assert.equal(res.status, 409); assert.match((await j(res)).error, /active assignment/);
res = await call(assignRoute.POST, "POST", "/api/assignments", { jar: A, json: { incidentId, volunteerId: "00000000-0000-4000-8000-000000000000", task: "Support at staging" } });
assert.equal(res.status, 404);
res = await call(assignRoute.POST, "POST", "/api/assignments", { jar: anon, json: { incidentId, volunteerId: dan.id, task: "Support at staging" }, headers: {} });
assert.equal(res.status, 404);
res = await call(assignRoute.POST, "POST", "/api/assignments", { json: { incidentId, volunteerId: dan.id, task: "Support at staging" } });
assert.equal(res.status, 404);
const aid = state.assignments[0].id;
const ctx = { params: Promise.resolve({ id: aid }) };
// witness token cannot respond
res = await call(assignIdRoute.POST, "POST", `/api/assignments/${aid}`, { json: { action: "accept", incidentId, access: witnessToken }, ctx });
assert.equal(res.status, 403);
// volunteer view of state after assignment
v = (await j(await call(sessionRoute.GET, "GET", `/api/session?incidentId=${incidentId}&access=${volunteerToken}&role=volunteer`))).state;
assert.equal(v.assignments.length, 1); assert.equal(v.volunteers.length, 1); assert.equal(v.volunteers[0].name, "Maya Chen");
res = await call(assignIdRoute.POST, "POST", `/api/assignments/${aid}`, { json: { action: "accept", incidentId, access: volunteerToken }, ctx });
assert.equal(res.status, 200); v = (await j(res)).state;
assert.equal(v.viewerRole, "volunteer"); assert.equal(v.assignments[0].status, "accepted"); assert.ok(v.assignments[0].respondedAt);
res = await call(assignIdRoute.POST, "POST", `/api/assignments/${aid}`, { json: { action: "accept", incidentId, access: volunteerToken }, ctx });
assert.equal(res.status, 200);
res = await call(assignIdRoute.POST, "POST", `/api/assignments/${aid}`, { json: { action: "decline", incidentId, access: volunteerToken }, ctx });
assert.equal(res.status, 409);
// other incident's assignment id not reachable
res = await call(assignIdRoute.POST, "POST", `/api/assignments/${aid}`, { jar: B, json: { action: "decline", incidentId: stateB.incident.id }, ctx });
assert.equal(res.status, 404);
// decline path frees volunteer
res = await call(assignRoute.POST, "POST", "/api/assignments", { jar: A, json: { incidentId, volunteerId: dan.id, task: "Translate at staging point" } });
state = (await j(res)).state; const aid2 = state.assignments.find((a: any) => a.volunteerId === dan.id).id;
res = await call(assignIdRoute.POST, "POST", `/api/assignments/${aid2}`, { jar: A, json: { action: "decline", incidentId, role: "volunteer" }, ctx: { params: Promise.resolve({ id: aid2 }) } });
assert.equal(res.status, 200); assert.equal((await j(res)).state.viewerRole, "volunteer");
res = await call(assignRoute.POST, "POST", "/api/assignments", { jar: A, json: { incidentId, volunteerId: dan.id, task: "Translate again at staging" } });
assert.equal(res.status, 200);
ok("assignments: approval rules, conflicts, strict transitions, role enforcement");

// ---- reports
const mk = (fields: Record<string, string>, files: Record<string, [Buffer, string, string]> = {}) => {
  const f = new FormData();
  for (const [k, val] of Object.entries(fields)) f.set(k, val);
  for (const [k, [b, type, name]] of Object.entries(files)) f.set(k, new File([new Uint8Array(b)], name, { type }));
  return f;
};
const base = { incidentId, name: "Sam Rivera", location: "South lawn", text: "Smoke thinning near the windows.", consent: "true" };
res = await call(reportsRoute.POST, "POST", "/api/reports", { form: mk({ ...base, consent: "false" }), jar: A });
assert.equal(res.status, 400);
res = await call(reportsRoute.POST, "POST", "/api/reports", { form: mk({ ...base, access: witnessToken, role: "witness" }) });
assert.equal(res.status, 200); let out = await j(res);
assert.equal(out.report.sourceLabel, "W-03"); assert.equal(out.report.kind, "text"); assert.equal(out.state.viewerRole, "witness"); assert.equal(out.state.reports.length, 0);
res = await call(reportsRoute.POST, "POST", "/api/reports", { form: mk({ ...base, access: volunteerToken }) });
assert.equal(res.status, 403);
res = await call(reportsRoute.POST, "POST", "/api/reports", { form: mk({ ...base, text: "" }) , jar: B });
assert.equal(res.status, 404);
// photo
const png = await sharp({ create: { width: 3000, height: 2000, channels: 4, background: { r: 200, g: 30, b: 30, alpha: 0.5 } } }).png().toBuffer();
res = await call(reportsRoute.POST, "POST", "/api/reports", { form: mk({ ...base, text: "Photo of the entrance" }, { photo: [png, "image/png", "../../evil.png"] }), jar: A });
assert.equal(res.status, 200); out = await j(res);
assert.equal(out.report.kind, "photo"); assert.ok(out.report.photoId);
const photoId = out.report.photoId;
res = await call(mediaRoute.GET, "GET", `/api/media/${photoId}?incidentId=${incidentId}`, { jar: A, ctx: { params: Promise.resolve({ id: photoId }) } });
assert.equal(res.status, 200); assert.equal(res.headers.get("content-type"), "image/jpeg"); assert.equal(res.headers.get("x-content-type-options"), "nosniff");
const img = Buffer.from(await res.arrayBuffer()); const meta = await sharp(img).metadata();
assert.equal(meta.format, "jpeg"); assert.ok(Math.max(meta.width!, meta.height!) <= 1600);
res = await call(mediaRoute.GET, "GET", `/api/media/${photoId}?incidentId=${incidentId}&access=${witnessToken}`, { ctx: { params: Promise.resolve({ id: photoId }) } });
assert.equal(res.status, 200);
res = await call(mediaRoute.GET, "GET", `/api/media/${photoId}?incidentId=${incidentId}`, { ctx: { params: Promise.resolve({ id: photoId }) } });
assert.equal(res.status, 404);
res = await call(mediaRoute.GET, "GET", `/api/media/${photoId}?incidentId=${stateB.incident.id}`, { jar: B, ctx: { params: Promise.resolve({ id: photoId }) } });
assert.equal(res.status, 404);
res = await call(mediaRoute.GET, "GET", `/api/media/${photoId}?incidentId=${incidentId}`, { jar: A, headers: { range: "bytes=0-9" }, ctx: { params: Promise.resolve({ id: photoId }) } });
assert.equal(res.status, 206); assert.equal((await res.arrayBuffer()).byteLength, 10);
const dirFiles = readdirSync(`${process.env.DATA_DIR}/media/${incidentId}`); assert.equal(dirFiles.length, 1); assert.match(dirFiles[0], /^[0-9a-f-]{36}\.jpg$/);
ok("photo upload re-encoded, stored on volume, served only with authorization");
// bad uploads
res = await call(reportsRoute.POST, "POST", "/api/reports", { form: mk({ ...base }, { photo: [Buffer.from("<svg onload=alert(1)>"), "image/svg+xml", "x.svg"] }), jar: A });
assert.equal(res.status, 415);
res = await call(reportsRoute.POST, "POST", "/api/reports", { form: mk({ ...base }, { photo: [Buffer.alloc(5 * 1024 * 1024), "image/png", "big.png"] }), jar: A });
assert.equal(res.status, 413);
// audio with no ffprobe: report saved, no audio, transcription failed
res = await call(reportsRoute.POST, "POST", "/api/reports", { form: mk({ ...base, text: "Text plus voice" }, { audio: [Buffer.from("not real audio"), "audio/webm", "a.webm"] }), jar: A });
const audioRes = res.status; out = await j(res);
if (audioRes === 200) { assert.equal(out.report.kind, "text"); assert.equal(out.report.transcriptionStatus, "failed"); assert.equal(calls.stt, 0); ok("voice note dropped safely when ffprobe unavailable (text kept)"); }
else { assert.equal(audioRes, 400); ok("invalid audio rejected with 400"); }
// cap: have W-01..03, photo (4), maybe voice (5); fill to 8
let count = (await j(await call(sessionRoute.GET, "GET", "/api/session", { jar: A }))).state.reports.length;
while (count < 8) { res = await call(reportsRoute.POST, "POST", "/api/reports", { form: mk({ ...base }), jar: A }); assert.equal(res.status, 200); count++; }
res = await call(reportsRoute.POST, "POST", "/api/reports", { form: mk({ ...base }), jar: A });
assert.equal(res.status, 409); assert.match((await j(res)).error, /maximum of 8/);
ok("report cap of 8 enforced");

// ---- brief
state = (await j(await call(sessionRoute.GET, "GET", "/api/session", { jar: A }))).state;
const ids: string[] = state.reports.map((r: any) => r.id);
mock.geminiResponder = (input) => {
  const text = input[0].text as string; const rep = JSON.parse(text.split("REPORTS: ")[1].split("\n")[0]);
  return JSON.stringify({ headline: "Smoke reported", summary: "Witnesses report smoke.", claims: [{ text: "Smoke near windows", report_ids: [rep[0].id, rep[1].id], kind: "reported" }, { text: "Photo shows entrance", report_ids: [rep[rep.length - 1].id], kind: "observed", note: "photo" }], unknowns: ["Occupancy"], conflicts: [], suggested_needs: ["Supplies at staging"] });
};
const rev0 = state.brief.revision; const notes0 = state.brief.notes.length;
res = await call(briefRoute.POST, "POST", "/api/brief", { jar: A, json: { incidentId } });
assert.equal(res.status, 200); state = (await j(res)).state;
assert.equal(state.brief.mode, "gemini"); assert.equal(state.brief.revision, rev0 + 1); assert.equal(state.brief.notes.length, notes0);
assert.equal(state.brief.claims.length, 2); assert.equal(calls.gemini, 1);
const gi = calls.lastGeminiInput as any[]; assert.equal(gi.filter((p) => p.type === "image").length, 1);
assert.ok(!JSON.stringify(gi).includes("Sam Rivera"), "names must not be sent to Gemini");
const rev = await pg.query("select revision, mode from fl_brief_revisions where incident_id=$1 order by revision", [incidentId]); assert.ok(rev.rows.length >= 2);
const usage = await pg.query("select provider, kind, units, status, detail from fl_usage"); assert.equal(usage.rows.length, 1); assert.equal(usage.rows[0].units, 200000);
ok("brief via Gemini (mocked): saved, notes preserved, revision history, usage reserved, no names sent");
// invalid source id keeps last good brief
mock.geminiResponder = () => JSON.stringify({ headline: "x", summary: "y", claims: [{ text: "z", report_ids: ["11111111-1111-4111-8111-111111111111"], kind: "reported" }], unknowns: [], conflicts: [], suggested_needs: [] });
res = await call(briefRoute.POST, "POST", "/api/brief", { jar: A, json: { incidentId } });
assert.equal(res.status, 502); assert.match((await j(res)).error, /last brief is unchanged/);
mock.geminiResponder = () => "not json at all";
res = await call(briefRoute.POST, "POST", "/api/brief", { jar: A, json: { incidentId } });
assert.equal(res.status, 502);
mock.geminiResponder = () => JSON.stringify({ headline: "x", summary: "The building is structurally sound and safe to enter.", claims: [], unknowns: [], conflicts: [], suggested_needs: [] });
res = await call(briefRoute.POST, "POST", "/api/brief", { jar: A, json: { incidentId } });
assert.equal(res.status, 502);
after: { const s2 = (await j(await call(sessionRoute.GET, "GET", "/api/session", { jar: A }))).state; assert.equal(s2.brief.mode, "gemini"); assert.equal(s2.brief.headline, "Smoke reported"); }
ok("invalid / unsupported Gemini output rejected; last good brief kept");
// rate limit: 3 used so far (1 + 3 failed)... limit 6/hour
let last = 200; for (let i = 0; i < 4; i++) { res = await call(briefRoute.POST, "POST", "/api/brief", { jar: A, json: { incidentId } }); last = res.status; if (last === 429) break; }
assert.equal(last, 429);
const callsAtLimit = calls.gemini;
res = await call(briefRoute.POST, "POST", "/api/brief", { jar: A, json: { incidentId } }); assert.equal(res.status, 429); assert.equal(calls.gemini, callsAtLimit);
res = await call(briefRoute.POST, "POST", "/api/brief", { jar: B, json: { incidentId } }); assert.equal(res.status, 404);
res = await call(briefRoute.POST, "POST", "/api/brief", { jar: anon, json: { incidentId } }); assert.equal(res.status, 404);
ok("per-session brief rate limit holds; non-owner cannot generate");
// budget exhaustion on workspace B
await pg.query("update fl_budgets set cap = reserved + 100000 where provider = 'gemini'");
res = await call(briefRoute.POST, "POST", "/api/brief", { jar: B, json: { incidentId: stateB.incident.id } });
assert.equal(res.status, 503); assert.match((await j(res)).error, /usage allowance/);
const g = await pg.query("select reserved, cap from fl_budgets where provider='gemini'"); assert.ok(Number(g.rows[0].reserved) <= Number(g.rows[0].cap));
// rules fallback still available; labelled rules
res = await call(briefRoute.POST, "POST", "/api/brief", { jar: B, json: { incidentId: stateB.incident.id, mode: "rules" } });
assert.equal(res.status, 200); assert.equal((await j(res)).state.brief.mode, "rules");
// missing key
mock.geminiKey = false; await pg.query("update fl_budgets set cap = 14000000 where provider='gemini'");
const C = new Jar(); const stateC = (await j(await call(sessionRoute.GET, "GET", "/api/session", { jar: C }))).state;
res = await call(briefRoute.POST, "POST", "/api/brief", { jar: C, json: { incidentId: stateC.incident.id } }); assert.equal(res.status, 503);
mock.geminiKey = true;
ok("budget exhaustion -> 503 with no provider call; rules fallback labelled; missing key 503");
// concurrent reservations cannot exceed cap
await pg.query("update fl_budgets set cap = reserved + 450000 where provider='gemini'");
const { reserveBudget } = await import("../../src/lib/server/budget");
const sessions = (await pg.query("select s.id sid, i.id iid from fl_sessions s join fl_incidents i on i.session_id=s.id")).rows as any[];
const results = await Promise.all(Array.from({ length: 6 }, (_, i) => reserveBudget({ provider: "gemini", kind: "t", units: 200000, sessionId: sessions[i % sessions.length].sid, incidentId: sessions[i % sessions.length].iid, limit: ["t" + i, 99, 3600] })));
assert.equal(results.filter((r) => r.ok).length, 2);
ok("atomic budget reservation: 6 concurrent requests, only 2 fit under cap");

// ---- speech
const ttsBefore = calls.tts;
res = await call(speechRoute.POST, "POST", "/api/speech", { jar: A, json: { incidentId } });
assert.equal(res.status, 200); assert.equal(res.headers.get("content-type"), "audio/mpeg");
res = await call(speechRoute.POST, "POST", "/api/speech", { jar: A, json: { incidentId } });
assert.equal(res.status, 200); assert.equal(calls.tts, ttsBefore + 1);
const el = await pg.query("select count(*)::int n from fl_usage where provider='elevenlabs'"); assert.equal(el.rows[0].n, 1);
res = await call(speechRoute.POST, "POST", "/api/speech", { jar: anon, json: { incidentId } }); assert.equal(res.status, 404);
ok("narration: audio/mpeg, cached second call reserves nothing, owner only");
assert.ok(speechText({ headline: "H", summary: "S ".repeat(2000), unknowns: ["u"] }, 1500).length <= 1500);

// ---- reset
res = await call(resetRoute.POST, "POST", "/api/session/reset", { jar: A, json: { incidentId } });
assert.equal(res.status, 200); state = (await j(res)).state;
assert.equal(state.incident.id, incidentId); assert.equal(state.reports.length, 2); assert.equal(state.assignments.length, 0); assert.equal(state.brief.notes.length, 0); assert.equal(state.brief.mode, "sample");
assert.equal(state.access.witnessToken, witnessToken);
assert.ok(!existsSync(`${process.env.DATA_DIR}/media/${incidentId}`));
res = await call(sessionRoute.GET, "GET", `/api/session?incidentId=${stateB.incident.id}`, { jar: B }); assert.equal(res.status, 200);
assert.equal((await pg.query("select count(*)::int n from fl_incidents")).rows[0].n, 3);
res = await call(resetRoute.POST, "POST", "/api/session/reset", { jar: anon, json: {} }); assert.equal(res.status, 404);
ok("reset restores seed, removes media, keeps links, does not touch other workspaces");
const keptLimits = await pg.query("select count(*)::int n from fl_rate_limits where session_id = (select session_id from fl_incidents where id=$1)", [incidentId]);
assert.ok(keptLimits.rows[0].n > 0);
res = await call(briefRoute.POST, "POST", "/api/brief", { jar: A, json: { incidentId } });
assert.equal(res.status, 429);
ok("reset does not clear per-workspace paid-call rate limits");

// ---- per-network workspace creation cap (only for requests that came through the proxy)
const viaProxy = { "x-forwarded-for": "198.51.100.7" };
const sessionsBefore: string[] = (await pg.query("select array_agg(id) ids from fl_sessions")).rows[0].ids;
for (let i = 0; i < 40; i++) {
  res = await call(sessionRoute.GET, "GET", "/api/session", { jar: new Jar(), headers: viaProxy });
  assert.equal(res.status, 200);
}
res = await call(sessionRoute.GET, "GET", "/api/session", { jar: new Jar(), headers: viaProxy });
assert.equal(res.status, 429);
assert.equal(res.headers.get("set-cookie"), null);
res = await call(sessionRoute.GET, "GET", "/api/session", { jar: new Jar(), headers: { "x-forwarded-for": "198.51.100.8" } });
assert.equal(res.status, 200);
res = await call(sessionRoute.GET, "GET", "/api/session", { jar: new Jar(), headers: { "x-forwarded-for": "::1" } });
assert.equal(res.status, 200); // local/unproxied traffic (Next.js fills in the socket address) is not limited
res = await call(sessionRoute.GET, "GET", "/api/session", { jar: A, headers: viaProxy });
assert.equal(res.status, 200); assert.equal((await j(res)).state.incident.id, incidentId);
await pg.query("delete from fl_sessions where not (id = any($1::uuid[]))", [sessionsBefore]);
ok("one network cannot use up the global workspace allowance; existing owners unaffected");

// ---- retention
await pg.query("update fl_sessions set expires_at = now() - interval '1 hour' where id = (select session_id from fl_incidents where id=$1)", [stateB.incident.id]);
await purgeExpired();
assert.equal((await pg.query("select count(*)::int n from fl_incidents")).rows[0].n, 2);
assert.equal((await pg.query("select count(*)::int n from fl_reports where incident_id=$1", [stateB.incident.id])).rows[0].n, 0);
ok("expired workspaces purged with cascade");

// ---- parse helpers
const idset = new Set(["a"]);
assert.throws(() => parseGeminiBrief('{"headline":"h"}', idset));
assert.equal(buildRulesBrief([]).claims.length, 0);
ok("brief parser strictness");
console.log(`\n${pass.length} checks passed`);
process.exit(0);
