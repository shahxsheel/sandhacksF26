import { GoogleGenAI } from "@google/genai";
import { loadLocalEnv } from "./env.mjs";

loadLocalEnv();

const apiKey = process.env.GEMINI_API_KEY?.trim();
const model = process.env.GEMINI_MODEL?.trim() || "gemini-4-hydrogen";

if (!apiKey) {
  console.error("GEMINI_API_KEY is missing. Create a key at https://aistudio.google.com/apikey and configure it securely in .env.local.");
  process.exit(1);
}

try {
  const client = new GoogleGenAI({ apiKey });
  // Make a single request: do not retry or automatically continue the interaction.
  const interaction = await client.interactions.create(
    {
      model,
      input: "Explain how AI works in a few words.",
      store: false,
      automatic_continuation: false,
      generation_config: { max_output_tokens: 2048, thinking_level: "low" },
    },
    { retries: { strategy: "none" }, timeout_ms: 60_000 },
  );

  const reply = interaction.output_text?.trim();
  if (interaction.status !== "completed" || !reply) {
    throw new Error(`Interaction returned ${interaction.status ?? "an unknown status"} without a complete text reply.`);
  }
  console.log(JSON.stringify({ model: interaction.model ?? model, status: interaction.status, reply }, null, 2));
} catch (error) {
  // Provider errors can contain request details; redact the key and omit the stack.
  const message = String(error?.message ?? "Request failed").replaceAll(apiKey, "[REDACTED]");
  console.error(JSON.stringify({ model, status: "error", statusCode: error?.status ?? error?.statusCode ?? null, message }, null, 2));
  process.exitCode = 1;
}
