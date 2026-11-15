# Existing Neon project setup

Project: `blue-unit-74013355` (console name `my-first-project`). Organization: `org-quiet-mud-96476302`. Linked branch: `production`.

## Free-plan constraint

The user confirmed Neon is on the free plan. Keep it there. No paid upgrade, extra branch/compute, or paid feature is authorized. Reuse this project and branch; avoid unnecessary polling and repeated connectivity checks. Use pooled connections and bounded queries, and keep uploaded photos/audio outside Postgres. Check current usage and free-plan limits before substantial database work; surface a limit rather than enabling billing. See [project budgets](BUDGETS.md).

Following [Neon's setup prompt](https://neon.com/get-started/prompt.md), the existing project was linked with:

```sh
npm run neon -- init -y --agent codex --org-id org-quiet-mud-96476302 --project-id blue-unit-74013355
```

The CLI installed and enabled Neon's Codex plugin (3.0.8), wrote local project context, created `neon.ts`, and populated `.env.local` with `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and branch metadata. The plugin includes Neon agent skills and the HTTP MCP server at `https://mcp.neon.tech/mcp`. Connection strings and passwords are intentionally omitted from this document. The application uses the pooled `DATABASE_URL`; keep the unpooled URL for tooling that needs a direct connection.

The lazy, server-only SQL client is exported as `getDatabase()` from `src/lib/server/db.ts`. Credentials are read when it is first called, so production builds do not require a live connection.

Verify connectivity with the read-only check:

```sh
npm run db:check
```

**Verified:** `npm run db:check` succeeded against the linked project with `SELECT 1`. The explicit `npm run db:init` then initialized the app's namespaced `fl_` schema and persistent budget rows on this same branch. Local and public role workflows persist reports, briefs, notes, and assignments. No `neon deploy`, billing change, extra branch/compute, or paid upgrade was run. Restart or refresh the agent session to load newly installed Neon tools.

[Open the linked project](https://console.neon.tech/app/projects/blue-unit-74013355/).
