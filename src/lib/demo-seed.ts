import type { DemoState, IncidentScene, Volunteer } from "./types";

/** Queue order of the staged incidents in every workspace. */
export const SCENES: readonly IncidentScene[] = ["canyon-fire", "street-flood", "bluff-collapse"];

/** Short operator reference derived from the incident id, so it is stable across reloads and resets. */
export function incidentCode(incidentId: string): string {
  return `FL-${(Number.parseInt(incidentId.replace(/-/g, "").slice(0, 6), 16) % 9000) + 1000}`;
}

type Clock = (minutesAgo: number) => string;
const id = () => crypto.randomUUID();

function volunteer(name: string, initials: string, role: string, skills: string[], distanceMeters: number, bio: string, available = true): Volunteer {
  return { id: id(), name, initials, role, skills, distanceMeters, available, bio };
}

function canyonFire(incidentId: string, time: Clock): DemoState {
  const r1 = id(), r2 = id();
  return {
    viewerRole: "coordinator",
    incident: {
      id: incidentId, code: incidentCode(incidentId), scene: "canyon-fire",
      title: "Brush fire reported in the canyon by North Campus", category: "Wildland–urban interface fire · staged scenario",
      address: "Canyon edge east of North Campus, La Jolla, San Diego", description: "Two witnesses near the canyon are sharing context while the simulated professional response is on its way.",
      status: "responding", reportedAt: time(6), location: { lat: 32.8801, lng: -117.2340 },
      stagingArea: "North Plaza — designated staging point in this scenario",
    },
    reports: [
      { id: r1, sourceLabel: "W-01", name: "Alex Morgan", location: "West walkway above the canyon", text: "I can see flames in the brush on the canyon slope below the walkway, and smoke is drifting toward the buildings. I heard someone say a hiker may still be on the canyon trail, but I cannot confirm that. I am moving back toward the plaza.", kind: "text", createdAt: time(5), isSample: true },
      { id: r2, sourceLabel: "W-02", name: "Jordan Lee", location: "North Plaza", text: "I am in North Plaza. Lots of people have come out of the nearby buildings and the air is smoky. I do not know if the canyon trail is clear. I heard the same thing about a hiker; I have not seen anyone myself.", kind: "text", createdAt: time(3), isSample: true },
    ],
    brief: {
      headline: "Canyon brush fire reported; trail occupancy unconfirmed",
      summary: "Witnesses near North Campus report flames on the canyon slope, smoke drifting toward buildings and people gathering in North Plaza. Reports about a hiker on the trail repeat the same unverified account. A coordinator should keep this uncertainty visible for the simulated arriving team.",
      claims: [
        { id: "claim-1", text: "Flames reported in the brush on the canyon slope.", reportIds: [r1], kind: "observed" },
        { id: "claim-2", text: "Smoke is drifting toward campus buildings; people have gathered in North Plaza.", reportIds: [r1, r2], kind: "reported" },
        { id: "claim-3", text: "A hiker may remain on the canyon trail; neither witness has directly confirmed this.", reportIds: [r1, r2], kind: "disputed", note: "Repeated hearsay is not independent confirmation." },
      ],
      unknowns: ["Whether anyone is on the canyon trail", "Size and direction of the fire", "Current conditions beyond the witnesses' positions"],
      conflicts: [{ text: "Both witnesses repeat one unverified account about a hiker on the trail. Trail occupancy remains unknown.", reportIds: [r1, r2] }],
      suggestedNeeds: ["Coordinator review", "Supply support at the designated staging point"], notes: [], mode: "sample", updatedAt: time(2), revision: 1,
    },
    volunteers: [
      volunteer("Maya Chen", "MC", "Campus response volunteer", ["First aid", "Supply support"], 240, "Registered demo volunteer. Can bring the campus supply kit to the designated staging point."),
      volunteer("Daniel Rivera", "DR", "Community support volunteer", ["Spanish", "Translation"], 410, "Registered demo volunteer available for language support at the staging point."),
      volunteer("Priya Shah", "PS", "Campus response volunteer", ["Logistics", "Supply support"], 620, "Registered demo volunteer who can support the coordinator with supplies and check-in."),
      volunteer("Ethan Brooks", "EB", "Community support volunteer", ["First aid"], 950, "Currently unavailable. No assignment should be sent.", false),
    ],
    assignments: [],
    events: [
      { id: id(), type: "system", text: "Staged incident opened. Professional response is simulated.", createdAt: time(6) },
      { id: id(), type: "report", text: "Alex shared a report from the west walkway above the canyon.", createdAt: time(5) },
      { id: id(), type: "report", text: "Jordan added context from North Plaza.", createdAt: time(3) },
      { id: id(), type: "brief", text: "Sample brief prepared with source links and visible uncertainty.", createdAt: time(2) },
    ],
  };
}

