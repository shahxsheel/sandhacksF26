import { spawn } from "node:child_process";
import { join } from "node:path";
import { loadLocalEnv } from "./env.mjs";

loadLocalEnv();
const [provider, ...args] = process.argv.slice(2);
const commands = {
  neon: join(process.cwd(), "node_modules", ".bin", "neon"),
  elevenlabs: join(process.cwd(), "node_modules", ".bin", "elevenlabs"),
  vultr: "vultr-cli",
};

if (!Object.hasOwn(commands, provider)) {
  console.error("Choose neon, elevenlabs, or vultr.");
  process.exit(1);
}

const child = spawn(commands[provider], args, { stdio: "inherit", env: process.env });
child.on("error", (error) => {
  console.error(`Unable to start ${provider}: ${error.message}`);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = signal ? 1 : (code ?? 1);
});
