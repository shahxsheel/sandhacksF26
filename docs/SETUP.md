# Development and service setup

## Installed foundation

The application uses Next.js, React, and TypeScript. Official server SDKs are installed for Gemini (`@google/genai`), ElevenLabs (`@elevenlabs/elevenlabs-js`), and Neon (`@neondatabase/serverless`). Zod is available for validating model outputs and request payloads. `server-only` is available to keep provider clients out of browser bundles.

Neon and ElevenLabs CLIs are project-local development dependencies. Vultr's official CLI is installed through Homebrew on this Mac. Playwright and Chromium support future desktop/mobile browser checks. Existing Node, npm, and Docker were reused; no extra coding-agent CLI is needed to call Gemini's API.

Exact npm dependency versions are recorded in `package-lock.json`. Production containers use Node 24; the local Node 26 runtime also satisfies the package requirements.

The Neon CLI pins older transitive versions of `@hono/node-server` and `diff`. Scoped overrides select patched versions in the same major series (2.1.6 and 5.2.2); remove these overrides when upstream updates its pins.

## Local commands

```sh
npm ci
npx playwright install chromium
npm run doctor
npm run dev
```

The local application serves at http://127.0.0.1:3000. It currently contains a foundation page and `/api/health`; the incident workflow is not implemented yet.

```sh
npm run typecheck
npm run build
npm run neon -- --help
npm run elevenlabs -- --help
npm run vultr -- --help
```

Playwright's configuration includes desktop and mobile Chromium projects. Add real workflow tests under `tests/e2e` as the product is implemented, then run `npx playwright test`. No placeholder tests have been added or claimed to pass.

## Credentials and connection state

Installation does not authenticate an account. No paid API request, database creation, server provisioning, or deployment is needed for the checks above.

Copy `.env.example` to `.env.local` and supply credentials through secure entry or a local editor. `.env.local` and other real environment files are ignored by Git and excluded from Docker's build context. Never use `NEXT_PUBLIC_` for any service credential.

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Gemini requests from the server |
| `GEMINI_MODEL` | Optional model override; defaults to `gemini-4-hydrogen` for the Interactions API test |
| `ELEVENLABS_API_KEY` | ElevenLabs transcription and speech requests |
| `DATABASE_URL` | Neon Postgres connection string |
| `NEON_API_KEY` | Optional Neon provisioning credential; CLI browser authentication is another option |
| `VULTR_API_KEY` | Vultr provisioning; keep out of the deployed application |

The `doctor` command reports credential presence without printing values and makes no external service calls. Presence does not establish validity or billing availability. The CLI wrapper loads `.env.local` before `.env`; existing process environment values have priority.

Neon's optional app connector was offered separately. The later CLI setup installed and enabled Neon's Codex plugin with bundled skills and MCP configuration; the existing project's connection is verified independently of the optional app connector. See [Neon setup](NEON.md).

## Vultr deployment foundation

The `Dockerfile` builds a Next.js standalone production image and runs it as the unprivileged `node` user on port 3000. Service secrets are supplied at runtime, not baked into the image. On an appropriately configured Docker host:

```sh
docker build -t sandhacks .
docker run --rm -p 127.0.0.1:3000:3000 --env-file /secure/path/runtime.env sandhacks
```

The runtime environment file should contain only `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, and `DATABASE_URL` as needed. Terminate public HTTPS at a reverse proxy when deploying. Resource creation and a public deployment remain separate work requiring account access and an agreed spending limit. The image build has not been verified unless explicitly recorded below.

## Verification on this Mac (2026-11-15)

- Next.js production build and TypeScript check pass. The generated standalone server returns HTTP 200 for the home page and the expected health payload for `/api/health`.
- All provider SDK imports load, and the Neon, ElevenLabs, and Vultr CLIs run.
- Playwright Chromium and its headless shell are installed. Desktop and mobile review configuration is prepared; product visual reviews have not been performed.
- Credential-free dependency audit reports zero known vulnerabilities after the scoped overrides.
- At initial tooling setup, no service credentials were configured and no live provider request had been verified. See [Gemini setup](GEMINI.md) for the subsequent Interactions API configuration and test status.
- Subsequently, Gemini, ElevenLabs, Vultr, and Neon credentials were supplied or retrieved and saved in the ignored, owner-readable `.env.local` file.
- Subsequent live checks succeeded: Gemini Interactions generation, Neon `SELECT 1`, ElevenLabs read-only subscription access, and Vultr read-only account access. Credentials remain ignored and owner-readable. No ElevenLabs generation/transcription, database migration, or Vultr VM creation has been performed. See the provider setup documents for the current state.
- Docker's CLI is already installed, but its configured Colima daemon is stopped/unavailable. The Docker image has not been built or run.

## Primary installation references

- [Gemini SDK](https://ai.google.dev/gemini-api/docs/libraries)
- [ElevenLabs libraries](https://elevenlabs.io/docs/eleven-api/resources/libraries)
- [Neon driver](https://neon.com/docs/serverless/serverless-driver)
- [Neon CLI](https://github.com/neondatabase/neon-pkgs)
- [Vultr CLI](https://github.com/vultr/vultr-cli)
- [Playwright](https://playwright.dev/docs/intro)
