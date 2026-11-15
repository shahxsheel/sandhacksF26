import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { DemoState, ReportRouting, ReportScreening, WitnessReport } from "../types";
import { authorize, type Principal } from "./auth";
import { budgetError, recordUsageDetail, releaseReservation, reserveBudget, takeRateSlot } from "./budget";
import { BriefValidationError, buildBriefPrompt, buildRulesBrief, parseGeminiBrief, speechText } from "./brief-logic";
import { ELEVENLABS, LIMITS, PROVIDERS, RATE_LIMITS, geminiModel } from "./config";
import { ApiError, cleanText } from "./http";
import { MediaToolUnavailable, briefPhoto, geminiPhoto, probeAudio, processPhoto, removeMediaFiles, saveMediaFile } from "./media";
import {
  ProviderUnavailable,
  cachedSpeech,
  elevenLabsConfigured,
  geminiConfigured,
  generateBriefJson,
  generateRoutingJson,
  generateScreeningJson,
  synthesizeSpeech,
  transcribeAudio,
  type BriefInput,
} from "./providers";
import {
  ScreeningValidationError,
  buildRoutingPrompt,
  buildScreeningPrompt,
  parseRouting,
  parseScreening,
  routingCacheKey,
  screeningCacheKey,
  transcriptCacheKey,
  type RoutingVerdict,
  type ScreeningReport,
} from "./screening-logic";
import {
  countReports,
  currentBrief,
  deleteMediaRows,
  incidentFacts,
  insertReport,
  loadBriefContext,
  loadState,
  readProviderCache,
  saveBrief,
  workspaceIncidentFacts,
  writeProviderCache,
} from "./store";

/** State for the viewer the principal is acting as. The owner's coordinator view also carries share tokens. */
export function stateFor(principal: Principal): Promise<DemoState> {
  return loadState(principal.incidentId, principal.role, principal.secret);
}

export const viewSchema = z.enum(["witness", "volunteer"]).optional();

// ---------------------------------------------------------------- reports

