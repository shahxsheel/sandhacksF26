"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { fetchSession } from "./api";
import { volunteerPath, witnessPath } from "./share-links";

type LinkVariant = "hero-outline" | "pillar-outline" | "pillar-dark" | "footer" | "disclaimer";

interface LandingDemoLinksProps {
  variant: LinkVariant;
  role: "witness" | "volunteer";
  label: string;
}

async function resolveRoleDestination(role: "witness" | "volunteer"): Promise<string> {
  const state = await fetchSession();
  const incidentId = state.incident.id;
  const token = role === "witness" ? state.access?.witnessToken : state.access?.volunteerToken;
  if (!token) {
    throw new Error("missing role token");
  }
  return role === "witness" ? witnessPath(incidentId, token) : volunteerPath(incidentId, token);
}

export function LandingDemoLinks({ variant, role, label }: LandingDemoLinksProps) {
  const router = useRouter();
  const [resolving, setResolving] = useState(false);

  const handleNavigate = useCallback(
  async (e: React.MouseEvent) => {
    e.preventDefault();
    if (resolving) return;
    setResolving(true);
    try {
      const href = await resolveRoleDestination(role);
      router.push(href);
    } catch {
      router.push("/dashboard");
    } finally {
      setResolving(false);
    }
  },
  [resolving, role, router],
);

  const className =
    variant === "hero-outline"
      ? "btn btn-lg btn-outline-light"
      : variant === "pillar-dark"
        ? "btn btn-sm btn-dark"
        : variant === "footer"
          ? ""
          : variant === "pillar-outline"
            ? "btn btn-sm btn-outline-dark"
            : "btn btn-sm btn-primary";

  const sharedStyle: React.CSSProperties =
    variant === "pillar-outline" || variant === "pillar-dark"
      ? { width: "100%" }
      : variant === "footer"
        ? { color: "var(--cream)", opacity: resolving ? 0.65 : 1, cursor: resolving ? "wait" : "pointer" }
        : { opacity: resolving ? 0.65 : 1, cursor: resolving ? "wait" : undefined };

  if (variant === "footer") {
    return (
      <a href="#" onClick={handleNavigate} style={sharedStyle} aria-busy={resolving}>
        {resolving ? "Opening…" : label}
      </a>
    );
  }

  if (variant === "pillar-outline" || variant === "pillar-dark" || variant === "hero-outline") {
    return (
      <a
        href="#"
        onClick={handleNavigate}
        className={className}
        style={sharedStyle}
        aria-busy={resolving}
      >
        {resolving ? "Opening…" : label}
      </a>
    );
  }

  return (
    <Link href="#" onClick={handleNavigate} className={className} style={sharedStyle} aria-busy={resolving}>
      {resolving ? "Opening…" : label}
    </Link>
  );
}

/** Hero witness CTA with icon slot handled by parent — icon-free variant */
export function LandingWitnessHeroLink() {
  const router = useRouter();
  const [resolving, setResolving] = useState(false);

  const handleNavigate = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      if (resolving) return;
      setResolving(true);
      try {
        const href = await resolveRoleDestination("witness");
        router.push(href);
      } catch {
        router.push("/dashboard");
      } finally {
        setResolving(false);
      }
    },
    [resolving, router],
  );

  return (
    <a
      href="#"
      onClick={handleNavigate}
      className="btn btn-lg btn-outline-light"
      style={{ opacity: resolving ? 0.7 : 1, cursor: resolving ? "wait" : "pointer" }}
      aria-busy={resolving}
    >
      <MessageSquare size={16} />
      <span>{resolving ? "Opening witness form…" : "Submit witness observation"}</span>
    </a>
  );
}