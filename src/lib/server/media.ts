import "server-only";

import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { LIMITS, dataDir } from "./config";
import { ApiError } from "./http";
import { containerFor, durationFromPackets, type AudioContainer } from "./media-parse";

const run = promisify(execFile);
const FILE_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|webm|ogg|m4a|mp3|wav|aac)$/;

export class MediaToolUnavailable extends Error {}

function incidentDir(incidentId: string): string {
  return path.join(dataDir(), "media", incidentId);
}

/** Re-encode to a bounded JPEG: validates content, applies EXIF rotation, strips metadata, never serves the original bytes. */
export async function processPhoto(input: Buffer): Promise<Buffer> {
  try {
    const image = sharp(input, { limitInputPixels: 50_000_000, failOn: "error" });
    const meta = await image.metadata();
    if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format) || (meta.pages ?? 1) > 1) {
      throw new ApiError(415, "Photos must be a single JPEG, PNG or WebP image.");
    }
    return await image
      .rotate()
      .resize({ width: LIMITS.storedPhotoMaxEdge, height: LIMITS.storedPhotoMaxEdge, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(415, "That photo could not be read. Use a JPEG, PNG or WebP image under 4 MB.");
  }
}

export interface AudioInfo extends AudioContainer {
  seconds: number;
}

/** Validate an uploaded recording with ffprobe: real audio container, no video, and measured (not header-claimed) duration. */
export async function probeAudio(input: Buffer): Promise<AudioInfo> {
  const tmpDir = path.join(dataDir(), "tmp");
  await mkdir(tmpDir, { recursive: true });
  const file = path.join(tmpDir, `${randomUUID()}.bin`);
  await writeFile(file, input, { mode: 0o600 });
  try {
    const base = ["-v", "error", "-protocol_whitelist", "file"];
    let formatOut: string;
    let packetOut: string;
    try {
      formatOut = (await run("ffprobe", [...base, "-show_entries", "format=format_name:stream=codec_type", "-of", "json", file], { timeout: 10_000, maxBuffer: 1 << 20 })).stdout;
      packetOut = (await run("ffprobe", [...base, "-select_streams", "a:0", "-show_entries", "packet=pts_time,duration_time", "-of", "csv=p=0", file], { timeout: 15_000, maxBuffer: 16 << 20 })).stdout;
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === "ENOENT") throw new MediaToolUnavailable("ffprobe is not installed");
      throw new ApiError(400, "That recording could not be read as audio.");
    }
    let parsed: { format?: { format_name?: string }; streams?: { codec_type?: string }[] };
    try {
      parsed = JSON.parse(formatOut);
    } catch {
      throw new ApiError(400, "That recording could not be read as audio.");
    }
    const types = (parsed.streams ?? []).map((s) => s.codec_type);
    const container = containerFor(parsed.format?.format_name ?? "");
    if (!container || !types.includes("audio") || types.includes("video")) {
      throw new ApiError(415, "Voice notes must be an audio recording (WebM, Ogg, MP4/M4A, MP3, WAV or AAC).");
    }
    const seconds = durationFromPackets(packetOut);
    if (seconds === null || seconds < 0.2) throw new ApiError(400, "That recording is empty or too short.");
    if (seconds > LIMITS.maxAudioSeconds) throw new ApiError(400, `Voice notes can be at most ${LIMITS.maxAudioSeconds} seconds.`);
    return { ...container, seconds };
  } finally {
    await rm(file, { force: true });
  }
}

/** Atomically write a media file under the incident's private directory. Returns the server-generated file name. */
export async function saveMediaFile(incidentId: string, mediaId: string, ext: string, data: Buffer): Promise<string> {
  const fileName = `${mediaId}.${ext}`;
  if (!FILE_NAME.test(fileName)) throw new Error("invalid media file name");
  const dir = incidentDir(incidentId);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const tmp = path.join(dir, `.${randomUUID()}.tmp`);
  await writeFile(tmp, data, { mode: 0o600 });
  await rename(tmp, path.join(dir, fileName));
  return fileName;
}

/** Resolve a stored media row to a path. File names come from the database but are re-validated here. */
export function mediaPath(incidentId: string, fileName: string): string {
  if (!FILE_NAME.test(fileName)) throw new ApiError(404, "Media not found.");
  return path.join(incidentDir(incidentId), fileName);
}

export async function removeMediaFiles(incidentId: string, fileNames: string[]): Promise<void> {
  await Promise.all(fileNames.filter((n) => FILE_NAME.test(n)).map((n) => rm(path.join(incidentDir(incidentId), n), { force: true })));
}

export async function removeIncidentMedia(incidentId: string): Promise<void> {
  await rm(incidentDir(incidentId), { recursive: true, force: true });
}

/** Smaller copies for Gemini input: bounded edge, base64 JPEG. */
export async function briefPhoto(incidentId: string, fileName: string): Promise<string> {
  const original = await readFile(mediaPath(incidentId, fileName));
  const resized = await sharp(original, { limitInputPixels: 50_000_000 })
    .resize({ width: LIMITS.briefPhotoMaxEdge, height: LIMITS.briefPhotoMaxEdge, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 72 })
    .toBuffer();
  return resized.toString("base64");
}
