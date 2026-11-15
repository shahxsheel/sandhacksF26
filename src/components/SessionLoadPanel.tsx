"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

interface SessionLoadPanelProps {
  title: string;
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  showDashboardLink?: boolean;
}

export function SessionLoadPanel({
  title,
  message,
  onRetry,
  isRetrying,
  showDashboardLink = true,
}: SessionLoadPanelProps) {
  return (
    <div
      className="card-light"
      style={{
        padding: "36px 28px",
        background: "#ffffff",
        textAlign: "center",
        maxWidth: "520px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "var(--danger-bg)",
          color: "var(--danger-text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}
      >
        <AlertCircle size={28} />
      </div>
      <h2 style={{ fontSize: "1.35rem", color: "var(--spruce-main)", fontWeight: 600, marginBottom: "8px" }}>{title}</h2>
      <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.55, marginBottom: "24px" }}>{message}</p>
      <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
        {onRetry && (
          <button type="button" onClick={onRetry} disabled={isRetrying} className="btn btn-primary">
            <RefreshCw size={14} className={isRetrying ? "spin" : ""} />
            <span>{isRetrying ? "Retrying..." : "Try again"}</span>
          </button>
        )}
        {showDashboardLink && (
          <Link href="/dashboard" className="btn btn-outline-dark">
            Open coordinator workspace
          </Link>
        )}
      </div>
      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}