function formString(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

function formFile(form: FormData, key: string): File | null {
  const value = form.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

export async function submitReport(request: Request): Promise<{ state: DemoState; report: WitnessReport; routedIncidentId: string | null }> {
  const declared = Number(request.headers.get("content-length") ?? "");
  if (!Number.isFinite(declared) || declared <= 0) throw new ApiError(411, "The upload size is required.");
  if (declared > LIMITS.maxMultipartBytes) throw new ApiError(413, "That upload is too large. Photos and voice notes can each be up to 4 MB.");
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("multipart/form-data")) throw new ApiError(415, "Send the report as a form upload.");
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new ApiError(400, "The report upload could not be read.");
  }

  const incidentId = formString(form, "incidentId");
  const access = formString(form, "access") || undefined;
  const view = viewSchema.safeParse(formString(form, "role") || undefined);
  const principal = await authorize(request, incidentId, {
    access: access && /^[A-Za-z0-9_-]{16,64}$/.test(access) ? access : undefined,
    allow: ["coordinator", "witness"],
    view: view.success && view.data === "witness" ? "witness" : undefined,
  });

  // Dispatch intake: the coordinator submits an unrouted report and Gemini picks the incident. Owner only.
  const autoRoute = formString(form, "route") === "auto";
  if (autoRoute && !(principal.owner && principal.role === "coordinator")) throw new ApiError(403, "Only the coordinator can submit dispatch-intake reports.");

  if (formString(form, "consent") !== "true") throw new ApiError(400, "Please confirm consent before submitting.");
  const name = cleanText(formString(form, "name"));
  const location = cleanText(formString(form, "location"));
  const text = cleanText(formString(form, "text"), true);
  if (name.length < 1 || name.length > LIMITS.maxNameLength) throw new ApiError(400, `Enter your name (up to ${LIMITS.maxNameLength} characters).`);
  if (location.length < 1 || location.length > LIMITS.maxLocationLength) throw new ApiError(400, `Describe where you are or what you see (up to ${LIMITS.maxLocationLength} characters).`);
  if (text.length > LIMITS.maxReportTextLength) throw new ApiError(400, `Keep the report under ${LIMITS.maxReportTextLength} characters.`);

  const photoFile = formFile(form, "photo");
  const audioFile = formFile(form, "audio");
  if (photoFile && photoFile.size > LIMITS.maxPhotoBytes) throw new ApiError(413, "Photos can be up to 4 MB.");
  if (audioFile && audioFile.size > LIMITS.maxAudioBytes) throw new ApiError(413, "Voice notes can be up to 4 MB.");
  if (!text && !photoFile && !audioFile) throw new ApiError(400, "Add a written description, a photo or a voice note.");

  if (!(await takeRateSlot(principal.sessionId, RATE_LIMITS.report))) throw budgetError("rate", "report submissions");
  if (!autoRoute && (await countReports(principal.incidentId)) >= LIMITS.maxReports) {
    throw new ApiError(409, `This incident already has the maximum of ${LIMITS.maxReports} reports.`);
  }

  // Media: validate and re-encode before anything is stored.
  const photoBytes = photoFile ? await processPhoto(Buffer.from(await photoFile.arrayBuffer())) : null;
  let audio: { bytes: Buffer; ext: string; mime: string } | null = null;
  let voiceDropped = false;
  if (audioFile) {
    try {
      const bytes = Buffer.from(await audioFile.arrayBuffer());
      const info = await probeAudio(bytes);
      audio = { bytes, ext: info.ext, mime: info.mime };
    } catch (error) {
      if (!(error instanceof MediaToolUnavailable)) throw error;
      voiceDropped = true; // validation tooling missing: never store or transcribe unvalidated audio
    }
  }
  if (voiceDropped && !text && !photoBytes) throw new ApiError(503, "Voice notes are temporarily unavailable. Please type your report instead.");

  // Transcription only for a validated recording, one attempt, budgeted. Identical audio reuses its cached transcript.
  // Failure never blocks the report.
  let transcript: string | null = null;
  let transcriptionStatus: "completed" | "failed" | "not_requested" = audioFile ? "failed" : "not_requested";
  const audioId: string | null = audio ? randomUUID() : null;
  if (audio && audioId) {
    const key = transcriptCacheKey(ELEVENLABS.transcriptionModel, audio.bytes);
    const cached = await readProviderCache<{ text: string }>(key);
    if (cached?.text) {
      transcript = cached.text.slice(0, LIMITS.maxReportTextLength);
      transcriptionStatus = "completed";
    } else if (elevenLabsConfigured()) {
      const reservation = await reserveBudget({
        provider: PROVIDERS.elevenlabs.provider,
        kind: "transcribe",
        units: PROVIDERS.elevenlabs.transcribeReserve,
        sessionId: principal.sessionId,
        incidentId: principal.incidentId,
        limit: RATE_LIMITS.transcribe,
      });
      if (reservation.ok) {
        try {
          transcript = await transcribeAudio(audio.bytes, audio.mime, `${audioId}.${audio.ext}`);
          if (transcript) {
            transcriptionStatus = "completed";
            await writeProviderCache(key, "transcript", { text: transcript }).catch(() => undefined);
          }
        } catch (error) {
          if (error instanceof ProviderUnavailable) await releaseReservation(reservation.usageId);
        }
      }
    }
  }

  const screened = { location, text, transcript, hasPhoto: Boolean(photoBytes) };
  let screening: ReportScreening;
  let routing: ReportRouting | undefined;
  let targetIncidentId = principal.incidentId;
  if (autoRoute) {
    const routed = await routeReport(principal, screened, photoBytes);
    screening = routed.screening;
    if (routed.incidentId) {
      targetIncidentId = routed.incidentId;
      routing = { reason: routed.routingReason };
    }
  } else {
    screening = await screenReport(principal, screened, photoBytes);
  }

  const reportText = text || transcript || (audioFile ? "Voice note submitted; transcription is unavailable." : "Photo shared without a written description.");
  const photoId: string | null = photoBytes ? randomUUID() : null;
  const written: string[] = [];
  try {
    const photo = photoBytes && photoId ? { id: photoId, fileName: await saveMediaFile(targetIncidentId, photoId, "jpg", photoBytes), bytes: photoBytes.byteLength, mime: "image/jpeg" } : undefined;
    if (photo) written.push(photo.fileName);
    const audioMedia = audio && audioId ? { id: audioId, fileName: await saveMediaFile(targetIncidentId, audioId, audio.ext, audio.bytes), bytes: audio.bytes.byteLength, mime: audio.mime } : undefined;
    if (audioMedia) written.push(audioMedia.fileName);
    const report = await insertReport({
      id: randomUUID(),
      incidentId: targetIncidentId,
      name,
      location,
      text: reportText,
      transcript,
      transcriptionStatus,
      kind: audioMedia ? "voice" : photo ? "photo" : "text",
      screening,
      routing,
      photo,
      audio: audioMedia,
    });
    return { state: await stateFor(principal), report, routedIncidentId: routing ? targetIncidentId : null };
  } catch (error) {
    await removeMediaFiles(targetIncidentId, written).catch(() => undefined);
    await deleteMediaRows(targetIncidentId, [photoId, audioId].filter((v): v is string => Boolean(v))).catch(() => undefined);
    throw error;
  }
}

// ---------------------------------------------------------------- screening

