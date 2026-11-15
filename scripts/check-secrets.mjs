import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { parseEnv } from "node:util";

const values = [];
for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const [key, value] of Object.entries(parseEnv(readFileSync(file, "utf8")))) {
    if (/KEY|TOKEN|PASSWORD|DATABASE_URL/.test(key) && value.length > 12) values.push(value);
  }
}
const files = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const blocked = [];
for (const file of files) {
  if ((/(^|\/)\.env/.test(file) && file !== ".env.example") || /^(?:\.deployment|\.runtime|data)\//.test(file)) { blocked.push(file); continue; }
  const data = execFileSync("git", ["show", `:${file}`], { maxBuffer: 20 * 1024 * 1024 }).toString("utf8");
  if (values.some(value => data.includes(value)) || /-----BEGIN (?:OPENSSH |RSA |EC |DSA )?PRIVATE KEY-----/.test(data)) blocked.push(file);
}
if (blocked.length) {
  console.error(`Credential scan blocked these paths: ${blocked.join(", ")}`);
  process.exit(1);
}
console.log(`Credential scan passed for ${files.length} staged files. No secret values printed.`);
