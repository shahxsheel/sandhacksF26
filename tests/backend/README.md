# Backend integration test

Exercises the real API route handlers and SQL (`db/schema.sql`, `src/lib/server/*`) against an in-memory Postgres
([PGlite](https://pglite.dev)) with Gemini/ElevenLabs mocked. It never touches Neon or any paid provider.

```sh
npm ci
npm run test:backend
```

Covers: session/cookie isolation, hashed role tokens and role views, same-origin checks, notes/revisions, assignment
rules and transitions, report validation/cap, photo re-encoding and authorized media, brief validation and last-good
retention, rate limits, atomic budget reservation, narration caching, reset, and retention purge.
Not covered (needs real services): live Gemini/ElevenLabs calls, and audio validation (needs `ffprobe`; without it the
test confirms a voice note is dropped while the text report is kept).
