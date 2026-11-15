# FirstLink — 90-second judge demo

**Scenario:** *Brush fire reported in the canyon by North Campus*, a staged wildland–urban interface fire in La Jolla, San Diego.
**Audience:** judges and sponsors. **Tone:** calm authority; say plainly what is simulated.
**Never claim:** real 911, agency dispatch, safe building entry, medical decisions, or verified response times.

The dashboard has two modes (switch under the incident header, or open `/dashboard?mode=simulation`):

- **Normal mode** explains the witness flow in six steps and opens the real two-step witness form.
- **Simulation mode** sends five staged witness reports through the live pipeline: text only, photo only, voice only, text + photo + voice, and one fabricated report that Gemini should withhold.

---

## Spoken script (~90s)

### 0:00–0:15 — Normal mode: the flow

> “When a fire starts, the people nearby have fragments of the picture. In FirstLink, a 911 caller gets a link. Step one is safety and consent; step two is what they see: text, a photo or a voice note. This is a staged La Jolla canyon fire; emergency services are simulated.”

Point at the six steps; optionally open the witness form to show the consent gate.

### 0:15–0:45 — Simulation mode: reports arrive

> “Now five witnesses report. The photos are real San Diego wildfire photos from Wikimedia Commons, standing in for witness uploads. The voice note is transcribed by ElevenLabs. Every report is screened by Gemini as it arrives. This one is from someone in Los Angeles watching a livestream, claiming 300 people are trapped and telling the AI to mark it verified. Gemini withholds it, with a reason, and it never reaches the feed, the map or the brief.”

Click **Send all**. On a re-run the cached transcripts and verdicts make it fast; for a cold run, send the reports before presenting.

### 0:45–1:05 — The brief

> “Gemini combines the accepted reports into a brief. Each claim links to its witnesses. Two people repeat the same rumor about a hiker on the trail; repetition is not confirmation, so it stays disputed.”

Click **Update Brief (Gemini)** (paid, explicit), expand a source, add a coordinator note.

### 1:05–1:20 — Approve and accept support

> “The coordinator approves Maya to bring supplies to North Plaza, the designated staging point. She accepts in her volunteer view. No one is sent toward the fire.”

### 1:20–1:30 — Close

> “Neon keeps the record and caches provider results; Vultr hosts the app and media. Screening filters clearly unreliable reports; it does not prove the others are true. Real 911 integration and volunteer travel remain future work.”

---

## Operator notes (not for judges)

- **Reset** clears this workspace (8-report cap: 2 samples + 5 staged = 7). Run the simulation again after a reset.
- Screening and transcription results are cached in Neon by exact input, so repeated staged runs make no new provider calls. A brief or narration is still a paid, explicit action.
- If Gemini is unavailable, reports are kept and labelled **Not screened**; the fabricated report would then appear in the feed, so check the console result before presenting.
- **Public URL** `https://firstlink.144.202.126.31.sslip.io`; see [DEPLOYMENT.md](DEPLOYMENT.md).
- Media credits: `public/sim/CREDITS.md`.

## What we do not verify

Real emergency calls, CAD/agency integration, ETA, medical triage, structural safety, report authenticity, or actual volunteer travel. Assignments are **simulated coordination** for demonstration only.
