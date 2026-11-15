"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshCw, RotateCcw, Share2, Check, ExternalLink, ShieldAlert } from "lucide-react";
import type { DemoState } from "../lib/types";

interface NavbarProps {
  state?: DemoState | null;
  /**
   * Set on witness/volunteer pages opened by the workspace owner (no access token) so they can switch views.
   * Shared-link viewers never get the view switcher or share links: those lead to coordinator-only pages.
   */
  ownerIncidentId?: string;
  onRefresh?: () => void;
  onReset?: () => void;
  isRefreshing?: boolean;
}

export function Navbar({ state, ownerIncidentId, onRefresh, onReset, isRefreshing }: NavbarProps) {
  const pathname = usePathname();
  const [copiedRole, setCopiedRole] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [origin, setOrigin] = useState("");
  const shareButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  const isCoordinatorView = Boolean(state?.access);
  const showViewSwitcher = isCoordinatorView || Boolean(ownerIncidentId);
  const incidentId = state?.incident.id ?? ownerIncidentId;

  useEffect(() => {
    if (!showShareModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeShareModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showShareModal]);

  function closeShareModal() {
    setShowShareModal(false);
    setCopyError(null);
    shareButtonRef.current?.focus();
  }
  const witnessToken = state?.access?.witnessToken;
  const volunteerToken = state?.access?.volunteerToken;

  const witnessUrl =
    incidentId ? `${origin}/report/${incidentId}${witnessToken ? `?access=${witnessToken}` : ""}` : "/dashboard";

  const volunteerUrl =
    incidentId ? `${origin}/volunteer/${incidentId}${volunteerToken ? `?access=${volunteerToken}` : ""}` : "/dashboard";

  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or restricted contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopyError(null);
      setCopiedRole(label);
      setTimeout(() => setCopiedRole(null), 2400);
    } catch {
      setCopyError("Copy is blocked in this browser. Select the link text and copy it manually.");
    }
  };

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: "64px",
          background: "var(--cream)",
          borderBottom: "1px solid var(--cream-hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          gap: "12px",
          color: "var(--spruce-main)",
        }}
        className="fl-navbar"
      >
        <div className="fl-navbar-brand" style={{ display: "flex", alignItems: "center", gap: "20px", minWidth: 0 }}>
          {/* Logo mark + wordmark */}
          <Link
            href="/"
            aria-label="FirstLink home"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              color: "var(--spruce-main)",
            }}
          >
            <img src="/brand-mark.svg" width="28" height="28" alt="" style={{ flexShrink: 0 }} />
            <span className="fl-navbar-wordmark" style={{ fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.03em", color: "#032125" }}>
              First<span style={{ color: "#437278" }}>Link</span>
            </span>
          </Link>

          {/* Shared views retain a simulation label; the console has its training status bar. */}
          {pathname !== "/dashboard" && <div
            className="badge badge-sim-dark"
            title="Demonstration scenario with simulated responders. No real emergency connection."
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <span className="pulse-dot" />
            <span style={{ fontSize: "0.75rem", letterSpacing: "0.02em" }}>SIMULATION</span>
          </div>}
        </div>

        {/* View Switcher / Navigation Tabs */}
        {showViewSwitcher && (
        <nav
          aria-label="Demo views"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          className="hide-mobile"
        >
          <Link
            href={incidentId ? `/dashboard?incident=${encodeURIComponent(incidentId)}` : "/dashboard"}
            className="btn btn-sm"
            style={{
              background: pathname === "/dashboard" ? "var(--cream-muted)" : "transparent",
              color: pathname === "/dashboard" ? "var(--spruce-main)" : "var(--spruce-muted)",
              border: pathname === "/dashboard" ? "1px solid var(--cream-hairline-strong)" : "1px solid transparent",
            }}
          >
            Coordinator
          </Link>
          <Link
            href={witnessUrl}
            className="btn btn-sm"
            style={{
              background: pathname.startsWith("/report") ? "var(--cream-muted)" : "transparent",
              color: pathname.startsWith("/report") ? "var(--spruce-main)" : "var(--spruce-muted)",
              border: pathname.startsWith("/report") ? "1px solid var(--cream-hairline-strong)" : "1px solid transparent",
            }}
          >
            Witness Form
          </Link>
          <Link
            href={volunteerUrl}
            className="btn btn-sm"
            style={{
              background: pathname.startsWith("/volunteer") ? "var(--cream-muted)" : "transparent",
              color: pathname.startsWith("/volunteer") ? "var(--spruce-main)" : "var(--spruce-muted)",
              border: pathname.startsWith("/volunteer") ? "1px solid var(--cream-hairline-strong)" : "1px solid transparent",
            }}
          >
            Volunteer View
          </Link>
        </nav>
        )}

        {/* Right utility buttons */}
        <div className="fl-navbar-actions" style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="btn btn-sm btn-outline-dark"
              title="Fetch latest updates from session"
              aria-label="Refresh session"
            >
              <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
              <span className="hide-mobile">Refresh</span>
            </button>
          )}

          {isCoordinatorView && (
          <button
            ref={shareButtonRef}
            onClick={() => setShowShareModal(true)}
            className="btn btn-sm btn-outline-dark"
            title="Share witness or volunteer links"
            aria-label="Share links"
            aria-haspopup="dialog"
          >
            <Share2 size={14} />
            <span className="hide-mobile">Share</span>
          </button>
          )}

          {onReset && (
            <button
              onClick={() => {
                if (window.confirm("Reset all incidents and reports in this training workspace?")) {
                  onReset();
                }
              }}
              className="btn btn-sm btn-outline-dark"
              style={{ color: "var(--spruce-muted)" }}
              disabled={isRefreshing}
              title="Reset training workspace"
              aria-label="Reset demo"
            >
              <RotateCcw size={14} />
              <span className="hide-mobile">Reset</span>
            </button>
          )}
        </div>
      </header>

      {/* Share Links Modal */}
      {showShareModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 25, 28, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={closeShareModal}
        >
          <div
            className="card-dark"
            style={{
              maxWidth: "520px",
              width: "100%",
              padding: "28px",
              background: "var(--spruce-panel)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h3 id="share-title" style={{ fontSize: "1.25rem", color: "var(--cream)" }}>
                  Share Staged Incident Links
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--spruce-light)", marginTop: "4px" }}>
                  Provide scoped links for bystanders to share reports or volunteers to receive staging tasks.
                </p>
              </div>
              <button
                type="button"
                autoFocus
                onClick={closeShareModal}
                className="btn btn-sm btn-outline-light"
                style={{ padding: "4px 10px" }}
                aria-label="Close share links"
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
              {/* Witness link */}
              <div style={{ background: "rgba(0,0,0,0.25)", padding: "14px", borderRadius: "2px", border: "1px solid var(--spruce-hairline)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--cream)" }}>
                    Witness Reporting Link
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--spruce-light)" }}>Public / Bystander</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    readOnly
                    aria-label="Witness reporting link"
                    onFocus={(e) => e.currentTarget.select()}
                    value={witnessUrl}
                    className="input"
                    style={{ background: "#062226", color: "var(--cream)", fontSize: "0.8125rem", border: "1px solid var(--spruce-hairline)", minWidth: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(witnessUrl, "witness")}
                    className="btn btn-sm btn-primary"
                    style={{ minWidth: "90px" }}
                    aria-label="Copy witness link"
                  >
                    {copiedRole === "witness" ? <Check size={14} /> : <Share2 size={14} />}
                    {copiedRole === "witness" ? "Copied" : "Copy"}
                  </button>
                </div>
                <Link
                  href={witnessUrl}
                  onClick={() => setShowShareModal(false)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "8px", fontSize: "0.8125rem", color: "var(--accent-lime)" }}
                >
                  <ExternalLink size={13} /> Open witness view here
                </Link>
              </div>

              {/* Volunteer link */}
              <div style={{ background: "rgba(0,0,0,0.25)", padding: "14px", borderRadius: "2px", border: "1px solid var(--spruce-hairline)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--cream)" }}>
                    Volunteer Portal Link
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--spruce-light)" }}>Designated Staging Tasks</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    readOnly
                    aria-label="Volunteer portal link"
                    onFocus={(e) => e.currentTarget.select()}
                    value={volunteerUrl}
                    className="input"
                    style={{ background: "#062226", color: "var(--cream)", fontSize: "0.8125rem", border: "1px solid var(--spruce-hairline)", minWidth: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(volunteerUrl, "volunteer")}
                    className="btn btn-sm btn-primary"
                    style={{ minWidth: "90px" }}
                    aria-label="Copy volunteer link"
                  >
                    {copiedRole === "volunteer" ? <Check size={14} /> : <Share2 size={14} />}
                    {copiedRole === "volunteer" ? "Copied" : "Copy"}
                  </button>
                </div>
                <Link
                  href={volunteerUrl}
                  onClick={() => setShowShareModal(false)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "8px", fontSize: "0.8125rem", color: "var(--accent-lime)" }}
                >
                  <ExternalLink size={13} /> Open volunteer view here
                </Link>
              </div>
            </div>

            {copyError && (
              <p role="alert" style={{ marginTop: "12px", fontSize: "0.8125rem", color: "var(--caution-border)" }}>
                {copyError}
              </p>
            )}

            <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--spruce-hairline)", display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={closeShareModal} className="btn btn-sm btn-outline-light">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 1100px) {
          .fl-navbar nav.hide-mobile { display: none !important; }
        }
        @media (max-width: 420px) {
          .fl-navbar-brand > .badge { display: none !important; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @media (max-width: 640px) {
          .hide-mobile {
            display: none !important;
          }
          .fl-navbar {
            padding: 0 12px !important;
          }
          .fl-navbar-brand {
            gap: 10px !important;
          }
          .fl-navbar-actions {
            gap: 6px !important;
          }
          .fl-navbar-actions .btn {
            padding: 7px 9px;
          }
        }
      `}</style>
    </>
  );
}
