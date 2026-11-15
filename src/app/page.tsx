import React from "react";
import Link from "next/link";
import { LandingDemoLinks, LandingWitnessHeroLink } from "../components/LandingDemoLinks";
import { ArrowRight, Shield, Sparkles, Users, MessageSquare, AlertTriangle, ChevronRight, PhoneCall, ShieldAlert, Camera, ShieldCheck, ClipboardList } from "lucide-react";

const FLOW_STEPS = [
  { icon: PhoneCall, title: "911 call is logged", text: "In this demo the dispatcher's text message is simulated: the caller receives a FirstLink witness link." },
  { icon: ShieldAlert, title: "Safety & consent", text: "Step 1 of the form. The witness confirms they are somewhere safe and consents before anything is collected." },
  { icon: Camera, title: "Observation", text: "Step 2. Text, a photo, or a voice note of up to 45 seconds. ElevenLabs transcribes the voice note." },
  { icon: ShieldCheck, title: "Gemini screening", text: "Each report is checked as it arrives. Off-site, fabricated or manipulative reports are withheld from the feed." },
  { icon: ClipboardList, title: "Shared brief", text: "Gemini combines the accepted reports into a brief where every claim links to its sources. Coordinators correct it with notes." },
  { icon: Users, title: "Approved support", text: "The coordinator approves nearby volunteers for the designated staging point; volunteers accept or decline." },
];

function Brand() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand-mark.svg" alt="" width={28} height={28} />
      <span style={{ fontSize: "1.15rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
        <span style={{ color: "#fffcf6" }}>First</span><span style={{ color: "#a1c2c6" }}>Link</span>
      </span>
    </span>
  );
}

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
          padding: "0 clamp(12px, 3vw, 24px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <Brand />
          <span className="badge badge-sim-dark" style={{ marginLeft: "6px" }}>
            SIMULATION
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/dashboard" className="btn btn-sm btn-primary">
            <span>Open console</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      <main id="content">
      {/* Hero Section: Dark Spruce Fullbleed */}
      <section
        style={{
          background: "var(--spruce-deep)",
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
                  <span>Open console</span>
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
                  color: "var(--spruce-light)",
                }}
              >
                <Shield size={14} color="var(--accent-lime)" />
                <span>Three simulated San Diego incidents · Professional response is staged</span>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid var(--spruce-hairline)", paddingBottom: "12px" }}>
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
                    Canyon brush fire reported; trail occupancy unconfirmed
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
                      <span>Flames reported on the canyon slope</span>
                    </div>
                    <span style={{ background: "var(--spruce-deep)", color: "var(--accent-lime)", fontSize: "0.6875rem", padding: "1px 6px", borderRadius: "9999px" }}>
                      W-01
                    </span>
                  </div>

                  <div style={{ background: "rgba(115, 74, 0, 0.15)", padding: "8px 12px", borderRadius: "2px", border: "1px solid rgba(242, 210, 135, 0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8125rem" }}>
                      <span className="badge badge-caution" style={{ fontSize: "0.625rem" }}>DISPUTED</span>
                      <span style={{ color: "#ffe7a8" }}>Hiker may remain on the trail (repeated hearsay)</span>
                    </div>
                    <span style={{ background: "var(--spruce-deep)", color: "#ffe7a8", fontSize: "0.6875rem", padding: "1px 6px", borderRadius: "9999px" }}>
                      W-01, W-02
                    </span>
                  </div>
                </div>

                {/* Staging & Volunteer preview */}
                <div style={{ background: "rgba(0, 25, 28, 0.6)", padding: "12px", borderRadius: "2px", border: "1px solid var(--spruce-hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--accent-lime)", color: "var(--spruce-deep)", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>
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
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.08em", color: "var(--spruce-muted)", textTransform: "uppercase" }}>
              FROM OBSERVATION TO COORDINATION
            </span>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", color: "var(--spruce-main)", marginTop: "8px", fontWeight: 475 }}>
              Calm coordination when seconds matter.
            </h2>
            <p style={{ fontSize: "1.05rem", color: "var(--text-muted)", marginTop: "14px", lineHeight: 1.6 }}>
              In the first minutes of an incident, what bystanders know arrives fragmented and unverified. FirstLink structures witness reports with source citations while routing volunteers only to coordinator-designated staging points — not into the hazard.
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
                  Open console
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
                  A coordinator approves nearby registered volunteers for designated staging points only; volunteers cannot assign themselves. In this demo no message is sent.
                </p>
              </div>
              <div style={{ marginTop: "24px" }}>
                <LandingDemoLinks variant="pillar-outline" role="volunteer" label="View volunteer portal" />
              </div>
            </div>
          </div>

          <section aria-labelledby="how-it-works-heading" style={{ marginTop: "80px", marginBottom: "64px" }}>
            <div style={{ maxWidth: "640px", marginBottom: "28px" }}>
              <h2 id="how-it-works-heading" style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", color: "var(--spruce-main)", fontWeight: 475 }}>
                How it works
              </h2>
              <p style={{ color: "var(--text-muted)", marginTop: "12px", lineHeight: 1.6 }}>
                A witness observation becomes a shared brief, with a coordinator reviewing the next step.
              </p>
            </div>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: "16px" }}>
              {FLOW_STEPS.map((step, index) => (
                <li key={step.title} className="card-light" style={{ padding: "24px", background: "#ffffff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", color: "var(--spruce-muted)" }}>
                    <step.icon size={20} aria-hidden="true" />
                    <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 style={{ color: "var(--spruce-main)", fontSize: "1rem", fontWeight: 600, marginBottom: "8px" }}>{step.title}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>{step.text}</p>
                  {index === 3 && (
                    <p style={{ color: "var(--spruce-main)", fontSize: "0.8125rem", lineHeight: 1.6, marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--cream-hairline)" }}>
                      With several incidents active, Gemini also routes unrouted dispatch-intake reports to the right incident: a canyon brush fire, a flooded underpass or a coastal bluff collapse. Reports that match none are held back.
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>

          <aside aria-labelledby="simulation-heading" style={{ background: "var(--cream-muted)", border: "1px solid var(--cream-hairline)", borderRadius: "2px", padding: "24px 28px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <AlertTriangle size={20} color="var(--caution-text)" aria-hidden="true" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <h2 id="simulation-heading" style={{ fontSize: "1rem", fontWeight: 600, color: "var(--spruce-main)" }}>What’s simulated</h2>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.6 }}>
                911 link delivery, agency dispatch, volunteer travel and the incidents themselves are staged. There is no connection to live emergency services. Photos are real San Diego-area archival photos (wildfires, flooding, a bluff collapse) from Wikimedia Commons, used as stand-ins; they do not depict these staged incidents. <a href="/sim/CREDITS.md" style={{ color: "var(--spruce-main)", textDecoration: "underline", textUnderlineOffset: "3px" }}>Photo and media credits</a>. Voices are synthetic.
              </p>
            </div>
          </aside>

          <div aria-label="Built with" style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--cream-hairline)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", lineHeight: 1.8 }}>
              <span style={{ marginRight: "16px" }}>Built with</span>
              <span style={{ color: "var(--spruce-main)" }}>Gemini · ElevenLabs · Neon · Vultr</span>
            </p>
            <Link href="/dashboard" className="btn btn-sm btn-primary">Open console <ArrowRight size={14} aria-hidden="true" /></Link>
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
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <Brand />
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
