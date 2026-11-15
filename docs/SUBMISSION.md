# FirstLink submission copy

**Tagline:** The first minutes, connected.

**Pitch:** FirstLink turns scattered witness observations into one source-linked incident brief, then lets a human coordinator approve nearby volunteers for support at a designated staging point. Witnesses can send text, photos, or short voice notes. Conflicting accounts and repeated rumors stay visibly uncertain. This hackathon demonstration uses a staged campus fire; real emergency-service integration and volunteer movement are simulated.

## Strongest track evidence

| Track | What to demonstrate |
| --- | --- |
| Overall / Data for Good | One clear arc: witness report → source-linked brief → human correction → approved support → acceptance. No measured outcome or response-time claims. |
| Gemini API | Live Interactions request combines photo evidence and transcripts into validated, source-linked claims with unknowns and disputed information. |
| ElevenLabs | A submitted voice recording becomes a transcript; the coordinator can hear the current brief through cached narration. Both paths work on the public server. |
| Neon backend | Durable incidents, reports, brief revisions, notes, role access, assignment transitions, and atomic budget reservations; state survives redeployment on the existing free plan. |
| Vultr | The actual public app and media live on one Vultr VM, behind HTTPS, with persistent storage and an unprivileged container. |

These alignments use the track names supplied by the user. Official eligibility rules and judging rubrics have not been provided or verified. Solana and Tiger Data have no implemented role. The free IP-based hostname is not a purchased custom domain. Hardware was optional and has not been integrated or physically tested.

## What was built

Next.js/TypeScript, Google Gemini Interactions, ElevenLabs transcription and narration, Neon Postgres, and Vultr Docker/Caddy hosting. Each demo browser owns an isolated workspace and can share scoped witness and volunteer links. Paid actions have persistent project caps, input limits, and no automatic retries. No real dispatch notification is sent.

Use the [90-second script](DEMO.md) and [verification record](VALIDATION.md) for the presentation. Keep a prepared media report available so variable model latency does not dominate the live tour.
