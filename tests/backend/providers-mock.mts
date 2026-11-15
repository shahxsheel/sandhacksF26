export class ProviderUnavailable extends Error {}
export const calls = { gemini: 0, screen: 0, stt: 0, tts: 0, lastGeminiInput: null as unknown, lastScreenInput: null as unknown };
export const mock = {
  geminiKey: true,
  elevenKey: true,
  geminiResponder: null as null | ((input: any) => string),
  screenResponder: ((_input: any) => JSON.stringify({ decision: "include", reason: "First-hand observation consistent with the incident." })) as (input: any) => string,
  sttText: "I see smoke at the east door." as string | null,
};
export const geminiConfigured = () => mock.geminiKey;
export const elevenLabsConfigured = () => mock.elevenKey;
export async function generateBriefJson(input: any) {
  calls.gemini++; calls.lastGeminiInput = input;
  const text = mock.geminiResponder!(input);
  return { text, inputTokens: 100, outputTokens: 50 };
}
export async function generateScreeningJson(input: any) {
  calls.screen++; calls.lastScreenInput = input;
  const text = mock.screenResponder(input);
  return { text, inputTokens: 80, outputTokens: 20 };
}
export async function transcribeAudio() { calls.stt++; return mock.sttText; }
const cache = new Map<string, Buffer>();
export async function cachedSpeech(t: string) { return cache.get(t) ?? null; }
export async function synthesizeSpeech(t: string) { calls.tts++; const b = Buffer.from("ID3fake"); cache.set(t, b); return b; }
export async function pruneSpeechCache() {}
export type BriefInput = any;