/**
 * One Gemini credibility screen per report, before it is stored. Identical inputs reuse the cached verdict and reserve
 * nothing. Any failure (not configured, budget, rate, provider, invalid output) yields "unscreened": the report is
 * kept and labelled, never silently dropped.
 */
async function screenReport(principal: Principal, report: ScreeningReport, photoBytes: Buffer | null): Promise<ReportScreening> {
  const unscreened = (reason: string): ReportScreening => ({ status: "unscreened", reason });
  try {
    const incident = await incidentFacts(principal.incidentId);
    const photo = photoBytes ? await geminiPhoto(photoBytes) : null;
    const key = screeningCacheKey(geminiModel(), incident, report, photo);
    const cached = await readProviderCache<ReportScreening>(key);
    if (cached && (cached.status === "accepted" || cached.status === "flagged")) return { status: cached.status, reason: cached.reason };
    if (!geminiConfigured()) return unscreened("AI screening is not configured on this server.");

    const reservation = await reserveBudget({
      provider: PROVIDERS.gemini.provider,
      kind: "screen",
      units: PROVIDERS.gemini.screenReserve,
      sessionId: principal.sessionId,
      incidentId: principal.incidentId,
      limit: RATE_LIMITS.screen,
    });
    if (!reservation.ok) return unscreened(reservation.reason === "rate" ? "AI screening limit reached for this workspace." : "AI screening allowance is used up.");

    const input: BriefInput = [{ type: "text", text: buildScreeningPrompt(incident, report) }];
    if (photo) input.push({ type: "text", text: "Photo attached to this report:" }, { type: "image", data: photo.toString("base64"), mime_type: "image/jpeg" });
    let result;
    try {
      result = await generateScreeningJson(input);
    } catch (error) {
      if (error instanceof ProviderUnavailable) await releaseReservation(reservation.usageId);
      return unscreened("AI screening did not respond.");
    }
    await recordUsageDetail(reservation.usageId, { inputTokens: result.inputTokens, outputTokens: result.outputTokens }).catch(() => undefined);
    const verdict = parseScreening(result.text);
    await writeProviderCache(key, "screening", verdict).catch(() => undefined);
    return verdict;
  } catch (error) {
    if (error instanceof ScreeningValidationError) return unscreened("AI screening returned an unusable answer.");
    if (error instanceof ApiError && error.status === 404) throw error;
    return unscreened("AI screening did not respond.");
  }
}

// ---------------------------------------------------------------- dispatch-intake routing

/**
 * One Gemini call that both screens an unrouted intake report and picks which active incident it belongs to. Same
 * budget, rate limit and cache rules as screening. Any failure leaves the report unscreened on the incident it was
 * submitted from, unrouted, so nothing is lost or silently misfiled.
 */
async function routeReport(principal: Principal, report: ScreeningReport, photoBytes: Buffer | null): Promise<{ screening: ReportScreening; incidentId: string | null; routingReason: string }> {
  const unrouted = (reason: string) => ({ screening: { status: "unscreened" as const, reason }, incidentId: null, routingReason: "" });
  const candidates = await workspaceIncidentFacts(principal.incidentId);
  const scenes = candidates.map((c) => c.scene);
  const resolve = (verdict: RoutingVerdict) => ({
    screening: verdict.screening,
    incidentId: verdict.scene ? (candidates.find((c) => c.scene === verdict.scene)?.id ?? null) : null,
    routingReason: verdict.routingReason,
  });
  try {
    const photo = photoBytes ? await geminiPhoto(photoBytes) : null;
    const key = routingCacheKey(geminiModel(), candidates, report, photo);
    const cached = await readProviderCache<RoutingVerdict>(key);
    if (cached?.screening && (cached.scene === null || scenes.includes(cached.scene))) return resolve(cached);
    if (!geminiConfigured()) return unrouted("AI screening is not configured on this server; the report was not routed.");

    const reservation = await reserveBudget({
      provider: PROVIDERS.gemini.provider,
      kind: "route",
      units: PROVIDERS.gemini.screenReserve,
      sessionId: principal.sessionId,
      incidentId: principal.incidentId,
      limit: RATE_LIMITS.screen,
    });
    if (!reservation.ok) return unrouted(reservation.reason === "rate" ? "AI screening limit reached for this workspace." : "AI screening allowance is used up.");

    const input: BriefInput = [{ type: "text", text: buildRoutingPrompt(candidates, report) }];
    if (photo) input.push({ type: "text", text: "Photo attached to this report:" }, { type: "image", data: photo.toString("base64"), mime_type: "image/jpeg" });
    let result;
    try {
      result = await generateRoutingJson(input, scenes);
    } catch (error) {
      if (error instanceof ProviderUnavailable) await releaseReservation(reservation.usageId);
      return unrouted("AI routing did not respond; the report was not routed.");
    }
    await recordUsageDetail(reservation.usageId, { inputTokens: result.inputTokens, outputTokens: result.outputTokens }).catch(() => undefined);
    const verdict = parseRouting(result.text, scenes);
    await writeProviderCache(key, "screening", verdict).catch(() => undefined);
    return resolve(verdict);
  } catch (error) {
    if (error instanceof ScreeningValidationError) return unrouted("AI routing returned an unusable answer; the report was not routed.");
    if (error instanceof ApiError && error.status === 404) throw error;
    return unrouted("AI routing did not respond; the report was not routed.");
  }
}

