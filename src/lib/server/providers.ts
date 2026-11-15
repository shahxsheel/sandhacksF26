import "server-only";

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { GoogleGenAI } from "@google/genai";
import { ELEVENLABS, LIMITS, dataDir, geminiModel, narrationVoiceId } from "./config";
import { ApiError } from "./http";
import { BRIEF_JSON_SCHEMA, BRIEF_SYSTEM_INSTRUCTION } from "./brief-logic";

/** Thrown when a provider is not configured; callers release their budget reservation because nothing was sent. */
export class ProviderUnavailable extends Error {}

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function elevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY?.trim());
}

export interface GeminiBriefResult {
  text: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

export type BriefInput = Array<{ type: "text"; text: string } | { type: "image"; data: string; mime_type: "image/jpeg" }>;

/**
 * One bounded Gemini Interactions request: stateless (store:false), JSON-schema output, no retries, no continuation.
 * Provider failures are collapsed into a short ApiError; raw provider messages are never surfaced or logged.
 */
export async function generateBriefJson(input: BriefInput): Promise<GeminiBriefResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new ProviderUnavailable("gemini key missing");
  try {
    const client = new GoogleGenAI({ apiKey });
    const interaction = await client.interactions.create(
      {
        model: geminiModel(),
        input: [{ type: "user_input", content: input }],
        system_instruction: BRIEF_SYSTEM_INSTRUCTION,
        store: false,
        automatic_continuation: false,
        response_format: { type: "text", mime_type: "application/json", schema: BRIEF_JSON_SCHEMA },
        generation_config: { max_output_tokens: 3000, thinking_level: "low" },
      },
      { retries: { strategy: "none" }, timeout_ms: 60_000 },
    );
    const text = interaction.output_text?.trim();
    if (interaction.status !== "completed" || !text) {
      throw new ApiError(502, "The AI brief did not complete. Your last brief is unchanged; try again in a moment.");
    }
    const usage = interaction.usage as { total_input_tokens?: number; total_output_tokens?: number } | undefined;
    return { text, inputTokens: usage?.total_input_tokens ?? null, outputTokens: usage?.total_output_tokens ?? null };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const status = (error as { status?: unknown; statusCode?: unknown } | null)?.status ?? (error as { statusCode?: unknown } | null)?.statusCode;
    console.error(`[firstlink] gemini request failed status=${typeof status === "number" ? status : "-"}`);
    throw new ApiError(502, "The AI brief service did not respond. Your last brief is unchanged; try again in a moment.");
  }
}

function eleven(): ElevenLabsClient {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) throw new ProviderUnavailable("elevenlabs key missing");
  return new ElevenLabsClient({ apiKey, maxRetries: 0, timeoutInSeconds: 40 });
}

/** Transcribe one short validated recording with Scribe. Returns null text when the provider fails (never throws for provider errors). */
export async function transcribeAudio(data: Buffer, mime: string, fileName: string): Promise<string | null> {
  const client = eleven();
  try {
    const result = await client.speechToText.convert(
      { modelId: ELEVENLABS.transcriptionModel, file: new File([new Uint8Array(data)], fileName, { type: mime }), tagAudioEvents: false, diarize: false },
      { maxRetries: 0, timeoutInSeconds: 40 },
    );
    const text = "text" in result && typeof result.text === "string" ? result.text.replace(/\s+/g, " ").trim() : "";
    return text ? text.slice(0, LIMITS.maxReportTextLength) : null;
  } catch (error) {
    const status = (error as { statusCode?: unknown } | null)?.statusCode;
    console.error(`[firstlink] elevenlabs transcription failed status=${typeof status === "number" ? status : "-"}`);
    return null;
  }
}

function ttsDir(): string {
  return path.join(dataDir(), "tts");
}

function ttsKey(text: string): string {
  return createHash("sha256").update(`${ELEVENLABS.speechModel}\n${narrationVoiceId()}\n${ELEVENLABS.outputFormat}\n${text}`).digest("hex");
}

/** Cached narration bytes for this exact text/model/voice, or null. Never calls a provider. */
export async function cachedSpeech(text: string): Promise<Buffer | null> {
  try {
    return await readFile(path.join(ttsDir(), `${ttsKey(text)}.mp3`));
  } catch {
    return null;
  }
}

/** Generate narration for text (<=1500 chars), cache it on disk and return it. One request, no retries. */
export async function synthesizeSpeech(text: string): Promise<Buffer> {
  if (text.length === 0 || text.length > LIMITS.maxSpeechChars) throw new ApiError(400, "The narration text is not valid.");
  const client = eleven();
  let audio: Buffer;
  try {
    const stream = await client.textToSpeech.convert(
      narrationVoiceId(),
      { text, modelId: ELEVENLABS.speechModel, outputFormat: ELEVENLABS.outputFormat },
      { maxRetries: 0, timeoutInSeconds: 40 },
    );
    const chunks: Uint8Array[] = [];
    let total = 0;
    const reader = stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 4 * 1024 * 1024) throw new Error("narration too large");
      chunks.push(value);
    }
    audio = Buffer.concat(chunks);
  } catch (error) {
    const status = (error as { statusCode?: unknown } | null)?.statusCode;
    console.error(`[firstlink] elevenlabs narration failed status=${typeof status === "number" ? status : "-"}`);
    throw new ApiError(502, "Narration is unavailable right now. The written brief is unchanged.");
  }
  if (audio.byteLength === 0) throw new ApiError(502, "Narration is unavailable right now. The written brief is unchanged.");
  try {
    const dir = ttsDir();
    await mkdir(dir, { recursive: true, mode: 0o700 });
    const target = path.join(dir, `${ttsKey(text)}.mp3`);
    const tmp = `${target}.${process.pid}.tmp`;
    await writeFile(tmp, audio, { mode: 0o600 });
    await rename(tmp, target);
  } catch {
    // A cache write failure must not hide the audio we already paid for.
  }
  return audio;
}

/** Delete narration cache files older than maxAgeMs (bounded scan). */
export async function pruneSpeechCache(maxAgeMs: number): Promise<void> {
  try {
    const dir = ttsDir();
    const cutoff = Date.now() - maxAgeMs;
    for (const name of (await readdir(dir)).slice(0, 500)) {
      const file = path.join(dir, name);
      if ((await stat(file)).mtimeMs < cutoff) await rm(file, { force: true });
    }
  } catch {
    // directory may not exist yet
  }
}
