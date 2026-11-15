# FirstLink backend notes

Implements the API contract in [BUILD_PLAN.md](BUILD_PLAN.md). Code: `src/lib/server/*`, `src/app/api/*`, `db/schema.sql`, `scripts/init-db.mjs`.

## Setup

`node scripts/init-db.mjs` creates the `fl_` tables once and seeds `fl_budgets` (idempotent, `fl_` objects only, never run at request time).
No migrations run on requests; if the tables are missing, API calls fail with a generic 500.

Server environment: `DATABASE_URL` (pooled), `GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-4-hydrogen`), `ELEVENLABS_API_KEY`,
`ELEVENLABS_VOICE_ID` (optional; default is a fixed premade voice), `DATA_DIR` (default `.runtime`, must be a writable private volume),
`GEMINI_BUDGET_MICRO_USD` / `ELEVENLABS_BUDGET_UNITS` (read only by `init-db`; defaults 14,000,000 and 40,000).
Runtime needs `ffprobe` (ffmpeg package) on `PATH` to accept voice notes; without it a voice note is dropped and the text/photo report is still saved.

## Identity and access

- Owner: httpOnly `SameSite=Lax` cookie `fl_session` (random 256-bit secret; only its SHA-256 is stored). One workspace (incident) per session.
- Share links: `witnessToken`/`volunteerToken` = HMAC(cookie secret, role:incidentId). The database stores only their SHA-256 (unique indexes), so a DB read does not reveal links, and only the owner can re-derive them. Tokens go in `?access=`; shared viewers never receive tokens.
- Shared views withhold coordinator data: witness view has no reports/brief/volunteers; volunteer view has assignments and only the assigned volunteers (the single volunteer link is shared by all volunteers in this demo).
- Reset keeps the incident id and links, replaces all content, removes media files.

## Additions to the contract (all optional, non-breaking)

- `POST /api/reports` form field `role=witness` and `POST /api/assignments/[id]` body `role:"volunteer"`: lets the owner browser, testing a shared page without a token, receive that page's role view (`viewerRole`) in the returned `state` instead of the coordinator view. With an access token the role view is returned automatically.
- `POST /api/brief` body `mode:"rules"`: explicit local, no-AI summary (`brief.mode === "rules"`), for when Gemini is unavailable. The default path never silently falls back; failures return `{error}` and keep the last brief.

## Limits and guards

- Workspaces: 40 new workspaces/network/hour behind the direct Caddy proxy (in-memory single-server guard; existing owners and loopback exempt), 300/day globally, 1000 active, 7-day sliding expiry (renewed at most hourly). 8 reports, 20 notes, 20 assignments per workspace.
- Paid calls: per-session fixed-window rate limits (brief 6/h, transcription 4/day, narration 6/h, report submits 20/h) plus an atomic global reservation in `fl_budgets` (single conditional UPDATE). Gemini reserves USD 0.20/request against a USD 14 cap (code hard cap USD 16); ElevenLabs reserves 5,000 units/transcription and 3,000/narration against 40,000 (hard cap 42,000). Reservations persist across restarts, stay counted after a request is sent, and are released only when the call never left the server. Narration is cached by SHA-256(model, voice, format, text), and cache hits reserve nothing. Actual token counts are recorded in `fl_usage.detail`.
- Providers: one request each, no retries; raw provider errors are never logged or returned.
- Uploads: 4 MB each, 9 MB multipart. Photos are decoded with sharp (JPEG/PNG/WebP only, single frame), EXIF-rotated, stripped, resized to <=1600 px and re-encoded to JPEG. Audio must probe as a real audio-only container (WebM/Ogg/MP4/MP3/WAV/AAC) and its measured packet duration must be <=45 s (headers are not trusted). Files live at `DATA_DIR/media/<incidentId>/<uuid>.<ext>` with server-generated names and are served only by `/api/media/[id]` after authorization.

## Report screening (simulation mode)

- Each `POST /api/reports` runs one Gemini Interactions request (`store:false`, JSON schema `{decision, reason}`, <=600 output tokens, 30 s timeout, no retries) with the incident facts, the report's location/text/transcript and a <=1024 px copy of its photo. Names are not sent.
- `exclude` stores the report with `screening_status = 'flagged'`; it is filtered out of `state.reports`, `loadBriefContext` and brief photos, and appears only in the coordinator's `withheldReports`. Failures store `unscreened` and keep the report visible with that label.
- Budget: USD 0.05 reservation per screening against the same Gemini cap (rate limit 16/hour/workspace). First live runs measured well under that.
- `fl_provider_cache` (key = SHA-256 of model, prompt version and exact inputs) stores screening verdicts and transcripts (text only). A cache hit reserves nothing. Local and deployed servers share it through Neon, so the five staged simulation reports cost provider calls once in total. Rows older than 30 days are pruned.

## Retention

Expired workspaces (and their media directories and narration cache entries older than 7 days) are purged opportunistically (about 1 in 10 workspace creations, 10 sessions per pass). `fl_usage` rows older than 120 days are pruned; `fl_budgets` holds the authoritative totals. Reset a budget deliberately with SQL only if the user authorizes more spend.

## Tests

`tests/backend` runs the real route handlers and schema against in-memory Postgres with mocked providers (see its README).
