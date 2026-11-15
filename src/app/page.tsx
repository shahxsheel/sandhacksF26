import React from "react";
import Link from "next/link";
import { LandingDemoLinks, LandingWitnessHeroLink } from "../components/LandingDemoLinks";
import { ArrowRight, Shield, Sparkles, Users, MessageSquare, AlertTriangle, ChevronRight } from "lucide-react";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Sticky Header */}
      <header
        style={{
          height: "64px",
          background: "var(--spruce-deep)",
          borderBottom: "1px solid var(--spruce-hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="2" fill="#0b363b" />
            <path d="M16 20h19v8H24v16h-8zM29 36h11V20h8v24H29z" fill="var(--accent-lime)" />
          </svg>
          <span style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--cream)", letterSpacing: "-0.02em" }}>
            firstlink
          </span>
          <span className="badge badge-sim-dark" style={{ marginLeft: "6px" }}>
            SIMULATION
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/dashboard" className="btn btn-sm btn-primary">
            <span>Open Demo</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      <main id="content">
      {/* Hero Section: Dark Spruce Fullbleed */}
      <section
        style={{
          background: "linear-gradient(180deg, var(--spruce-deep) 0%, var(--spruce-main) 100%)",
          color: "var(--cream)",
          padding: "80px 24px 100px",
          borderBottom: "1px solid var(--spruce-hairline)",
        }}
      >
        <div className="container-max">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
              gap: "48px",
              alignItems: "center",
            }}
          >
            {/* Left Hero Column */}
            <div style={{ maxWidth: "580px" }}>
              <div
                className="badge badge-sim-dark"
                style={{ marginBottom: "20px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <span className="pulse-dot" />
                <span>STAGED EMERGENCY RESPONSE DEMO</span>
              </div>

              <h1
                style={{
                  fontSize: "clamp(2.75rem, 7.2vw, 6rem)",
                  lineHeight: 1.02,
                  letterSpacing: "0.002em",
                  color: "var(--cream)",
                  fontWeight: 475,
                  marginBottom: "24px",
                }}
              >
                The first minutes, connected.
              </h1>

              <p
                style={{
                  fontSize: "clamp(1.15rem, 2vw, 1.35rem)",
                  lineHeight: 1.55,
                  color: "var(--spruce-light)",
                  marginBottom: "36px",
                  fontWeight: 450,
                }}
              >
                Turn bystander witness reports into a source-linked incident brief and coordinate community support toward coordinator-designated staging areas.
              </p>

              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
                <Link href="/dashboard" className="btn btn-lg btn-primary">
                  <span>Open Coordinator Workspace</span>
                  <ArrowRight size={16} />
                </Link>

                <LandingWitnessHeroLink />
              </div>

              {/* Calm safety note */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "28px",
                  fontSize: "0.8125rem",
                  color: "var(--spruce-muted)",
                }}
              >
                <Shield size={14} color="var(--accent-lime)" />
                <span>Simulated campus fire scenario · Professional response is staged</span>
              </div>
            </div>

            {/* Right Hero Column: Composed Interactive Product Preview */}
            <div>
              <div
                className="card-dark"
                style={{
                  background: "var(--spruce-panel)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  position: "relative",
                }}
              >
                {/* Mock Window Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--spruce-hairline)", paddingBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ff5f56" }} />
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ffbd2e" }} />
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#27c93f" }} />
                    <span style={{ fontSize: "0.75rem", color: "var(--spruce-light)", marginLeft: "8px", fontWeight: 600 }}>
                      FIRSTLINK COORDINATOR BRIEF
                    </span>
                  </div>
                  <span className="badge badge-sim-dark" style={{ fontSize: "0.6875rem" }}>
                    Static sample preview
                  </span>
                </div>

                {/* Miniature Brief Snapshot */}
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-lime)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Active Incident Brief
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--cream)", marginTop: "4px" }}>
                    Smoke reported at Arts Building; occupancy unconfirmed
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--spruce-light)", marginTop: "6px", lineHeight: 1.45 }}>
                    Illustrative coordinator view only — not live AI. Claims are tagged by source; disputed items stay visible.
                  </p>
                </div>

                {/* Claims list sample */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ background: "rgba(0, 25, 28, 0.4)", padding: "8px 12px", borderRadius: "2px", border: "1px solid var(--spruce-hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8125rem" }}>
                      <span className="badge badge-blue" style={{ fontSize: "0.625rem" }}>REPORTED</span>
                      <span>Smoke visible at west 2nd-floor windows</span>
                    </div>
                    <span style={{ background: "var(--spruce-deep)", color: "var(--accent-lime)", fontSize: "0.6875rem", padding: "1px 6px", borderRadius: "9999px" }}>
                      W-01
                    </span>
                  </div>

                  <div style={{ background: "rgba(115, 74, 0, 0.15)", padding: "8px 12px", borderRadius: "2px", border: "1px solid rgba(242, 210, 135, 0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8125rem" }}>
                      <span className="badge badge-caution" style={{ fontSize: "0.625rem" }}>DISPUTED</span>
                      <span style={{ color: "#ffe7a8" }}>Occupancy unconfirmed (Repeated hearsay)</span>
                    </div>
                    <span style={{ background: "var(--spruce-deep)", color: "#ffe7a8", fontSize: "0.6875rem", padding: "1px 6px", borderRadius: "9999px" }}>
                      W-01, W-02
                    </span>
                  </div>
                </div>

                {/* Staging & Volunteer preview */}
                <div style={{ background: "rgba(0, 25, 28, 0.6)", padding: "12px", borderRadius: "2px", border: "1px solid var(--spruce-hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--accent-lime)", color: "var(--spruce-deep)", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>
                      MC
                    </div>
                    <div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--cream)" }}>
                        Maya Chen (First Aid)
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--spruce-light)" }}>
                        Assigned to North Plaza staging area
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: "0.6875rem" }}>
                    Demo: staged assignment
                  </span>
                </div>

                <Link
                  href="/dashboard"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontSize: "0.8125rem",
                    color: "var(--accent-lime)",
                    fontWeight: 600,
                    textDecoration: "none",
                    paddingTop: "6px",
                  }}
                >
                  <span>Launch full interactive coordinator demo</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explanation & Workflow Section: Cream Canvas */}
      <section style={{ background: "var(--cream)", padding: "96px 24px", color: "var(--text-main)", flex: 1 }}>
        <div className="container-max">
          <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 64px" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--spruce-muted)", textTransform: "uppercase" }}>
              HOW FIRSTLINK WORKS
            </span>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", color: "var(--spruce-main)", marginTop: "8px", fontWeight: 475 }}>
              Calm coordination when seconds matter.
            </h2>
            <p style={{ fontSize: "1.05rem", color: "var(--text-muted)", marginTop: "14px", lineHeight: 1.6 }}>
              In critical incidents, 911 dispatchers are overwhelmed with fragmented calls. FirstLink structures witness reports with source citations while routing volunteers only to coordinator-designated staging points — not into the hazard.
            </p>
          </div>

          {/* 3 Role Pillars */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
              gap: "28px",
              marginBottom: "64px",
            }}
          >
            {/* Pillar 1: Witness Reporting */}
            <div className="card-light" style={{ padding: "32px 28px", background: "#ffffff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--soft-blue)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                  <MessageSquare size={20} color="var(--soft-blue-text)" />
                </div>
                <h3 style={{ fontSize: "1.25rem", color: "var(--spruce-main)", marginBottom: "10px", fontWeight: 600 }}>
                  1. Safe Witness Intake
                </h3>
                <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Bystanders submit short voice notes, real photos, and text observations with safety consent confirmation. Voice notes are transcribed through ElevenLabs.
                </p>
              </div>
              <div style={{ marginTop: "24px" }}>
                <LandingDemoLinks variant="pillar-outline" role="witness" label="Try witness form" />
              </div>
            </div>

            {/* Pillar 2: Live AI Synthesis */}
            <div className="card-light" style={{ padding: "32px 28px", background: "#ffffff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--pale-green)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                  <Sparkles size={20} color="var(--pale-green-text)" />
                </div>
                <h3 style={{ fontSize: "1.25rem", color: "var(--spruce-main)", marginBottom: "10px", fontWeight: 600 }}>
                  2. Source-linked incident brief
                </h3>
                <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  When enabled, Gemini synthesizes reports into claims tied to witness labels like `[W-01]`, keeps disputed items visible, and lists unknowns — never silent upgrades.
                </p>
              </div>
              <div style={{ marginTop: "24px" }}>
                <Link href="/dashboard" className="btn btn-sm btn-dark" style={{ width: "100%" }}>
                  Open Coordinator Brief
                </Link>
              </div>
            </div>

            {/* Pillar 3: Bounded Staging Dispatch */}
            <div className="card-light" style={{ padding: "32px 28px", background: "#ffffff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--cream-muted)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                  <Users size={20} color="var(--spruce-main)" />
                </div>
                <h3 style={{ fontSize: "1.25rem", color: "var(--spruce-main)", marginBottom: "10px", fontWeight: 600 }}>
                  3. Bounded Staging Dispatch
                </h3>
                <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Nearby registered volunteers receive tasks exclusively for designated staging locations. Strict boundary guards prevent hazardous self-dispatch.
                </p>
              </div>
              <div style={{ marginTop: "24px" }}>
                <LandingDemoLinks variant="pillar-outline" role="volunteer" label="View volunteer portal" />
              </div>
            </div>
          </div>

          {/* Staged Disclaimer Box */}
          <div
            style={{
              background: "var(--cream-muted)",
              border: "1px solid var(--cream-hairline)",
              borderRadius: "2px",
              padding: "24px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", maxWidth: "780px" }}>
              <AlertTriangle size={20} color="var(--caution-text)" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--spruce-main)" }}>
                  Hackathon Demonstration Environment
                </div>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  All incident data, locations, volunteer profiles, and arrival times are staged for demonstration purposes. This system is not connected to municipal 911 dispatch or live emergency services.
                </p>
              </div>
            </div>

            <Link href="/dashboard" className="btn btn-sm btn-primary">
              Open coordinator workspace
            </Link>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          background: "var(--spruce-deep)",
          color: "var(--spruce-light)",
          padding: "36px 24px",
          borderTop: "1px solid var(--spruce-hairline)",
          fontSize: "0.8125rem",
        }}
      >
        <div className="container-max" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontWeight: 600, color: "var(--cream)" }}>firstlink</span>
            <span>·</span>
            <span>The first minutes, connected.</span>
          </div>

          <div style={{ display: "flex", gap: "20px" }}>
            <Link href="/dashboard" style={{ color: "var(--cream)" }}>Coordinator</Link>
            <LandingDemoLinks variant="footer" role="witness" label="Witness" />
            <LandingDemoLinks variant="footer" role="volunteer" label="Volunteer" />
          </div>
        </div>
      </footer>
    </div>
  );
}
