# FirstLink — 90-second judge demo

**Scenario:** *Smoke reported at the Arts Building* — a staged North Campus incident.
**Audience:** judges and sponsors. **Tone:** calm authority; say plainly what is simulated.
**Never claim:** real 911, agency dispatch, safe building entry, medical decisions, or verified response times.

---

## Spoken script (~90s)

### 0:00–0:15 — Open the dashboard

> “When an incident happens, nearby witnesses have fragments of the picture. FirstLink turns those fragments into one source-linked brief and lets a coordinator organize nearby support. This is a staged campus-fire scenario; emergency services are simulated.”

### 0:15–0:30 — Show a witness report

> “A safe bystander opens this link and sends text, a photo, or a short voice note. ElevenLabs transcribes the recording. The original observation stays available beside the transcript.”

Prepare the voice/photo report before presenting; show its playback and source label.

### 0:30–0:50 — Show the brief and sources

> “Gemini combines the reports into this brief. Each claim links back to its witnesses. These two people repeat the same rumor about someone inside; repetition does not make it confirmed. Occupancy stays unknown. I can add a correction while preserving the record.”

Expand one source and add the note: “Treat occupancy as unknown until simulated units verify.”

### 0:50–1:15 — Approve and accept support

> “The coordinator approves Maya to bring supplies to North Plaza, our designated staging point. Her volunteer view shows that approved task. She accepts, and the shared record updates. No one is sent into the building.”

Approve Maya → volunteer view → Accept → coordinator Refresh.

### 1:15–1:30 — Close

> “Neon keeps the record; Vultr hosts the app and media. FirstLink connects witness evidence, an honest shared picture, and human-approved support. Actual 911 integration and volunteer travel remain future work.”

---

## On-screen beats (quick checklist)

| Time | Show |
| --- | --- |
| Open | Simulation labels on shell |
| Witness | Consent + text/voice/photo path (optional live submit) |
| Brief | Claims → report IDs; **disputed** repeated-inside rumor; unknowns |
| Coordinator | Note correcting occupancy |
| Volunteer | Approve Maya → Accept at staging point |
| Close | Restate simulation limits |

---

## Operator notes (not for judges)

- **Generate brief / Play narration** spend Gemini and ElevenLabs budget; use seeded **sample** brief if caps are tight or judges did not ask for live AI. The UI labels `sample`, `rules`, and live Gemini—never mislabel fallback as live AI.
- **Voice → transcription → brief → narration** passed locally and on the deployed server. For a rehearsed 90-second tour, prepare the media report before presenting; live model latency varies.
- **Public URL** `https://firstlink.144.202.126.31.sslip.io` is live over HTTPS; see release verification in [DEPLOYMENT.md](DEPLOYMENT.md).
- **Reset demo** (coordinator) clears only this browser workspace; links can stay stable.
- Second tab or phone works well for witness/volunteer links without exposing coordinator tokens.

## What we do not verify

Real emergency calls, CAD/agency integration, ETA, medical triage, structural safety, or actual volunteer travel. Assignments are **simulated coordination** for demonstration only.
