import "server-only";

import path from "node:path";

/** Private runtime volume for uploaded media and the narration cache. Never served directly. */
export function dataDir(): string {
  return path.resolve(/* turbopackIgnore: true */ process.env.DATA_DIR?.trim() || ".runtime");
}

export const LIMITS = {
  sessionTtlDays: 7,
  maxWorkspacesPerDay: 300,
  maxActiveWorkspaces: 1000,
  maxReports: 8,
  maxNotes: 20,
  maxAssignments: 20,
  maxNameLength: 80,
  maxLocationLength: 120,
  maxReportTextLength: 1200,
  maxNoteLength: 500,
  maxTaskLength: 200,
  maxPhotoBytes: 4 * 1024 * 1024,
  maxAudioBytes: 4 * 1024 * 1024,
  maxAudioSeconds: 45,
  /** Multipart body ceiling: photo + audio + form fields. */
  maxMultipartBytes: 9 * 1024 * 1024,
  maxJsonBytes: 16 * 1024,
  maxEventsReturned: 80,
  briefPhotoCount: 3,
  briefPhotoMaxEdge: 1024,
  storedPhotoMaxEdge: 1600,
  maxSpeechChars: 1500,
} as const;

/** Reservations are conservative upper bounds; actual provider cost is expected to be far lower. */
export const PROVIDERS = {
  gemini: {
    provider: "gemini",
    briefReserve: 200_000, // micro-USD per request (USD 0.20)
    hardCap: 16_000_000, // never allow the shared cap row above USD 16 of the USD 20 limit
  },
  elevenlabs: {
    provider: "elevenlabs",
    transcribeReserve: 5000,
    speechReserve: 3000,
    hardCap: 42_000, // never above 42k of the 50k ceiling
  },
} as const;

export const RATE_LIMITS = {
  /** [bucket, max requests, window seconds] per workspace session. */
  brief: ["gemini:brief", 6, 3600],
  transcribe: ["elevenlabs:stt", 4, 86_400],
  speech: ["elevenlabs:tts", 6, 3600],
  report: ["report:submit", 20, 3600],
} as const satisfies Record<string, readonly [string, number, number]>;

export const ELEVENLABS = {
  transcriptionModel: "scribe_v3",
  speechModel: "eleven_flash_v2_5",
  outputFormat: "mp3_44100_64",
  defaultVoiceId: "JBFqnCBsd6RMkjVDRZzb",
} as const;

export function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-4-hydrogen";
}

export function narrationVoiceId(): string {
  return process.env.ELEVENLABS_VOICE_ID?.trim() || ELEVENLABS.defaultVoiceId;
}
