import { neon } from "@neondatabase/serverless";
import { loadLocalEnv } from "./env.mjs";

loadLocalEnv();
const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error("DATABASE_URL is missing. Link the existing Neon project before checking the connection.");
  process.exit(1);
}

try {
  const sql = neon(connectionString);
  const rows = await sql`SELECT 1 AS ok`;
  if (rows[0]?.ok !== 1) throw new Error("Unexpected database test response.");
  console.log(JSON.stringify({ connected: true, readOnlyCheck: "SELECT 1" }));
} catch (error) {
  // Do not print driver errors: they may include connection credentials.
  console.error(JSON.stringify({ connected: false, code: error?.code ?? null, message: "Database check failed. Verify the Neon project status and local connection configuration." }));
  process.exitCode = 1;
}
