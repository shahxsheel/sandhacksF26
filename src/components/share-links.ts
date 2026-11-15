const INCIDENT_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isIncidentUuid(value: string): boolean {
  return INCIDENT_UUID.test(value);
}

export function witnessPath(incidentId: string, witnessToken?: string): string {
  const base = `/report/${incidentId}`;
  return witnessToken ? `${base}?access=${encodeURIComponent(witnessToken)}` : base;
}

export function volunteerPath(incidentId: string, volunteerToken?: string): string {
  const base = `/volunteer/${incidentId}`;
  return volunteerToken ? `${base}?access=${encodeURIComponent(volunteerToken)}` : base;
}