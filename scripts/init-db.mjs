// Explicit one-time schema setup for the FirstLink fl_ tables. Never run at request time.
// Usage: npm run db:init   (or: node scripts/init-db.mjs)
// Idempotent: every statement is IF NOT EXISTS / ON CONFLICT DO NOTHING. Touches only fl_ objects.
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { loadLocalEnv } from "./env.mjs";

loadLocalEnv();
const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error("DATABASE_URL is missing. Link the existing Neon project before initializing the schema.");
  process.exit(1);
}

// Local app guards, not account-wide caps. See docs/BUDGETS.md.
// Gemini: micro-USD (USD 14 of the USD 20 limit; each brief reserves USD 0.20).
// ElevenLabs: conservative credit units, kept below the user's 50,000 ceiling.
const budgets = [
  ["gemini", "micro_usd", positive(process.env.GEMINI_BUDGET_MICRO_USD, 14_000_000)],
  ["elevenlabs", "credits", positive(process.env.ELEVENLABS_BUDGET_UNITS, 40_000)],
];

function positive(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function statements(text) {
  return text
    .split(/;\s*(?:\r?\n|$)/)
    .map((block) =>
      block
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter(Boolean);
}

try {
  const sql = neon(connectionString);
  const schema = statements(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
  // One non-interactive transaction, one HTTP round trip.
  await sql.transaction([
    ...schema.map((statement) => sql.query(statement)),
    ...budgets.map(
      ([provider, unit, cap]) =>
        sql.query("INSERT INTO fl_budgets (provider, unit, cap) VALUES ($1, $2, $3) ON CONFLICT (provider) DO NOTHING", [provider, unit, cap]),
    ),
  ]);
  console.log(JSON.stringify({ initialized: true, statements: schema.length, budgets: budgets.map(([provider, unit, cap]) => ({ provider, unit, cap })) }));
} catch (error) {
  // Driver errors can embed connection details; print only a code.
  console.error(JSON.stringify({ initialized: false, code: error?.code ?? null, message: "Schema initialization failed. Verify the Neon project status and DATABASE_URL." }));
  process.exitCode = 1;
}
