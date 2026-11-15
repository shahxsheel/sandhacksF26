"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshCw, RotateCcw, Share2, Check, ExternalLink, ShieldAlert } from "lucide-react";
import type { DemoState } from "../lib/types";

interface NavbarProps {
  state?: DemoState | null;
  onRefresh?: () => void;
  onReset?: () => void;
  isRefreshing?: boolean;
}

export function Navbar({ state, onRefresh, onReset, isRefreshing }: NavbarProps) {
  const pathname = usePathname();
  const [copiedRole, setCopiedRole] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const incidentId = state?.incident.id;
  const witnessToken = state?.access?.witnessToken;
  const volunteerToken = state?.access?.volunteerToken;

  const witnessUrl =
    incidentId && typeof window !== "undefined"
      ? `${window.location.origin}/report/${incidentId}${witnessToken ? `?access=${witnessToken}` : ""}`
      : incidentId
        ? `/report/${incidentId}${witnessToken ? `?access=${witnessToken}` : ""}`
        : "/dashboard";

  const volunteerUrl =
    incidentId && typeof window !== "undefined"
      ? `${window.location.origin}/volunteer/${incidentId}${volunteerToken ? `?access=${volunteerToken}` : ""}`
      : incidentId
        ? `/volunteer/${incidentId}${volunteerToken ? `?access=${volunteerToken}` : ""}`
        : "/dashboard";

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
      setCopiedRole(label);
      setTimeout(() => setCopiedRole(null), 2400);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
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
          background: "var(--spruce-deep)",
          borderBottom: "1px solid var(--spruce-hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          color: "var(--cream)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* Logo mark + wordmark */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              color: "var(--cream)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 64 64" fill="none" style={{ flexShrink: 0 }}>
              <rect width="64" height="64" rx="2" fill="#0b363b" />
              <path d="M16 20h19v8H24v16h-8zM29 36h11V20h8v24H29z" fill="var(--accent-lime)" />
            </svg>
            <span
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--cream)",
              }}
            >
              firstlink
            </span>
          </Link>

          {/* Simulation Badge */}
          <div
            className="badge badge-sim-dark"
            title="Demonstration scenario with simulated responders. No real emergency connection."
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <span className="pulse-dot" />
            <span style={{ fontSize: "0.75rem", letterSpacing: "0.02em" }}>SIMULATION</span>
          </div>
        </div>

        {/* View Switcher / Navigation Tabs */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          className="hide-mobile"
        >
          <Link
            href="/dashboard"
            className="btn btn-sm"
            style={{
              background: pathname === "/dashboard" ? "var(--spruce-panel)" : "transparent",
              color: pathname === "/dashboard" ? "var(--accent-lime)" : "var(--spruce-light)",
              border: pathname === "/dashboard" ? "1px solid rgba(171, 255, 174, 0.3)" : "1px solid transparent",
            }}
          >
            Coordinator
          </Link>
          <Link
            href={witnessUrl}
            className="btn btn-sm"
            style={{
              background: pathname.startsWith("/report") ? "var(--spruce-panel)" : "transparent",
              color: pathname.startsWith("/report") ? "var(--accent-lime)" : "var(--spruce-light)",
              border: pathname.startsWith("/report") ? "1px solid rgba(171, 255, 174, 0.3)" : "1px solid transparent",
            }}
          >
            Witness Form
          </Link>
          <Link
            href={volunteerUrl}
            className="btn btn-sm"
            style={{
              background: pathname.startsWith("/volunteer") ? "var(--spruce-panel)" : "transparent",
              color: pathname.startsWith("/volunteer") ? "var(--accent-lime)" : "var(--spruce-light)",
              border: pathname.startsWith("/volunteer") ? "1px solid rgba(171, 255, 174, 0.3)" : "1px solid transparent",
            }}
          >
            Volunteer View
          </Link>
        </nav>

        {/* Right utility buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="btn btn-sm btn-outline-light"
              title="Fetch latest updates from session"
              aria-label="Refresh session"
            >
              <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
              <span className="hide-mobile">Refresh</span>
            </button>
          )}

          <button
            onClick={() => setShowShareModal(true)}
            className="btn btn-sm btn-outline-light"
            title="Share witness or volunteer links"
            aria-label="Share links"
          >
            <Share2 size={14} />
            <span className="hide-mobile">Share</span>
          </button>

          {onReset && (
            <button
              onClick={() => {
                if (window.confirm("Reset this demonstration incident back to initial state?")) {
                  onReset();
                }
              }}
              className="btn btn-sm btn-outline-light"
              style={{ color: "var(--spruce-light)" }}
              title="Reset demo data"
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
          onClick={() => setShowShareModal(false)}
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
                onClick={() => setShowShareModal(false)}
                className="btn btn-sm btn-outline-light"
                style={{ padding: "4px 10px" }}
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
                    value={witnessUrl}
                    className="input"
                    style={{ background: "#062226", color: "var(--cream)", fontSize: "0.8125rem", border: "1px solid var(--spruce-hairline)" }}
                  />
                  <button
                    onClick={() => copyToClipboard(witnessUrl, "witness")}
                    className="btn btn-sm btn-primary"
                    style={{ minWidth: "90px" }}
                  >
                    {copiedRole === "witness" ? <Check size={14} /> : <Share2 size={14} />}
                    {copiedRole === "witness" ? "Copied" : "Copy"}
                  </button>
                </div>
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
                    value={volunteerUrl}
                    className="input"
                    style={{ background: "#062226", color: "var(--cream)", fontSize: "0.8125rem", border: "1px solid var(--spruce-hairline)" }}
                  />
                  <button
                    onClick={() => copyToClipboard(volunteerUrl, "volunteer")}
                    className="btn btn-sm btn-primary"
                    style={{ minWidth: "90px" }}
                  >
                    {copiedRole === "volunteer" ? <Check size={14} /> : <Share2 size={14} />}
                    {copiedRole === "volunteer" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--spruce-hairline)", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowShareModal(false)} className="btn btn-sm btn-outline-light">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
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
        }
      `}</style>
    </>
  );
}
