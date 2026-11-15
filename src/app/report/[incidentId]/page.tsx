"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "../../../components/Navbar";
import { AudioRecorder } from "../../../components/AudioRecorder";
import { SessionLoadPanel } from "../../../components/SessionLoadPanel";
import { submitReport, fetchSession, ApiError } from "../../../components/api";
import { isIncidentUuid } from "../../../components/share-links";
import { Camera, CheckCircle2, AlertTriangle, ArrowRight, Upload, X, MapPin, User, FileText, ChevronLeft } from "lucide-react";

interface ReportPageProps {
  params: Promise<{ incidentId: string }>;
}

export default function WitnessReportPage({ params }: ReportPageProps) {
  const { incidentId } = use(params);
  const searchParams = useSearchParams();
  const access = searchParams?.get("access") || undefined;

  const [step, setStep] = useState<"disclaimer" | "form">("disclaimer");
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [step]);

  // Form State
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [text, setText] = useState("");
  const [consent, setConsent] = useState(false);

  // Media
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>("recording.webm");
  const photoInputRef = React.useRef<HTMLInputElement | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedReport, setSubmittedReport] = useState<{ id?: string; sourceLabel?: string } | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);

  const verifyAccess = useCallback(async () => {
    setAccessLoading(true);
    setAccessDenied(null);

    if (!isIncidentUuid(incidentId)) {
      setAccessDenied("This incident link is not valid. Ask the coordinator for a current witness link.");
      setAccessLoading(false);
      return;
    }

    try {
      await fetchSession(incidentId, access, "witness");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setAccessDenied(err.message);
      } else {
        setAccessDenied("Could not open this witness form. Check the link or try again.");
      }
    } finally {
      setAccessLoading(false);
    }
  }, [incidentId, access]);

  useEffect(() => {
    void verifyAccess();
  }, [verifyAccess]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg("Photo file exceeds the 4 MB limit.");
      return;
    }

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setErrorMsg(null);
  };

  const removePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleAudioReady = (blob: Blob | null, fileName?: string) => {
    setAudioBlob(blob);
    if (fileName) setAudioFileName(fileName);
  };

  const hasObservation = Boolean(text.trim() || photoFile || audioBlob);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !hasObservation) {
      setErrorMsg("Enter your safe location and a short description, photo, or voice note before submitting.");
      return;
    }
    if (!consent) {
      setErrorMsg("Confirm the safety consent checkbox before submitting.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("incidentId", incidentId);
    if (access) formData.append("access", access);
    formData.append("name", name.trim() || "Anonymous Bystander");
    formData.append("location", location.trim());
    formData.append("text", text.trim());
    formData.append("consent", "true");
    if (!access) {
      formData.append("role", "witness");
    }

    if (photoFile) {
      formData.append("photo", photoFile, photoFile.name);
    }

    if (audioBlob) {
      formData.append("audio", audioBlob, audioFileName);
    }

    try {
      const result = await submitReport(formData);
      if (!result.report?.id || !result.report?.sourceLabel) {
        setErrorMsg("The server did not confirm your report. Try again.");
        return;
      }
      setSubmittedReport({
        id: result.report.id,
        sourceLabel: result.report.sourceLabel,
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Report submission failed. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep("disclaimer");
    setName("");
    setLocation("");
    setText("");
    setConsent(false);
    removePhoto();
    setAudioBlob(null);
    setSubmittedReport(null);
    setErrorMsg(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
      <Navbar ownerIncidentId={access ? undefined : incidentId} />

      <main className="witness-page" style={{ flex: 1, padding: "32px 16px 64px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          {accessLoading ? (
            <div style={{ textAlign: "center", padding: "64px 16px" }}>
              <span className="pulse-dot" style={{ width: "14px", height: "14px", margin: "0 auto 12px", display: "block" }} />
              <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>Checking witness access…</p>
            </div>
          ) : accessDenied ? (
            <SessionLoadPanel
              title="Cannot open witness form"
              message={accessDenied}
              onRetry={verifyAccess}
              isRetrying={accessLoading}
            />
          ) : (
            <>
          {!submittedReport && (
            <ol aria-label="Report progress" style={{ display: "flex", gap: "24px", listStyle: "none", padding: 0, margin: "0 0 20px", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              <li aria-current={step === "disclaimer" ? "step" : undefined} style={{ color: step === "disclaimer" ? "var(--spruce-main)" : undefined }}>1. Safety & consent</li>
              <li aria-current={step === "form" ? "step" : undefined} style={{ color: step === "form" ? "var(--spruce-main)" : undefined }}>2. Your observation</li>
            </ol>
          )}

          {/* Submission Success State */}
          {submittedReport ? (
            <div
              className="card-light fl-card-pad"
              style={{
                background: "#ffffff",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "var(--pale-green)",
                  color: "var(--pale-green-text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 18px",
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <span className="badge badge-green" style={{ marginBottom: "12px" }}>
                Report {submittedReport.sourceLabel} Received
              </span>

              <h2 style={{ fontSize: "1.65rem", color: "var(--spruce-main)", fontWeight: 600, marginBottom: "8px" }}>
                Observation Submitted
              </h2>

              <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "28px", maxWidth: "480px", margin: "0 auto 28px" }}>
                Thank you. Your report is now in this staged incident&apos;s coordinator workspace. No emergency service was contacted.
              </p>

              <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-outline-dark"
                >
                  Submit Another Observation
                </button>

                {!access && (
                  <Link href="/dashboard" className="btn btn-primary">
                    <span>View Coordinator Workspace</span>
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          ) : step === "disclaimer" ? (
            <section className="card-light fl-card-pad" aria-labelledby="witness-disclaimer-heading" style={{ background: "#ffffff" }}>
              <span className="badge badge-dark" style={{ marginBottom: "16px" }}>STEP 1 OF 2 · SAFETY & CONSENT</span>
              <h1 id="witness-disclaimer-heading" ref={headingRef} tabIndex={-1} style={{ fontSize: "1.75rem", color: "var(--spruce-main)", marginBottom: "12px" }}>Before you report</h1>
              <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>Please read this before sharing an observation.</p>
              <div style={{ background: "var(--caution-bg)", border: "1px solid var(--caution-border)", borderRadius: "2px", padding: "16px", marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "10px", color: "var(--caution-text)" }}>
                <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
                <p>If you are in immediate danger, evacuate immediately. Do not enter or approach the structure. Report only from a secure location.</p>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem", marginBottom: "24px" }}>This is a staged demonstration. Submitting a report does not contact emergency services. Share only what you can observe from your current safe location.</p>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "16px", background: "var(--cream-muted)", border: "1px solid var(--cream-hairline)", borderRadius: "2px", cursor: "pointer", fontSize: "0.9375rem", color: "var(--text-main)" }}>
                <input type="checkbox" name="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: "4px", flexShrink: 0 }} />
                <span>I confirm I am in a safe location outside the hazard area and consent to sharing my observation with the incident coordinator.</span>
              </label>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "24px" }}>
                {!access && <Link href="/dashboard" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Back to coordinator</Link>}
                <button type="button" className="btn btn-primary" disabled={!consent} onClick={() => { setErrorMsg(null); setStep("form"); }}>
                  Continue to report <ArrowRight size={16} />
                </button>
              </div>
            </section>
          ) : (
            /* Main Witness Reporting Form */
            <div
              className="card-light fl-card-pad"
              style={{
                background: "#ffffff",
              }}
            >
              {/* Header */}
              <div style={{ marginBottom: "24px", borderBottom: "1px solid var(--cream-hairline)", paddingBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                  <span className="badge badge-dark">
                    STEP 2 OF 2 · YOUR OBSERVATION
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    Incident #{incidentId.slice(0, 8)}
                  </span>
                </div>

                <h1 ref={headingRef} tabIndex={-1} style={{ fontSize: "1.75rem", color: "var(--spruce-main)", fontWeight: 600 }}>
                  Witness Incident Report
                </h1>

                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Share what you see or hear near the North Campus canyon to help coordinators establish an accurate picture.
                </p>
              </div>

              {errorMsg && (
                <div
                  style={{
                    background: "var(--danger-bg)",
                    border: "1px solid var(--danger-border)",
                    borderRadius: "2px",
                    padding: "10px 14px",
                    marginBottom: "18px",
                    fontSize: "0.8125rem",
                    color: "var(--danger-text)",
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Reporter Name */}
                <div>
                  <label htmlFor="witness-name" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", fontWeight: 600, color: "var(--spruce-main)", marginBottom: "6px" }}>
                    <User size={14} /> Your Name (Optional)
                  </label>
                  <input
                    id="witness-name"
                    type="text"
                    name="name"
                    maxLength={80}
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan (or leave blank for anonymous)"
                    className="input"
                  />
                </div>

                {/* Observed Location */}
                <div>
                  <label htmlFor="witness-location" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", fontWeight: 600, color: "var(--spruce-main)", marginBottom: "6px" }}>
                    <MapPin size={14} /> Your Current Safe Location *
                  </label>
                  <input
                    id="witness-location"
                    type="text"
                    name="location"
                    maxLength={120}
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. North Plaza, about 100 m from the canyon edge"
                    className="input"
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "4px", display: "block" }}>
                    State clearly where you are standing relative to the structure.
                  </span>
                </div>

                {/* Observation Text */}
                <div>
                  <label htmlFor="witness-text" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", fontWeight: 600, color: "var(--spruce-main)", marginBottom: "6px" }}>
                    <FileText size={14} /> What do you observe right now? *
                  </label>
                  <textarea
                    id="witness-text"
                    name="text"
                    maxLength={1200}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Describe smoke, flames, wind direction, people leaving the area, or conditions you personally see. If sharing something heard second-hand, please note that."
                    className="textarea"
                    rows={4}
                  />
                </div>

                {/* Optional Photo Upload */}
                <div>
                  <span id="witness-photo-label" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", fontWeight: 600, color: "var(--spruce-main)", marginBottom: "6px" }}>
                    <Camera size={14} /> Photo Evidence (Optional)
                  </span>

                  {photoPreview ? (
                    <div style={{ position: "relative", display: "inline-block", marginTop: "4px" }}>
                      <img
                        src={photoPreview}
                        alt="Photo preview"
                        style={{ maxWidth: "100%", width: "240px", maxHeight: "160px", objectFit: "cover", borderRadius: "2px", border: "1px solid var(--cream-hairline)" }}
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="btn btn-sm btn-dark"
                        style={{ position: "absolute", top: "6px", right: "6px", padding: "4px", borderRadius: "50%", width: "24px", height: "24px" }}
                        aria-label="Remove photo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        ref={photoInputRef}
                        id="witness-photo"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoSelect}
                        className="visually-hidden"
                        tabIndex={-1}
                        aria-hidden="true"
                      />
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="btn btn-sm btn-outline-dark"
                        aria-describedby="witness-photo-label"
                      >
                        <Upload size={14} />
                        <span>Upload Photo</span>
                      </button>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", display: "block", marginTop: "4px" }}>
                        JPEG, PNG or WebP, max 4 MB. Photos only from a safe position.
                      </span>
                    </div>
                  )}
                </div>

                {/* Optional Short Microphone Voice Note */}
                <div>
                  <AudioRecorder audio={audioBlob} onAudioReady={handleAudioReady} maxSeconds={45} />
                </div>

                {/* Submit Action */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginTop: "8px" }}>
                  <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => setStep("disclaimer")} disabled={isSubmitting}>
                    <ChevronLeft size={14} /> Back to safety
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || !location.trim() || !hasObservation}
                    className="btn btn-primary"
                    style={{ minWidth: "160px" }}
                  >
                    {isSubmitting ? "Submitting..." : "Send Observation"}
                  </button>
                </div>
              </form>
            </div>
          )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