// ---------------------------------------------------------------- brief

const briefInFlight = new Set<string>();

export async function generateBrief(principal: Principal, mode: "gemini" | "rules"): Promise<DemoState> {
  const { incidentId } = principal;
  if (briefInFlight.has(incidentId)) throw new ApiError(409, "A brief is already being prepared. Wait for it to finish.");
  briefInFlight.add(incidentId);
  try {
    const context = await loadBriefContext(incidentId);
    if (mode === "rules") {
      await saveBrief(incidentId, buildRulesBrief(context.reports), "rules");
      return stateFor(principal);
    }
    if (context.reports.length === 0) throw new ApiError(400, "Add at least one report before generating a brief.");
    if (!geminiConfigured()) throw new ApiError(503, "The AI brief is not configured on this server. The sample brief and typed reports still work.");

    const reservation = await reserveBudget({
      provider: PROVIDERS.gemini.provider,
      kind: "brief",
      units: PROVIDERS.gemini.briefReserve,
      sessionId: principal.sessionId,
      incidentId,
      limit: RATE_LIMITS.brief,
    });
    if (!reservation.ok) throw budgetError(reservation.reason, "the AI brief");

    const photos: { reportId: string; data: string }[] = [];
    for (const photo of context.photos) {
      try {
        photos.push({ reportId: photo.reportId, data: await briefPhoto(incidentId, photo.fileName) });
      } catch {
        // A missing or unreadable photo is skipped; the text reports still produce a brief.
      }
    }
    const prompt = buildBriefPrompt({ incident: context.incident, reports: context.reports, notes: context.notes, photoReportIds: photos.map((p) => p.reportId) });
    const input: BriefInput = [{ type: "text", text: prompt }];
    for (const photo of photos) {
      const label = context.reports.find((r) => r.id === photo.reportId)?.sourceLabel ?? "";
      input.push({ type: "text", text: `Photo attached to report id ${photo.reportId} (${label}):` }, { type: "image", data: photo.data, mime_type: "image/jpeg" });
    }

    let result;
    try {
      result = await generateBriefJson(input);
    } catch (error) {
      if (error instanceof ProviderUnavailable) await releaseReservation(reservation.usageId);
      throw error instanceof ProviderUnavailable ? new ApiError(503, "The AI brief is not configured on this server. The sample brief and typed reports still work.") : error;
    }
    await recordUsageDetail(reservation.usageId, { inputTokens: result.inputTokens, outputTokens: result.outputTokens }).catch(() => undefined);

    let core;
    try {
      core = parseGeminiBrief(result.text, new Set(context.reports.map((r) => r.id)));
    } catch (error) {
      if (error instanceof BriefValidationError) {
        throw new ApiError(502, "The AI brief could not be verified against the source reports, so it was not used. Your last brief is unchanged.");
      }
      throw error;
    }
    await saveBrief(incidentId, core, "gemini");
    return stateFor(principal);
  } finally {
    briefInFlight.delete(incidentId);
  }
}

// ---------------------------------------------------------------- narration

export async function narrateBrief(principal: Principal): Promise<Buffer> {
  const brief = await currentBrief(principal.incidentId);
  if (!brief) throw new ApiError(404, "Workspace not found.");
  const text = speechText(brief.core, LIMITS.maxSpeechChars);
  const cached = await cachedSpeech(text);
  if (cached) return cached;
  if (!elevenLabsConfigured()) throw new ApiError(503, "Narration is not configured on this server. The written brief is unchanged.");
  const reservation = await reserveBudget({
    provider: PROVIDERS.elevenlabs.provider,
    kind: "speech",
    units: PROVIDERS.elevenlabs.speechReserve,
    sessionId: principal.sessionId,
    incidentId: principal.incidentId,
    limit: RATE_LIMITS.speech,
  });
  if (!reservation.ok) throw budgetError(reservation.reason, "narration");
  try {
    return await synthesizeSpeech(text);
  } catch (error) {
    if (error instanceof ProviderUnavailable) {
      await releaseReservation(reservation.usageId);
      throw new ApiError(503, "Narration is not configured on this server. The written brief is unchanged.");
    }
    throw error;
  }
}
