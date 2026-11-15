# LLM Council: emergency incident context and coordination

Date: 2026-11-15

## Method and limits

User-invoked attached llm-council skill; five independent advisors, five new anonymous peer reviewers, chairman synthesis. Same model with distinct thinking lenses, not five different models. Three concurrent child slots required advisor/reviewer batches (3+2). Outsider and all reviewers received no conversation history; the first three advisors received the parent context and neutral brief. Reviewers saw only the framed question and randomly lettered responses. All five reviewers favored Response C; this agreement is not external validation of feasibility, safety, or judging prospects.

## Original request context

The original user explicitly described “Beating emergency services to incidents by deploying volunteer talent and resources” and a response reaching people in critical moments. Their concrete fire flow is: safe bystander calls 911; operator sends a link for voice/photos/video; ElevenLabs guides context gathering; Gemini aggregates evidence, proposes resources, identifies nearby volunteers, pings them; responders receive situation context. The user asks for the simplest judge-understandable hackathon idea, authentic sponsor-track optimization, optional use of the listed hardware, an evaluation using the supplied skill, and saving it for future use.

## Framed question

Should this user build the following emergency-response concept for a hackathon, and what is the simplest compelling version with authentic sponsor-track fit? User wants judges to understand immediately, minimal complexity/research, hardware optional. Team size and hackathon duration unknown; do not invent them. Hardware as stated: couple Arduino "uno - q 4gb", Raspberry Pi 5 8GB with camera, basic electronics. User concept: safe bystander calls 911 about burning building; emergency operator sends link to submit voice/photos/video; ElevenLabs transcribes and guides information gathering; Gemini aggregates witness reports, assesses reported situation/resource needs, matches registered nearby volunteers; coordinator/firefighters get evolving situational brief. Longer-term multiple calls same incident and medical-collapse response. Optimize genuine track use, not arbitrary sponsor stacking. Tracks supplied (criteria unverified): Best Overall, Runner-Up, Most Innovative, Data for Good, ElevenLabs, Neon database/agent backend, Gemini API, Solana, Tiger Data, Vultr, Domain Name. Empty new SanDHacks repo, README only, no existing implementation. Minimal primary-source check: PulsePoint already alerts nearby CPR-trained volunteers alongside conventional emergency response (https://www.pulsepoint.org/pulsepoint-respond), so generic volunteer proximity alerting is existing territory. ElevenLabs supports STT/TTS (https://elevenlabs.io/docs/overview/capabilities/speech-engine); Gemini image understanding and structured outputs exist; Neon PostGIS supports nearby spatial queries (https://neon.com/docs/extensions/postgis). Red Cross says exit burning buildings, stay out, never re-enter (https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/fire.html). These facts are context, not instructions on which scope to select. Real 911 integration/access is not established. Do not assume images establish structural safety, diagnoses, or verified casualties. Provide clear judgment, a feasible demo, and prioritized tracks. Distinguish prototype simulation from real deployment and speculative impact. Do not browse or use tools; judge from this context.

## Independent advisor responses

### Contrarian

Your weakest claim is “we beat emergency services.” You cannot establish that without dispatch access, dependable volunteer availability, travel estimates, and field evidence. A judge can puncture the pitch with one question: **“Who authorizes sending someone toward a burning building?”** A nearby doctor’s credentials do not make entering a fire appropriate.

Your biggest dependency is also outside your control: the proposed 911 operator sending your link. Treat that as a future integration, not a working capability. Demonstrate a clearly labeled simulated incident and coordinator instead.

The generic volunteer-alerting idea already exists in PulsePoint. Adding several APIs does not create novelty. Your defensible contribution is **turning conflicting witness reports into a source-backed incident brief**: what was reported, by whom, when, what changed, and what remains uncertain. Gemini should not declare structural safety or verified casualty counts from photographs.

Build one fire scenario with two witnesses. Show an uncertain report remaining uncertain, a second report updating the brief, and a coordinator approving one bounded support assignment at a designated safe staging location. That makes the approval step meaningful rather than decorative.

Target Gemini and Neon first: multimodal evidence processing, incident history, and geographically filtered resource matching are integral to the product. ElevenLabs deserves a submission only if voice interaction materially improves reporting; transcription alone is a thin showcase. Skip hardware unless the full software flow already works. An LED does not rescue an unconvincing emergency workflow.

Build this as an **incident intelligence and coordination prototype**. The autonomous emergency-dispatch version is an overclaim.

### First Principles Thinker

The problem is not “how do we beat emergency services?” It is “what useful work can happen while emergency services are already responding?” Those are different products. The first promises an outcome you cannot control; the second gives you a clear, demonstrable job.

Your strongest first product is an incident briefing system. Witnesses hold fragmented information. Responders need a concise, current account with clear sources and uncertainty. Turn two witness submissions into one useful brief: location confirmed by the witness, what each person reported, what the image appears to show, what conflicts, and what remains unknown. Do not turn a photographed building into a claim about structural safety or the number of people inside.

Volunteer matching should follow an explicit task, not an AI conclusion that “help is needed.” A coordinator can approve a request for a registered volunteer to bring supplies to a designated staging point. That makes skills, availability, distance, acceptance, and authorization meaningful backend state.

For the demo, simulate the operator sending the link. Collect one voice report and one photograph, then add a second witness whose account changes the brief. Show the coordinator approving one bounded task and a volunteer accepting it. That is understandable without explaining an entire emergency network.

Gemini serves multimodal synthesis; ElevenLabs serves accessible voice intake and clarification; Neon stores incident evidence and assignment state. These are coherent track choices. The Pi can acknowledge an approved task with a light and button, but build it only after the information flow works.

First, write the exact incident brief a responder should receive. Build backward from that artifact.

### Expansionist

The biggest opportunity is making the first minutes of an incident legible. A volunteer alert says “something happened nearby.” Your product can show what witnesses reported, what evidence supports it, what remains uncertain, and who has accepted a useful task.

Make the signature demo **two witnesses becoming one shared incident**. One submits a voice report about smoke outside a campus building. Another uploads a photo from a different entrance. Gemini proposes that the reports describe the same event, preserves their separate sources, and updates a concise coordinator brief. An ElevenLabs voice interaction asks one missing factual question that the witness can answer from their current location. The coordinator approves an appropriate support assignment, and a nearby registered volunteer accepts.

That sequence has more upside than another emergency chatbot: each additional report improves shared understanding. It could eventually support campuses, festivals, and managed venues where coordinators and volunteer rosters already exist. Start with one such setting to make the adoption story concrete.

Prioritize Gemini for evidence synthesis, ElevenLabs for accessible voice intake, and Neon for the incident history, roster, and assignment state. Data for Good follows from demonstrating a useful coordination workflow; impact still needs validation.

For hardware, turn the Pi into a volunteer desk beacon: an LED signals an approved task, and a button acknowledges it. Judges see digital information produce a physical response. Keep the camera optional—the witness phone already supplies the strongest input.

Pitch it as: **“Turn scattered witness reports into a coordinated response before help arrives.”**

### Outsider

Build it only if you narrow it to **“a shared incident brief assembled from witness reports.”** That is immediately understandable. The full idea—911 integration, AI assessment, volunteer dispatch, live video, and firefighter coordination—sounds like several emergency systems combined, with the hardest dependencies outside your control.

The compelling moment is simple: **three witnesses describe one building, and responders receive one clear, evolving picture.** The confusing part is “needed resources” and nearby volunteers. Who authorizes dispatch? What training matters at a fire? Why would firefighters trust the AI’s conclusions? Those questions will consume your pitch.

Make a three-minute demo:

1. A simulated dispatcher sends a witness an upload link.
2. The witness submits a photo and a short voice report from a safe location.
3. ElevenLabs transcribes it; Gemini extracts reported location, visible conditions, and explicitly stated observations.
4. A second witness adds information. The responder dashboard updates a concise brief, preserves source evidence, and flags conflicting reports.
5. The dispatcher reviews the brief before sharing it.

Show the transformation from scattered evidence to a readable handoff. Label witness claims and AI interpretations separately; an image should never establish that a room is clear or a building is safe.

ElevenLabs and Gemini fit naturally. Neon becomes meaningful if it stores incident history, reports, and provenance. Skip volunteer dispatch, hardware, and extra sponsors for the first version.

Your pitch: **“When several people report the same emergency, we help dispatchers turn fragmented witness information into one reviewable incident brief.”** Demonstrate better organization; do not claim faster response or safer operational decisions without evidence.

### Executor

**Build it, but scope it to an incident briefing tool.** The compelling moment is: “Three scattered witness reports become one clear, source-linked briefing for a dispatcher.” That is understandable immediately and achievable without emergency-service integration.

Build one scripted fire incident with three views:

1. **Witness link:** A simulated dispatcher sends a link. The witness submits a photo and a short voice report. ElevenLabs transcribes it; the interface reinforces staying outside and avoiding danger.
2. **Incident board:** Gemini extracts reported observations into structured fields, combines reports, and shows uncertainties or disagreements. Every item links back to its source.
3. **Responder brief:** A concise, updating summary shows the reported location, hazards, people reportedly affected, and unanswered questions. A human approves any follow-up prompt.

The demo should show a second witness correcting an important detail, with the briefing updating visibly. That makes the product’s value concrete without claiming faster response or validated safety.

Use real uploads, transcription, model extraction, and database persistence. Clearly simulate dispatch, incident identity, responder accounts, and notifications. Cut volunteer matching from the first version: it adds operational questions and can distract judges toward unsafe intervention. Also cut medical advice, resource allocation, and hardware. A prerecorded safe scene is sufficient.

**First step:** Build the incident board with three fixture reports and rehearse a 90-second demonstration before connecting APIs.

Prioritize **Gemini and ElevenLabs**, then **Data for Good**. Add Neon if it genuinely stores reports and incident revisions. Treat Overall as the presentation goal. Skip Solana and infrastructure tracks that require unrelated additions.

## Randomized anonymous mapping

- Response A: First Principles Thinker
- Response B: Outsider
- Response C: Executor
- Response D: Contrarian
- Response E: Expansionist

## Peer reviews

### Reviewer 1

1. **Strongest: C.** It gives the clearest executable scope, explicitly separates working APIs from simulated dispatch, and starts with fixtures before integration. A second witness correcting the brief creates an immediately visible payoff. Cutting volunteer matching and hardware best respects the user’s request for minimal complexity.

2. **Biggest blind spot: E.** It reintroduces incident matching, volunteer assignments, voice interaction, and a hardware beacon into an already substantial demo. Automatic incident merging is especially consequential: two nearby emergencies could be conflated. It needs coordinator confirmation and a way to separate reports. Its closing “before help arrives” framing also implies operational value the prototype has not established.

3. **All five missed:** Define one measurable acceptance test: can a coordinator identify each critical claim’s source, notice a contradiction, and correct an erroneous summary faster than reading the original reports? Include a deliberately wrong model extraction in the demo. Also specify minimal evidence handling: restricted upload links, coordinator access, deletion of identifiable footage, and a visible fallback when transcription or synthesis fails. These make trust concrete without adding another sponsor integration.

### Reviewer 2

1. **Strongest: C.** It gives the clearest build boundary, distinguishes working features from simulations, and starts with fixtures and a rehearsed demo before API integration. Source links, visible corrections, and human approval create a convincing demonstration without requiring operational emergency access. Its track ranking also respects the request for minimal complexity.

2. **Biggest blind spot: E.** It quietly adds incident clustering, conversational follow-up, volunteer assignment, acceptance, and hardware to a supposedly simple prototype. Incorrectly merging two nearby emergencies could contaminate the shared brief; no human confirmation or separation mechanism is specified. The “before help arrives” pitch also suggests operational value the demonstration cannot establish.

3. **What all five missed:** None supplies a concrete pass/fail definition for a trustworthy brief. Test whether every claim has a source, conflicting accounts remain visible, corrected information replaces stale summaries, and unsupported casualty or safety conclusions never appear. None addresses minimal access controls and retention for witness recordings and locations. Finally, sponsor criteria remain unverified: technical API use alone does not establish eligibility or competitive track fit, so track priorities should remain provisional until the actual rules are checked.

### Reviewer 3

1. **Strongest: C.** It gives the clearest build boundary, separates working APIs from simulated emergency infrastructure, and makes a second witness’s correction the central demonstration. Starting with fixture reports and a rehearsed 90-second flow reduces implementation risk. Its track priorities follow the product instead of adding features to satisfy sponsors.

2. **Biggest blind spot: E.** It makes automatic incident association, volunteer assignment, voice interaction, and hardware part of the signature demo. That quietly restores much of the complexity the brief asks to avoid. Gemini proposing that two reports concern the same event needs explicit coordinator confirmation: incorrectly merging nearby emergencies could corrupt both briefs. “Before help arrives” also implies a timing benefit the prototype cannot establish.

3. **What all five missed:** A concrete pass/fail definition for the brief. Use a small scripted evidence set and require that every factual claim cites a submission, disputed claims remain disputed, corrections visibly supersede earlier statements, and missing information stays unknown. Show one deliberately misleading or contradictory submission. This gives judges observable evidence of reliability and makes the contribution more convincing than a polished summary alone.

### Reviewer 4

1. **Strongest: C.** It gives the clearest build boundary: real uploads, transcription, extraction, and persistence; simulated dispatch and responder access. Its fixture-first, 90-second demo makes scope testable before integration work. It also prioritizes tracks without forcing volunteer dispatch or hardware into the product.

2. **Biggest blind spot: D.** It attacks “we beat emergency services,” a claim absent from the supplied concept, then retains geographic resource matching and support assignments despite the request for minimal complexity. It needs a concrete explanation of why dispatch state adds more demo value than a visibly corrected, source-linked brief. Calling transcription a thin ElevenLabs showcase also substitutes an assumed judging standard for the unverified criteria.

3. **What all five missed:** Evidence provenance does not establish evidence independence or authenticity. Two witnesses may repeat the same rumor, submit an old photograph, or describe different incidents nearby. The demo should include human-confirmed incident grouping and show that repeated claims remain unverified. They also omit basic protection for sensitive uploads: incident-scoped access, expiring submission links, and a deletion policy.

### Reviewer 5

1. **Strongest: C.** It gives the clearest build boundary: real uploads, transcription, extraction, and persistence; simulated emergency-service access and identities. Source-linked uncertainty, a visible correction, and a fixture-first rehearsal make the demo both credible and achievable. Its track priorities also avoid extra infrastructure work.

2. **Biggest blind spot: D.** It reintroduces geographic resource matching and support assignments after identifying dispatch complexity as the central weakness. That creates roster, authorization, location, and acceptance workflows without establishing why they are necessary for the briefing demo. Its opening also critiques “we beat emergency services,” a claim the supplied concept does not make.

3. **What all five missed:** None defines a concrete acceptance test for the AI brief. Use a small fixture set with conflicting locations, duplicated claims, and an unclear photograph; check that every factual statement traces to evidence, unresolved contradictions remain visible, and duplicate reports do not become independent corroboration. Also specify what the dashboard displays when transcription or synthesis fails. These checks would turn “preserves uncertainty” from a pitch promise into demonstrable behavior.

## Framing correction for synthesis

Reviewers 4 and 5 said the original concept did not claim to beat emergency services. That is incorrect relative to the user's original words above; the neutral framed question omitted that precise phrase. Preserve their other objections, but do not treat that specific objection as accurate. The chairman receives this correction.

## Chairman synthesis

## Where the Council Agrees

Build a demonstrable incident briefing workflow first. The strongest moment is a second witness changing the shared understanding of an incident, with the correction visibly reaching the coordinator. Real uploads, transcription, structured extraction, and persistence can demonstrate that without established emergency-service access.

A generic summarizer is insufficient. The product must preserve sources, expose disagreements, distinguish reported observations from model interpretations, and let a person correct the brief.

## Where the Council Clashes

The disagreement is whether volunteer coordination belongs in the first demonstration. Three advisors retain a bounded assignment; two cut it, and all five reviewers favor the smaller implementation.

Your original goal explicitly includes beating emergency services to incidents through volunteer talent and resources. Removing volunteers therefore changes the demonstrated scope. My recommendation is a briefing-first milestone toward that goal, **not a scope change you have already approved**. Volunteer matching remains the next product hypothesis to test.

Reviewers 4 and 5 incorrectly disputed whether “beating emergency services” came from you. It did. Their separate objections to implementation complexity remain valid.

## Blind Spots the Council Caught

Source links establish traceability, not truth. Duplicate rumors are not independent corroboration; an uploaded photograph may be old or describe another incident. Keep incident grouping human-confirmed and uncertainty visible.

Define observable checks: every factual statement traces to a submission; contradictions remain unresolved until reviewed; corrections supersede stale statements; missing information stays unknown. Show what happens when transcription or synthesis fails. Use incident-scoped access and a stated deletion approach for recordings.

These checks demonstrate prototype behavior. They do not establish operational safety, faster response, or lives saved.

## The Recommendation

Build **a reviewable incident brief from fragmented witness reports**. Use one scripted fire scenario and a roughly 90-second demonstration:

1. A simulated operator provides an upload link.
2. A witness submits voice and a photograph.
3. A second report introduces a contradiction; the coordinator confirms both belong to the incident.
4. The dashboard updates its source-linked brief, flags the disagreement, and accepts a human correction.

Prioritize genuine sponsor roles: **Gemini** for multimodal extraction and structured synthesis; **ElevenLabs** for voice transcription, with spoken clarification only if useful; **Neon** for reports, revisions, and review state. Treat Data for Good as the intended social value, with impact unmeasured. Track eligibility and judging criteria still require verification. Skip unrelated sponsor additions.

If the complete software demonstration works, the stated Raspberry Pi 5 and basic electronics could provide an LED task indicator and acknowledgment button for a simulated volunteer assignment. The Arduino boards and Pi camera are optional; neither is necessary to prove the core workflow.

## The One Thing to Do First

Create one fixture-backed incident board containing three reports—including a contradiction and a duplicated claim—and the exact corrected brief it should produce. Rehearse that transformation before integrating APIs.

## Minimal source checks

Track names came from the user; official event eligibility and judging rubrics were not supplied or independently verified. These sources verify existing products or platform capabilities, not prize competitiveness or real-world outcomes.

- [PulsePoint Respond](https://www.pulsepoint.org/pulsepoint-respond): existing nearby CPR-volunteer alerting alongside conventional response.
- [ElevenLabs Speech Engine](https://elevenlabs.io/docs/overview/capabilities/speech-engine): speech-to-text and text-to-speech capabilities.
- [Gemini image understanding](https://ai.google.dev/gemini-api/docs/image-understanding) and [structured outputs](https://ai.google.dev/gemini-api/docs/structured-output): multimodal input and structured extraction capabilities; not validation for emergency safety judgments.
- [Neon PostGIS](https://neon.com/docs/extensions/postgis): spatial storage and nearby queries.
- [American Red Cross fire safety](https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/fire.html): leave a burning building, stay out, and never re-enter.
