# FirstLink — 90-second judge demo

**Scenario:** three staged San Diego incidents active at once: a canyon brush fire by UCSD North Campus, flooding in the Genesee Avenue underpass, and a bluff collapse at Black's Beach.
**Audience:** judges and sponsors. **Tone:** calm authority; say plainly what is simulated.
**Never claim:** real 911, agency dispatch, safe building entry, medical decisions, or verified response times.

The landing page tells the story (How it works, What's simulated, Built with). The console at `/dashboard` is the product: no explanations inside it, only a small TRAINING EXERCISE label. Staged inputs come from the **presenter panel** (`Shift+S` or the faint "Presenter" button bottom-right); judges never need to see it.

---

## Spoken script (~90s)

### 0:00–0:15 — Landing: the flow

> "When something happens, the people nearby have fragments of the picture. A 911 caller gets a FirstLink link: safety and consent first, then what they see — text, a photo or a voice note. Gemini screens every report, and when several incidents are active it routes each one to the right incident."

Click **Open console**.

### 0:15–0:40 — The console, reports arrive

> "This is the coordinator's console. Three incidents are active in the queue. On the canyon fire, witnesses are reporting."

Open the presenter panel, **Witness link → Send all 5**, close it. Reports arrive in the feed one by one. Open one (photo / voice) in the drawer.

> "The fabricated one — someone in Los Angeles watching a livestream, telling the AI to mark it verified — never reaches the feed. It sits under Held for review, with Gemini's reason."

Click **Held for review**.

### 0:40–1:00 — Routing between incidents

Presenter panel, **Dispatch intake → Send all 4** (follow routed reports on).

> "These come in unrouted. The person at the Gliderport is standing at the bluff collapse, but they're describing smoke from the canyon — Gemini routes it to the fire. Water in the underpass goes to the flood. A power outage in Chula Vista matches nothing active, so it's held."

Point at the queue counts and the "Routed" tag with its reason in the drawer.

### 1:00–1:20 — Brief and support

> "Gemini turns accepted reports into a brief where every claim cites its witnesses; repeated hearsay stays disputed. The coordinator approves a volunteer for the designated staging point — never toward the hazard."

**Regenerate brief** (paid, explicit), then **Assign** a volunteer.

### 1:20–1:30 — Close

> "Neon keeps the record and caches provider results; Vultr hosts the app and media. Screening filters clearly unreliable reports; it does not prove the others are true. Real 911 integration and volunteer travel remain future work."

---

## Operator notes (not for judges)

- **Reset** (navbar) resets all three incidents; ids and share links are kept. Run the staged inputs again after a reset.
- Screening, routing and transcription results are cached in Neon by exact input, so repeated staged runs make no provider calls. A brief or narration is still a paid, explicit action.
- If Gemini is unavailable (see [GEMINI.md](GEMINI.md) — quota status), reports are kept and labelled **Not screened** and intake reports are not routed. Check the presenter results before presenting.
- **Public URL** `https://firstlink.work` (also `https://firstlink.144.202.126.31.sslip.io`); see [DEPLOYMENT.md](DEPLOYMENT.md).
- Media credits: `public/sim/CREDITS.md`.

## What we do not verify

Real emergency calls, CAD/agency integration, ETA, medical triage, structural safety, report authenticity, or actual volunteer travel. Assignments are **simulated coordination** for demonstration only.
