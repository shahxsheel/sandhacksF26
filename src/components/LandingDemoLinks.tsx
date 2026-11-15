"use client";

import React, { useCallback, useState } from "react";
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

  return (
    <a
      href="/dashboard"
      onClick={handleNavigate}
      className={className}
      style={sharedStyle}
      aria-busy={resolving}
      aria-disabled={resolving}
    >
      {variant === "hero-outline" && <MessageSquare size={16} aria-hidden="true" />}
      <span>{resolving ? "Opening…" : label}</span>
    </a>
  );
}

export function LandingWitnessHeroLink() {
  return <LandingDemoLinks variant="hero-outline" role="witness" label="Submit witness observation" />;
}
