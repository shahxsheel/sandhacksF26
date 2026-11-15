# FirstLink verification record

Date: 2026-11-15. This records tested prototype behavior, not emergency-service effectiveness.

## Automated and local checks

- Backend integration: 25 checks passed in final review, using actual route handlers and schema against PGlite with mocked providers. Coverage includes ownership/role isolation, origin checks, assignment transitions, report/media limits, source validation, persistent reservation guards, narration caching, reset preserving rate limits, per-network workspace limits, and retention.
- Desktop/mobile Chromium: 32 end-to-end tests passed in the full final review against the real configured Neon branch with paid providers excluded. Browser checks cover consent, fields, navigation, readable headings, reports, notes, authorization, approval/acceptance, re-approval after a decline, shared-role navigation, and keyboard map pins. After the final 320 px and hydration fixes, eight affected desktop/mobile checks passed, including two new narrow-screen cases.
- TypeScript and production builds passed; the standalone Docker image also built on the production Linux VM.
- Desktop, 375 px, and 320 px screenshots were captured and inspected. The final narrow-screen capture covers 320 px controls and hydration; post-rollout screenshots verify the production layout.

## Live services, local and public

Both local and deployed server runs completed the same bounded integration:

1. Submit a staged 7.15-second WAV and a plain cream test JPEG (explicitly described as a test image).
2. ElevenLabs returns the transcript: “I am outside the west entrance. I can see smoke near the upstairs windows. I do not know whether anybody is inside.”
3. Photo and recording are persisted outside Postgres. Public authenticated retrieval returned 200; anonymous retrieval returned 404. Witness and volunteer views exposed no owner tokens or report feed.
4. Gemini Interactions (`gemini-4-hydrogen`) produces four claims with valid report references. The uploaded blank image is not represented as incident evidence. Repeated hearsay remains unconfirmed.
5. ElevenLabs returns MP3 narration. Public audio was 322,707 bytes / 40.26 seconds. A second request returned identical cached audio without another provider reservation.

Final deployed application commit: `b01d267def3050ae6dcfcf9731b51da5f2241877`. After container replacement, the same media report, Gemini brief, and cached narration persisted. A fresh production browser walkthrough passed typed witness submission, coordinator note, approval, shared-link volunteer acceptance, coordinator refresh, and a 320 px share dialog, with zero page/hydration errors. Twelve final public screenshots cover all four views at 1440, 375, and 320 px; the final landing and small-phone witness form were visually inspected.

The public browser loaded HTTPS in a secure context and persisted a typed report, coordinator note, approved support task, and volunteer acceptance. The container runs as uid 1000 with ffprobe available; runtime secrets have mode 0600 and uploads use a persistent host directory.

The public Chromium recorder path also passed record → stop → preview → WebM upload → live ElevenLabs transcription, using a synthetic Web Audio stream containing the staged witness clip. Native headless device capture stalled even with permission granted; the test replaced that input stream only. It exercised the actual browser MediaRecorder and deployed upload/transcription path, but does not prove a physical microphone or phone. No paid request was made by the stalled device-capture attempts.

## Budget and infrastructure evidence

After the final live checks, persistent reservations were Gemini 1,000,000 micro-USD ($1) of the $14 internal cap, and ElevenLabs 21,000 units of the 40,000 internal cap. These conservative reservations are not billed usage. Two small Gemini setup calls preceded the ledger. An earlier read-only ElevenLabs subscription snapshot reported 151 metered characters of 131,000, with usage extensions disabled; account metering may lag and is not an LLM token budget.

The final database-size query returned 10,182,656 bytes (about 9.7 MiB), including demo/test workspaces. Only the existing Neon free-plan project and production branch were used. One Vultr VM was provisioned at a verified $20/month plan rate; it continues billing until removed. No provider-side hard infrastructure spending cap is claimed.

## Limits

No live 911/CAD feed, emergency-agency integration, medical triage, safe-route determination, response-time improvement, actual volunteer travel, or physical hardware has been verified. Maps, distances, people, and incident are staged. Share links are capability links; the demo volunteer link is shared across assigned demo volunteers rather than authenticating individual identities. This is a hackathon prototype, not a production dispatch service.
