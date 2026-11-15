import type { DemoState } from "./types";

export function createDemoSeed(incidentId = crypto.randomUUID()): DemoState {
  const now = Date.now();
  const time = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();
  const r1 = crypto.randomUUID(), r2 = crypto.randomUUID();
  return {
    viewerRole: "coordinator",
    incident: {
      id: incidentId, title: "Smoke reported at the Arts Building", category: "Structure fire · staged scenario",
      address: "Arts Building, North Campus", description: "Two witnesses are sharing context while the simulated professional response is on its way.",
      status: "responding", reportedAt: time(6), location: { lat: 32.8801, lng: -117.2340 },
      stagingArea: "North Plaza — designated staging point in this scenario",
    },
    reports: [
      { id: r1, sourceLabel: "W-01", name: "Alex Morgan", location: "West entrance", text: "I can see smoke near the second-floor windows from outside. I heard someone say there may be a person inside, but I cannot confirm that. I am staying across the plaza.", kind: "text", createdAt: time(5), isSample: true },
      { id: r2, sourceLabel: "W-02", name: "Jordan Lee", location: "North Plaza", text: "I am outside the north entrance. Several people have come out into the plaza. I do not know if everyone is out. I heard the same report about someone inside; I have not seen that person myself.", kind: "text", createdAt: time(3), isSample: true },
    ],
    brief: {
      headline: "Smoke reported; occupancy remains unconfirmed",
      summary: "Witnesses outside the Arts Building report smoke and people gathering in North Plaza. Reports about a person inside repeat the same unverified account. A coordinator should keep this uncertainty visible for the simulated arriving team.",
      claims: [
        { id: "claim-1", text: "Smoke reported near second-floor windows.", reportIds: [r1], kind: "reported" },
        { id: "claim-2", text: "People have exited toward North Plaza.", reportIds: [r2], kind: "reported" },
        { id: "claim-3", text: "A person may remain inside; neither witness has directly confirmed this.", reportIds: [r1, r2], kind: "disputed", note: "Repeated hearsay is not independent confirmation." },
      ],
      unknowns: ["Whether anyone remains inside", "Cause and extent of the smoke", "Current conditions beyond the witnesses' positions"],
      conflicts: [{ text: "Both witnesses repeat one unverified account about a person inside. Occupancy remains unknown.", reportIds: [r1, r2] }],
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
      { id: crypto.randomUUID(), type: "report", text: "Alex shared a report from the west entrance.", createdAt: time(5) },
      { id: crypto.randomUUID(), type: "report", text: "Jordan added context from North Plaza.", createdAt: time(3) },
      { id: crypto.randomUUID(), type: "brief", text: "Sample brief prepared with source links and visible uncertainty.", createdAt: time(2) },
    ],
  };
}
