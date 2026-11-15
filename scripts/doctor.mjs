import { access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { loadLocalEnv } from "./env.mjs";

loadLocalEnv();
let failed = false;
console.log(`Node ${process.versions.node}`);

for (const name of ["next", "@google/genai", "@elevenlabs/elevenlabs-js", "@neondatabase/serverless", "@playwright/test"]) {
  try {
    await import(name);
    console.log(`Installed: ${name}`);
  } catch (error) {
    failed = true;
    console.error(`Cannot load ${name}: ${error.message}`);
  }
}

try {
  const { chromium } = await import("@playwright/test");
  await access(chromium.executablePath());
  console.log("Installed: Playwright Chromium browser");
} catch {
  failed = true;
  console.error("Missing Playwright Chromium. Run: npx playwright install chromium");
}

const vultr = spawnSync("vultr-cli", ["version"], { encoding: "utf8" });
if (vultr.status === 0) {
  console.log("Installed: Vultr CLI");
} else {
  failed = true;
  console.error("Missing or unusable Vultr CLI. See docs/SETUP.md.");
}

console.log("\nCredential presence only; no network calls or paid requests:");
for (const name of ["GEMINI_API_KEY", "ELEVENLABS_API_KEY", "DATABASE_URL", "VULTR_API_KEY"]) {
  const present = Boolean(process.env[name]?.trim());
  console.log(`${name}: ${present ? "present (not verified)" : "not configured"}`);
}
process.exitCode = failed ? 1 : 0;
