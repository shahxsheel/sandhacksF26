import type { DemoState } from "./types";

export function createDemoSeed(incidentId = crypto.randomUUID()): DemoState {
  const now = Date.now();
  const time = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();
  const r1 = crypto.randomUUID(), r2 = crypto.randomUUID();
  return {
    viewerRole: "coordinator",
    incident: {
      id: incidentId, title: "Brush fire reported in the canyon by North Campus", category: "Wildland–urban interface fire · staged scenario",
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
      { id: crypto.randomUUID(), name: "Maya Chen", initials: "MC", role: "Campus response volunteer", skills: ["First aid", "Supply support"], distanceMeters: 240, available: true, bio: "Registered demo volunteer. Can bring the campus supply kit to the designated staging point." },
      { id: crypto.randomUUID(), name: "Daniel Rivera", initials: "DR", role: "Community support volunteer", skills: ["Spanish", "Translation"], distanceMeters: 410, available: true, bio: "Registered demo volunteer available for language support at the staging point." },
      { id: crypto.randomUUID(), name: "Priya Shah", initials: "PS", role: "Campus response volunteer", skills: ["Logistics", "Supply support"], distanceMeters: 620, available: true, bio: "Registered demo volunteer who can support the coordinator with supplies and check-in." },
      { id: crypto.randomUUID(), name: "Ethan Brooks", initials: "EB", role: "Community support volunteer", skills: ["First aid"], distanceMeters: 950, available: false, bio: "Currently unavailable. No assignment should be sent." },
    ],
    assignments: [],
    events: [
      { id: crypto.randomUUID(), type: "system", text: "Staged incident opened. Professional response is simulated.", createdAt: time(6) },
      { id: crypto.randomUUID(), type: "report", text: "Alex shared a report from the west walkway above the canyon.", createdAt: time(5) },
      { id: crypto.randomUUID(), type: "report", text: "Jordan added context from North Plaza.", createdAt: time(3) },
      { id: crypto.randomUUID(), type: "brief", text: "Sample brief prepared with source links and visible uncertainty.", createdAt: time(2) },
    ],
  };
}
