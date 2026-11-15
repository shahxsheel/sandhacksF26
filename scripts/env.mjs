import { existsSync } from "node:fs";

// Existing process variables take priority; local settings precede shared settings.
export function loadLocalEnv() {
  for (const name of [".env.local", ".env"]) {
    if (existsSync(name)) process.loadEnvFile(name);
  }
}
