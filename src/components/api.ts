import type { DemoState, WitnessReport } from "../lib/types";

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const sessionInFlight = new Map<string, Promise<DemoState>>();

function sessionRequestKey(incidentId?: string, access?: string, role?: string): string {
  return `${incidentId ?? ""}|${access ?? ""}|${role ?? ""}`;
}

export async function fetchSession(incidentId?: string, access?: string, role?: string): Promise<DemoState> {
  const key = sessionRequestKey(incidentId, access, role);
  const existing = sessionInFlight.get(key);
  if (existing) return existing;

  const params = new URLSearchParams();
  if (incidentId) params.set("incidentId", incidentId);
  if (access) params.set("access", access);
  if (role) params.set("role", role);

  const query = params.toString() ? `?${params.toString()}` : "";
  const promise = (async () => {
    const res = await fetch(`/api/session${query}`, { credentials: "same-origin" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.error || `HTTP ${res.status} retrieving session`, res.status);
    }
    const data = await res.json();
    return data.state as DemoState;
  })().finally(() => {
    sessionInFlight.delete(key);
  });

  sessionInFlight.set(key, promise);
  return promise;
}

export async function resetSession(incidentId?: string): Promise<DemoState> {
  const res = await fetch("/api/session/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ incidentId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || `Failed to reset demo (${res.status})`, res.status);
  }
  const data = await res.json();
  return data.state;
}

export async function generateBrief(incidentId: string): Promise<DemoState> {
  const res = await fetch("/api/brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ incidentId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || `Brief synthesis failed (${res.status})`, res.status);
  }
  const data = await res.json();
  return data.state;
}

export async function addCoordinatorNote(incidentId: string, text: string): Promise<DemoState> {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ incidentId, text }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || `Failed to save coordinator note (${res.status})`, res.status);
  }
  const data = await res.json();
  return data.state;
}

export async function assignVolunteer(incidentId: string, volunteerId: string, task: string): Promise<DemoState> {
  const res = await fetch("/api/assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ incidentId, volunteerId, task }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || `Failed to create assignment (${res.status})`, res.status);
  }
  const data = await res.json();
  return data.state;
}

export async function respondAssignment(
  assignmentId: string,
  incidentId: string,
  action: "accept" | "decline",
  access?: string
): Promise<DemoState> {
  const res = await fetch(`/api/assignments/${assignmentId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      incidentId,
      access,
      ...(!access ? { role: "volunteer" as const } : {}),
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || `Failed to ${action} assignment (${res.status})`, res.status);
  }
  const data = await res.json();
  return data.state;
}

export async function submitReport(formData: FormData): Promise<{ state?: DemoState; report?: WitnessReport }> {
  const res = await fetch("/api/reports", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || `Report submission failed (${res.status})`, res.status);
  }
  return await res.json();
}

export async function fetchNarrationAudio(incidentId: string): Promise<Blob> {
  const res = await fetch("/api/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ incidentId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || `Audio narration failed (${res.status})`, res.status);
  }
  return await res.blob();
}