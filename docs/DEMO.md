# FirstLink — 90-second live demo script

**Audience:** judges and sponsors. **Tone:** calm, explicit about simulation limits. **Do not** imply real 911, dispatch, or building-entry decisions.

---

## 0:00–0:10 — Open on certainty vs. noise

> “This is **FirstLink**, a **staged campus incident**—not a live emergency feed. The promise is simple: *the first minutes, connected.* Witnesses report what they **saw**; we turn that into one shared brief with **sources, conflicts, and unknowns** left visible.”

Show landing → **Open demo** → coordinator `/dashboard`. Point to **Simulation / Staged incident** labels.

## 0:10–0:25 — Sample brief vs. live Gemini

> “You’re seeing a **sample brief** tied to seeded witness lines—usable before any paid AI call. When I choose **Generate brief**, a **bounded** Gemini Interactions pass may replace it; the UI always shows whether the brief is **sample**, **rules fallback**, or **live Gemini**. We never label fallback output as live AI.”

**Do not** click Generate unless judges want to spend budget; stay on sample mode if caps are tight.

## 0:25–0:40 — Evidence and uncertainty

> “Each claim links to **report IDs**—Alex at the west entrance, Jordan at North Plaza. Notice the disputed line: both repeat **hearsay** about someone inside; we keep that **unconfirmed**. The map is a **demo schematic**, not navigation or safety guidance.”

Expand one witness card; show source label and text. Read one **unknown** aloud.

## 0:40–0:55 — Coordinator correction and volunteer flow

> “I add a **coordinator note**—for example, ‘treat occupancy as unknown until simulated units verify.’ Nearby volunteers are **registered demo roles**, not auto-dispatched. I **approve** one volunteer to the **designated staging point** only; they open the volunteer link and **Accept** or **Decline**. No self-dispatch before approval.”

Add note → approve Maya (supply kit) → copy volunteer link → accept in second tab or phone.

## 0:55–1:30 — Sponsors and what is real

> “**Neon** persists this isolated workspace—reports, brief JSON, assignments—with `fl_` tables and strict caps. **Vultr** hosts the app and short-lived media on disk, not in the database. **Google Gemini** synthesizes the brief when we explicitly ask, with reservations under a **$20** demo cap. **ElevenLabs** is optional for **recorded** witness audio transcription and brief narration—also capped; typed reports work without it.”

> “What we **do not** verify: real 911, agency CAD, travel times, medical triage, or structural safety. Volunteer movement is **simulated coordination** for the hackathon story.”

Reset demo if time allows: **Reset** clears only this browser workspace.

---

## Quick checklist

| Beat | Show |
|------|------|
| Staged labels | Simulation / Staged incident on shell |
| Brief mode | `sample` vs live Gemini badge |
| Sources | Claim → report ID → witness text |
| Uncertainty | Unknowns + disputed claim |
| Human gate | Coordinator note + volunteer approve → accept |
| Sponsors | Neon · Vultr · Gemini · ElevenLabs roles above |

**Closing line:** “FirstLink connects the first minutes with honest uncertainty—witness evidence in, one shared picture out, humans approving every step toward support.”