function streetFlood(incidentId: string, time: Clock): DemoState {
  const r1 = id(), r2 = id();
  return {
    viewerRole: "coordinator",
    incident: {
      id: incidentId, code: incidentCode(incidentId), scene: "street-flood",
      title: "Flooding reported in the Genesee Avenue underpass", category: "Urban flooding · staged scenario",
      address: "Genesee Ave underpass below the trolley overpass, University City, San Diego", description: "Heavy rain has pooled in the underpass; witnesses on higher ground are describing water depth and a stalled car.",
      status: "responding", reportedAt: time(14), location: { lat: 32.8722, lng: -117.2108 },
      stagingArea: "Lot P-East — designated staging point in this scenario",
    },
    reports: [
      { id: r1, sourceLabel: "W-01", name: "Casey Ortiz", location: "Sidewalk uphill from the underpass, north side", text: "Water is covering both lanes in the underpass and reaches the bottom of the doors on a stalled grey sedan. Cars are turning around before the dip. I can't tell if anyone is still in the sedan.", kind: "text", createdAt: time(12), isSample: true },
      { id: r2, sourceLabel: "W-02", name: "Avery Brooks", location: "Bus stop at the top of the south ramp", text: "From the bus stop I see the storm drain at the low point overflowing. A man walked up the ramp from the car a few minutes ago, soaked. Someone else said there was a passenger, but I didn't see one.", kind: "text", createdAt: time(9), isSample: true },
    ],
    brief: {
      headline: "Underpass flooded across both lanes; stalled vehicle occupancy unconfirmed",
      summary: "Witnesses report water across both lanes of the Genesee Avenue underpass with a stalled sedan at the low point and the storm drain overflowing. One driver walked out; a possible passenger is reported second-hand only. Traffic is turning around before the dip.",
      claims: [
        { id: "claim-1", text: "Water covers both lanes and reaches the lower doors of a stalled sedan.", reportIds: [r1], kind: "observed" },
        { id: "claim-2", text: "The storm drain at the low point is overflowing.", reportIds: [r2], kind: "observed" },
        { id: "claim-3", text: "A possible passenger remains in the stalled vehicle.", reportIds: [r1, r2], kind: "disputed", note: "Second-hand only; one witness saw the driver leave." },
      ],
      unknowns: ["Whether anyone remains in the stalled sedan", "Water depth at the lowest point", "Whether the water is still rising"],
      conflicts: [{ text: "A passenger is mentioned second-hand; the only person seen left the vehicle on foot.", reportIds: [r1, r2] }],
      suggestedNeeds: ["Coordinator review", "Traffic-awareness support at the designated staging point"], notes: [], mode: "sample", updatedAt: time(8), revision: 1,
    },
    volunteers: [
      volunteer("Sofia Martinez", "SM", "Community support volunteer", ["Spanish", "Check-in"], 300, "Registered demo volunteer who can run check-in at the staging lot."),
      volunteer("Marcus Bell", "MB", "Neighbourhood volunteer", ["First aid", "Blankets & dry kit"], 520, "Registered demo volunteer with a dry-clothing kit for people arriving at staging."),
      volunteer("Hannah Wu", "HW", "Campus response volunteer", ["Logistics"], 780, "Registered demo volunteer for supply runs to the designated staging point."),
    ],
    assignments: [],
    events: [
      { id: id(), type: "system", text: "Staged incident opened. Professional response is simulated.", createdAt: time(14) },
      { id: id(), type: "report", text: "Casey shared a report from the sidewalk uphill from the underpass.", createdAt: time(12) },
      { id: id(), type: "report", text: "Avery added context from the bus stop on the south ramp.", createdAt: time(9) },
      { id: id(), type: "brief", text: "Sample brief prepared with source links and visible uncertainty.", createdAt: time(8) },
    ],
  };
}

