# User-authorized project limits

Recorded 2026-11-15 from the user's reply to the hosting-budget request.

- **Gemini API: USD 20 total.** Use short development requests and record actual provider usage as integrations are built. The setup test made two short requests before this limit was supplied.
- **Vultr: USD 100 total.** This is a maximum, not a target. Choose a small single-server plan when the application is ready to deploy; verify current pricing, billing readiness, and the expected lifetime before creating it. Track recurring charges and separately billable resources.
- **Neon: existing free plan only.** The user explicitly confirmed the free plan and requested particular care. No paid upgrade, paid feature, extra compute, or additional branch is authorized. Reuse the linked project and existing branch. Use pooled connections, small bounded queries, and infrequent necessary reads; avoid background polling, unnecessary connection checks, and storing uploaded media in Postgres. Check current free-plan limits and usage before substantial database work. If a limit blocks the application, report it rather than enabling billing or upgrading.
- **ElevenLabs: 50,000 tokens, as stated by the user.** A read-only subscription check succeeded: the API reports `character_count`/`character_limit`, not an LLM-token budget; usage-based extensions are disabled. Do not assume a token equals a credit. The app stops at 40,000 conservative reserved units (5,000 per voice transcription, 3,000 per narration), with short audio/text limits and cached narration. Live transcription and narration have now succeeded locally and on the public deployment. Reservations are deliberately larger than these short requests and are not actual billed usage.

These are recorded operating limits, not provider-side hard caps or verified account balances. Do not raise limits or upgrade plans without user authorization. No Neon billing change or paid upgrade was authorized; connect the existing project and verify that it works as currently configured.

## Delegation preference

The user asked for work to be distributed across providers to conserve primary-agent usage. Claude Haiku 5.5 prepared the lazy database client; an Antigravity delegate configured for Gemini 3.8 Flash prepared the Vultr checklist. Both tasks completed. Continue with bounded assignments to available providers; keep credential handling in the primary session and do not send secrets in delegate briefs. These tasks used the existing provider connections, not the app's Gemini API key.
