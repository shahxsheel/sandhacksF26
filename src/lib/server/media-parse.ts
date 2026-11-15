// Pure parsing helpers for ffprobe output. No server-only import so they stay unit-testable.

export interface AudioContainer {
  ext: "webm" | "ogg" | "m4a" | "mp3" | "wav" | "aac";
  mime: string;
}

/** Map ffprobe's format_name (e.g. "matroska,webm", "mov,mp4,m4a,3gp,3g2,mj2") to a canonical, server-chosen type. */
export function containerFor(formatName: string): AudioContainer | null {
  const names = formatName.toLowerCase().split(",");
  const has = (...n: string[]) => n.some((x) => names.includes(x));
  if (has("matroska", "webm")) return { ext: "webm", mime: "audio/webm" };
  if (has("ogg")) return { ext: "ogg", mime: "audio/ogg" };
  if (has("mov", "mp4", "m4a")) return { ext: "m4a", mime: "audio/mp4" };
  if (has("mp3")) return { ext: "mp3", mime: "audio/mpeg" };
  if (has("wav")) return { ext: "wav", mime: "audio/wav" };
  if (has("aac")) return { ext: "aac", mime: "audio/aac" };
  return null;
}

/**
 * Duration from the packets actually present (header durations can be absent, as with browser MediaRecorder
 * WebM, or forged). Input is `pts_time,duration_time` CSV, one packet per line. Returns null if nothing parses.
 */
export function durationFromPackets(csv: string): number | null {
  let end = 0;
  let seen = 0;
  for (const line of csv.split("\n")) {
    if (!line.trim()) continue;
    const [ptsRaw, durRaw] = line.split(",");
    const pts = Number(ptsRaw);
    if (!Number.isFinite(pts)) continue;
    const dur = Number(durRaw);
    seen += 1;
    end = Math.max(end, pts + (Number.isFinite(dur) && dur > 0 ? dur : 0));
  }
  return seen > 0 ? end : null;
}
