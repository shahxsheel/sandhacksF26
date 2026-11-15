import "server-only";

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let cachedSql: NeonQueryFunction<false, false> | undefined;

export function getDatabase(): NeonQueryFunction<false, false> {
  if (cachedSql) {
    return cachedSql;
  }

  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon Postgres connection string to the server environment before calling getDatabase().",
    );
  }

  cachedSql = neon(connectionString);
  return cachedSql;
}
