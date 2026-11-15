<img src="assets/icon.svg" width="64" height="64" alt="">

# FirstLink

**The first minutes, connected.**

FirstLink is a hackathon demonstration for a **staged campus incident**: witnesses share what they actually saw (text, photo, or short voice note), coordinators get **one evolving brief** with every claim tied to a source, and **registered demo volunteers** can accept human-approved support tasks at a **designated staging point**—never self-dispatch into the scene.

This is **not** a live 911 feed, emergency dispatch system, or safety authority. Professional response, travel times, medical triage, structural safety, and physical volunteer movement are **simulated** for the story.

## Three roles, one incident

| Role | Where | What they do |
| --- | --- | --- |
| **Witness** | `/report/...` (shared link) | Submit observations with consent; optional photo or ≤45s voice note; stay in safe positions. |
| **Coordinator** | `/dashboard` | Review evidence, refresh the shared brief, add corrections, approve volunteers, share links. |
| **Volunteer** | `/volunteer/...` (shared link) | See only an approved assignment; **Accept** or **Decline** at the staging point—after coordinator approval. |

Opening **Open demo** on the landing page creates an isolated workspace (one incident per browser session). **Simulation** and **Staged incident** labels stay visible in the product.

## What sponsors power

| Service | Role in this demo |
| --- | --- |
| **Neon** | Persists incidents, witness reports, brief revisions, notes, and assignments on the **existing free plan**—small bounded queries only; uploads are **not** stored in Postgres. |
| **Vultr** | Hosts the Next.js app and on-disk media/cache behind HTTPS on Vultr. |
| **Google Gemini** | On explicit coordinator action, synthesizes a **source-linked** brief (claims reference witness report IDs; disputed and unknown items stay visible). |
| **ElevenLabs** | Optional: transcribes submitted voice notes and can narrate the current brief; typed reports work without it. |

Operating limits (authorized caps, not targets): Gemini **$20** total API spend for this project, Vultr **$100** total infrastructure budget, ElevenLabs **~50k** metered units conservatively reserved in-app. Details: [docs/BUDGETS.md](docs/BUDGETS.md).

## Verification status (2026-11-15)

| Check | Status |
| --- | --- |
| Backend integration (`npm run test:backend`) | **23 passed** |
| Playwright E2E desktop + mobile (`npm run test:e2e`) | **26 passed** |
| Live Gemini brief with valid source report IDs | **Verified** in integration testing |
| Live voice upload → transcription → media playback | **Verified locally and on the public deployment** |
| Public app at `https://firstlink.144.202.126.31.sslip.io` | **Live over HTTPS**—public report/approval/acceptance and provider checks passed; final review release pending ([docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)) |

Full evidence and limits: [docs/VALIDATION.md](docs/VALIDATION.md).

## Run locally

```sh
npm ci
# Install ffmpeg for voice validation (e.g. brew install ffmpeg)
npx playwright install chromium   # first time only, for E2E
cp .env.example .env.local        # add DATABASE_URL and provider keys locally; never commit
npm run db:init                   # once per database: isolated app tables + budget rows
npm run doctor                    # local readiness; no external paid calls
npm run dev                       # http://127.0.0.1:3000
```

## Test and build

```sh
npm run typecheck
npm run build
npm run test:backend              # route handlers + schema (mocked providers)
npm run test:e2e                  # coordinator, witness, volunteer flows
```

Backend notes: [docs/BACKEND.md](docs/BACKEND.md). Full API and product contract: [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md).

## Deployment

Provision and release steps are documented in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Secrets and runtime state stay out of Git (`.env.local`, `.deployment/`, `.runtime/`, `data/`).

## Repository

Private source: **https://github.com/shahxsheel/sandhacks** (checkpointed on `main`).

## Docs map

- **Judge demo script:** [docs/DEMO.md](docs/DEMO.md)
- Design system: [docs/DESIGN.md](docs/DESIGN.md)
- Dev setup (CLIs, credentials shape): [docs/SETUP.md](docs/SETUP.md)
- Product origin: [IDEA.md](IDEA.md)
