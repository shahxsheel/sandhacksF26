# Emergency incident context and volunteer coordination

Recorded 2026-11-15. This document preserves the user's concept and distinguishes it from the council's recommended first milestone.

## User's original concept

A safe bystander reports a fire through 911. The envisioned emergency operator sends a link where the witness can contribute photos, video, and voice context. ElevenLabs transcribes speech and supports spoken information gathering. Gemini combines those reports into an evolving picture of the incident, proposes resource needs, and identifies suitable registered volunteers nearby. Volunteers can potentially help during the gap before professional responders arrive; firefighters receive more context on approach. Multiple witnesses reporting the same event would eventually contribute to one shared incident. A person collapsing near an available trained neighbor is another motivating example.

This is a proposed product flow. No emergency-service integration, agency partnership, response-time advantage, or deployment has been established.

## Constraints and available hardware

- Judges should understand the value immediately; keep the build as simple as possible.
- Optimize authentic sponsor use rather than adding technology solely to enter more tracks.
- Hardware is desirable but optional.
- Hardware stated by the user: a couple of Arduino boards described as "uno - q 4gb"; a Raspberry Pi 5 with 8 GB RAM and camera; basic electronics. Exact Arduino inventory has not been verified.
- Hackathon duration, team size, and official prize criteria are not yet supplied.

## Tracks supplied by the user

Best Overall Hack; Overall Runner-Up; Most Innovative Project; Data for Good; Best Project Built with ElevenLabs; Best Database-Driven / Agent Backend (Neon); Best Use of Gemini API; Best Use of Solana; Best Use of Tiger Data; Best Use of Vultr; Best Domain Name.

## Reusable evaluation skill

The user supplied the llm-council skill. An unchanged project-local copy is saved at [.agents/skills/llm-council/SKILL.md](.agents/skills/llm-council/SKILL.md). The evaluation uses five independent thinking lenses, anonymous peer review, and a chairman synthesis. Session concurrency limits require batches of up to three advisors or reviewers. These are perspectives from the same model, not independent human experts or multiple model families.

## Council recommendation (advice, not a user-approved scope change)

Build a briefing-first prototype toward the original volunteer-response vision. Judge-facing pitch: **"Turn scattered witness reports into one clear incident brief, so responders can arrive informed."** This expresses intended value; actual improvements in response or outcomes remain unmeasured.

All five advisors favor evidence synthesis as the core. Three retain a bounded coordinator-approved volunteer assignment; two postpone it. All five anonymous reviewers favor the Executor's smaller scope. These are same-model perspectives, not external validation. Full record: [council transcript](active/council-transcript-2026-11-15.md).

### Minimal demonstration

Use one staged fire scenario; no real fire or real emergency call. A simulated operator provides an incident-scoped upload link. A witness contributes a short voice report and photo. A second witness supplies a conflicting detail. A coordinator confirms the reports belong to the same incident. The dashboard updates a concise brief with source links, marks the conflict, and supports a human correction. A duplicated claim remains a duplicate rather than becoming independent corroboration.

Real prototype work: upload, transcription, multimodal extraction, source-linked synthesis, persisted revisions, and coordinator review. Simulate emergency-service integration and responder identities. Begin with a known incident ID; cross-incident clustering and citywide mapping are later extensions. Start with photos and short voice recordings; streaming video is outside the first milestone.

### Track strategy

- **Gemini:** combine image and transcript observations into structured, reviewable evidence. Demonstrate a correction and an unresolved contradiction. AI inference must stay distinguishable from witness claims.
- **ElevenLabs:** voice intake is an actual interaction path. Optional spoken clarification should resolve a missing factual detail the witness can answer from their current safe location. Transcription is a legitimate role; no prize rubric has been checked to establish whether it is competitive enough by itself.
- **Neon:** persist incidents, reports, evidence references, brief revisions, and review state. If volunteer matching is subsequently added, store skills, availability, approvals, and acceptance; PostGIS can filter proximity. Ordinary relational data integrity has real product value here.
- **Data for Good / Overall:** demonstrate useful coordination and a coherent end-to-end experience. Report actual prototype behavior; do not invent lives saved or response-time improvement.
- **Innovation:** nearby volunteer alerting already exists (PulsePoint). The candidate differentiator is an evolving multimodal evidence brief that preserves conflicting accounts and human review. Competitive novelty beyond that limited check is unverified.
- **Vultr:** following the hosting discussion, use Vultr as the planned web application and backend host, coordinating uploads and provider requests while Neon holds durable data. Local tooling and a container build recipe are prepared; no cloud instance has been provisioned. Hosting is a natural integration, but prize competitiveness depends on the official rubric.
- **Domain Name:** optional if a memorable name is used; no availability checked. **Tiger Data / Solana:** no necessary role in this minimal version; revisit only when a concrete requirement justifies them. Do not add a second database or blockchain solely to collect tracks.

Priorities above are based on the user's track names and verified platform capabilities, not official eligibility rules or judging criteria.

### Volunteer and hardware extension

Preserve the original goal: a coordinator can eventually approve one appropriate, bounded support assignment for a registered volunteer at an established staging location. Match skills and availability before considering proximity. Avoid treating an AI-generated resource suggestion as authorization to dispatch a person. In the fire scenario, ordinary volunteers do not enter the burning building.

After the core demonstration works, use the Raspberry Pi 5 as a volunteer desk beacon: LED indicates an approved simulated task; a button acknowledges it; the dashboard records acceptance. This creates a small visible hardware interaction without requiring the Arduino boards or camera. It is an optional extension, not an implemented feature or proof of response effectiveness.

### Observable acceptance checks

Each factual brief item links to an input; contradictions remain visible; corrections supersede stale information while preserving history; missing facts remain unknown; duplicates do not count as independent confirmation. A photograph does not verify structural safety, diagnoses, casualties, or a safe route. Failed transcription/synthesis leaves a visible failure state and access to the original submission. For sensitive recordings, use scoped access and a deletion approach.

**First step:** create one fixture-backed incident board with three reports (including a contradiction and duplicate) and the exact corrected brief it should produce; rehearse a roughly 90-second demonstration before integrating APIs.


## Minimal source checks

Track names came from the user; official event eligibility and judging rubrics were not supplied or independently verified. These sources verify existing products or platform capabilities, not prize competitiveness or real-world outcomes.

- [PulsePoint Respond](https://www.pulsepoint.org/pulsepoint-respond): existing nearby CPR-volunteer alerting alongside conventional response.
- [ElevenLabs Speech Engine](https://elevenlabs.io/docs/overview/capabilities/speech-engine): speech-to-text and text-to-speech capabilities.
- [Gemini image understanding](https://ai.google.dev/gemini-api/docs/image-understanding) and [structured outputs](https://ai.google.dev/gemini-api/docs/structured-output): multimodal input and structured extraction capabilities; not validation for emergency safety judgments.
- [Neon PostGIS](https://neon.com/docs/extensions/postgis): spatial storage and nearby queries.
- [American Red Cross fire safety](https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/fire.html): leave a burning building, stay out, and never re-enter.
