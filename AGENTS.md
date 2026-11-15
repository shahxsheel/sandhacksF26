# FirstLink project instructions

Build the complete emergency-response hackathon demonstration described in docs/BUILD_PLAN.md. Follow docs/DESIGN.md for the supplied spruce/cream design system. User authorized autonomous implementation, visual reviews, public Vultr deployment, and a private GitHub repository. Do not ask for routine implementation approval.

## Limits

- Neon stays on the existing free plan/project/branch. No upgrade, extra compute, extra branch, paid feature, background polling, or media blobs in Postgres. Namespace new app tables with `fl_`; never alter unrelated data. Use bounded queries and pooled connections.
- Gemini API total cap USD 20. Vultr total cap USD 100. ElevenLabs user limit is 50k tokens; conservatively cap project provider-metered usage and verify conversion. See docs/BUDGETS.md. Public routes must not expose unbounded paid requests.
- Never print or commit secrets. Real credentials live in ignored `.env.local`; runtime/deployment data belongs in ignored `.deployment/`, `.runtime/`, and `data/`. Delegates do not read these or auth configuration.
- Real 911 calls, emergency agency integration, travel times, medical judgments, structural safety, and real volunteer dispatch are not verified. Use staged data and explicit simulation labels. Assign volunteers only after coordinator approval to a designated staging point.
- Use other-provider delegates with bounded file ownership to conserve primary usage. No child subagents unless explicitly assigned. Do not commit, provision resources, or call paid APIs from delegates unless their task permits it. Parent owns integration, credentials, resource creation, and final commits.
- API contracts in src/lib/types.ts and docs/BUILD_PLAN.md are shared. Do not change them without coordinating through your result. No polling UI; refresh on explicit user action or successful mutations.
- Tests must verify meaningful behavior. Run build/typecheck and targeted end-to-end checks. Do not invent passing browser reviews, deployment, source provenance, or physical hardware tests.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