function bluffCollapse(incidentId: string, time: Clock): DemoState {
  const r1 = id(), r2 = id();
  return {
    viewerRole: "coordinator",
    incident: {
      id: incidentId, code: incidentCode(incidentId), scene: "bluff-collapse",
      title: "Bluff collapse reported at Black's Beach below the Gliderport", category: "Coastal bluff failure · staged scenario",
      address: "Black's Beach below Torrey Pines Gliderport, La Jolla, San Diego", description: "A section of sandstone bluff reportedly fell onto the beach; witnesses on the clifftop and the beach describe what they can see.",
      status: "responding", reportedAt: time(3), location: { lat: 32.8896, lng: -117.2517 },
      stagingArea: "Gliderport clifftop lot — designated staging point in this scenario",
    },
    reports: [
      { id: r1, sourceLabel: "W-01", name: "Jamie Fox", location: "Gliderport viewing rail, clifftop", text: "Heard a loud crack and saw a dust cloud below the cliff just south of the beach trail. There's a pile of sandstone across the sand now. I'm staying well back from the edge.", kind: "text", createdAt: time(3), isSample: true },
      { id: r2, sourceLabel: "W-02", name: "Rowan Patel", location: "Beach, about 200 m north of the slide", text: "Rocks and sand are across the whole beach south of us. A couple was sitting near the base of the cliff earlier; I can't see them from here and don't know if they had left.", kind: "text", createdAt: time(2), isSample: true },
    ],
    brief: {
      headline: "Bluff failure onto the beach; people near the base earlier, now unaccounted for",
      summary: "Witnesses report a section of bluff collapsed onto Black's Beach just south of the beach trail, leaving debris across the sand. Two people were seen near the base before the collapse; whether they had left is unknown.",
      claims: [
        { id: "claim-1", text: "A section of bluff collapsed onto the beach south of the trail, with a dust cloud.", reportIds: [r1], kind: "observed" },
        { id: "claim-2", text: "Debris covers the beach width south of the trail.", reportIds: [r2], kind: "observed" },
        { id: "claim-3", text: "Two people were near the cliff base before the collapse.", reportIds: [r2], kind: "reported", note: "Seen earlier; current whereabouts unknown." },
      ],
      unknowns: ["Whether anyone was at the base when it fell", "Stability of the remaining bluff", "Condition of the beach trail"],
      conflicts: [],
      suggestedNeeds: ["Coordinator review", "Clifftop check-in support at the designated staging point"], notes: [], mode: "sample", updatedAt: time(1), revision: 1,
    },
    volunteers: [
      volunteer("Noah Kim", "NK", "Campus response volunteer", ["First aid"], 350, "Registered demo volunteer near the Gliderport, available for clifftop check-in."),
      volunteer("Leila Haddad", "LH", "Community support volunteer", ["Arabic", "Translation"], 700, "Registered demo volunteer for language support at the staging point."),
      volunteer("Grace Okafor", "GO", "Neighbourhood volunteer", ["Logistics", "Water & shade"], 1100, "Registered demo volunteer bringing water and shade to the designated staging point."),
    ],
    assignments: [],
    events: [
      { id: id(), type: "system", text: "Staged incident opened. Professional response is simulated.", createdAt: time(3) },
      { id: id(), type: "report", text: "Jamie shared a report from the Gliderport viewing rail.", createdAt: time(3) },
      { id: id(), type: "report", text: "Rowan added context from the beach north of the slide.", createdAt: time(2) },
      { id: id(), type: "brief", text: "Sample brief prepared with source links and visible uncertainty.", createdAt: time(1) },
    ],
  };
}

const BUILDERS: Record<IncidentScene, (incidentId: string, time: Clock) => DemoState> = {
  "canyon-fire": canyonFire,
  "street-flood": streetFlood,
  "bluff-collapse": bluffCollapse,
};

export function createSceneSeed(scene: IncidentScene, incidentId = crypto.randomUUID()): DemoState {
  const now = Date.now();
  return BUILDERS[scene](incidentId, (minutesAgo) => new Date(now - minutesAgo * 60_000).toISOString());
}

/** The original single-incident seed (canyon fire). */
export function createDemoSeed(incidentId = crypto.randomUUID()): DemoState {
  return createSceneSeed("canyon-fire", incidentId);
}
