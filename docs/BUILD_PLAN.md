# FirstLink implementation contract

## Deliverable

A complete staged campus-fire incident demo with three views: coordinator dashboard, witness reporting, and volunteer acceptance. Real uploads, bounded live Gemini Interactions synthesis, ElevenLabs recording transcription and brief narration, Neon persisted reports/brief/assignments, and a deployed Vultr app. One incident per isolated browser workspace; seeded evidence/brief makes the experience useful before any paid call. No real notifications, 911 connection, diagnosis, building-entry recommendation, or physical hardware claim.

## Page routes

- `/`: polished landing, primary "Open demo" links `/dashboard`, secondary witness reporting link.
- `/dashboard`: coordinator workspace, evidence source detail, manual refresh, live brief generation, add coordinator note, volunteer selection/approval, share witness and volunteer links, reset demo.
- `/report/[incidentId]?access=<witnessToken>`: safe-bystander form with name, observed location, text, optional photo, optional recorded/uploaded short audio. Owner browser may use this without access token. Consent checkbox; submission confirmation. Use phone microphone when supported and text fallback otherwise.
- `/volunteer/[incidentId]?access=<volunteerToken>`: approved assignments, role/skill details, staging location, Accept / Decline actions. Owner browser can test this view without token. No self-dispatch before approval.

## API contract (JSON success shapes)

All user-visible failures use `{error: string}` and meaningful HTTP status. Mutations validate same origin when an Origin header is present; use httpOnly SameSite cookies, role tokens, input/file limits and paid-route rate/budget limits. Never log provider errors or credentials verbatim.

- `GET /api/session?incidentId=...&access=...&role=witness|volunteer` returns `{state: DemoState}`. No query means owner coordinator workspace, creates one if needed. GET creates only a bounded number of workspaces/day. Role-specific access uses indexed tokens, not scanning all database JSON. Do not expose coordinator or other role tokens to shared-role viewers.
- `POST /api/session/reset` returns `{state}` for the owner, resetting only this app workspace.
- `POST /api/reports` multipart: `incidentId`, optional `access`, `name`, `location`, `text`, `consent` (`true`), optional `photo` (JPEG/PNG/WebP max 4 MB), optional `audio` (max 4 MB, must validate duration <=45s server-side). Returns `{state,report}`. Cap 8 reports per incident. Transcription uses ElevenLabs only on a submitted audio recording. Text/photo reporting works without paid audio. Uploaded media is on the app server's volume, never in Postgres. Re-encode images or validate content and do not serve SVG/HTML uploads. Do not fail text reports solely because a provider is temporarily unavailable; clearly label the missing transcription.
- `POST /api/brief` JSON `{incidentId}` owner only: generate source-linked brief via Gemini Interactions and return `{state}`. Explicit user action only, no AI calls on GET or interval. Keep last good brief and provide clear errors. Bounded input/output, `store:false`, one request, no auto retries. Validate JSON and source report IDs, no unsupported facts. Fallback is explicitly marked sample/rules-based, never labeled live Gemini.
- `POST /api/notes` JSON `{incidentId,text}` owner only: append coordinator correction/note, retain history, return `{state}`.
- `POST /api/assignments` JSON `{incidentId,volunteerId,task}` owner only: approve support at designated staging point; ensure available and no conflicting active assignment, return `{state}`.
- `POST /api/assignments/[id]` JSON `{action:'accept'|'decline',incidentId,access?}` owner or volunteer token: valid state transition only, return `{state}`.
- `POST /api/speech` JSON `{incidentId}` owner: narrate the current short brief through ElevenLabs, return audio/mpeg. Cap text <=1500 chars; cache identical generated speech, budget reserve and rate-limit. A failed narration must not hide the brief.
- `GET /api/media/[id]?incidentId=...&access=...`: authenticated owner or role token, streams verified media with nosniff; filesystem paths never accepted from request.
- Existing `/api/health` stays cheap and does not query Neon/providers.

## Persistence and limits

Use relational `fl_` tables for sessions, incidents, reports, volunteers, assignments, events, and usage reservations. Small JSONB is acceptable for structured briefs only. Create schema once through an explicit script; do not run migrations on every request. Add ownership indexes and constraints, prevent double assignment/acceptance. Existing free plan only; preserve unrelated tables. Bounded session count, max 8 reports/session, no recurring DB polling. Give data a documented retention/cleanup approach.

Budget reservations must be persistent and atomic across restarts. Use a conservative global Gemini reserve (e.g. $0.20/request) and stop well below $20 (leave initial-test headroom); bound report count/text/image resolution/output so the reservation covers the request. ElevenLabs project reserve should stop below 50k metered units; use server-validated audio <=45sec and conservative reservation (e.g. 5000 units per transcription, 3000 for <=1500-char TTS). No provider retries by default. At exhaustion, sample/demo reading and typed reporting remain usable. These are local app guards, not an account-wide cap on other applications.

## Agent ownership

Backend owns `src/lib/server/*`, `src/app/api/*` except existing health, `db/schema.sql`, `scripts/init-db.mjs`, and backend-specific tests. Frontend owns `src/components/*`, all non-API pages, and `src/app/globals.css`. Parent owns shared models/seeds, layout, dependencies, deployment, integration tests, commits and provider credentials. Read the shared types before implementation; no competing edits.
