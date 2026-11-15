import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import type { Assignment, DemoState, WitnessReport } from "../../src/lib/types";

/** Fresh coordinator workspace; relies on httpOnly owner cookie from Set-Cookie. */
async function openOwnerSession(request: APIRequestContext): Promise<DemoState> {
  const response = await request.get("/api/session");
  expect(response.ok(), `GET /api/session failed: ${response.status()} ${await response.text()}`).toBeTruthy();
  const body = (await response.json()) as { state: DemoState };
  expect(body.state.viewerRole).toBe("coordinator");
  expect(body.state.incident.id).toMatch(/^[0-9a-f-]{36}$/i);
  return body.state;
}

async function openRoleSession(
  request: APIRequestContext,
  incidentId: string,
  role: "witness" | "volunteer",
  access: string,
): Promise<DemoState> {
  const response = await request.get(
    `/api/session?incidentId=${encodeURIComponent(incidentId)}&access=${encodeURIComponent(access)}&role=${role}`,
  );
  expect(response.ok(), `role session failed: ${response.status()}`).toBeTruthy();
  const body = (await response.json()) as { state: DemoState };
  expect(body.state.viewerRole).toBe(role);
  return body.state;
}

function availableVolunteer(state: DemoState) {
  const volunteer = state.volunteers.find((v) => v.available);
  expect(volunteer, "expected at least one available volunteer in seed data").toBeDefined();
  return volunteer!;
}

async function submitTextReport(
  request: APIRequestContext,
  incidentId: string,
  fields: { name: string; location: string; text: string; consent: string; access?: string },
): Promise<{ state: DemoState; report: WitnessReport }> {
  const multipart: Record<string, string> = {
    incidentId,
    name: fields.name,
    location: fields.location,
    text: fields.text,
    consent: fields.consent,
  };
  if (fields.access) {
    multipart.access = fields.access;
  }
  const response = await request.post("/api/reports", { multipart });
  const raw = await response.text();
  expect(response.ok(), `POST /api/reports failed: ${response.status()} ${raw}`).toBeTruthy();
  return JSON.parse(raw) as { state: DemoState; report: WitnessReport };
}

async function assertMainHeadingReadable(page: Page, minFontPx = 28) {
  const main = page.locator("main").first();
  await expect(main).toBeVisible();
  const heading = main.getByRole("heading", { level: 1 }).first();
  await expect(heading).toBeVisible();
  const viewport = page.viewportSize();
  expect(viewport).toBeTruthy();
  const box = await heading.boundingBox();
  expect(box).toBeTruthy();
  expect(box!.width).toBeLessThanOrEqual((viewport?.width ?? 0) + 4);
  const fontSize = await heading.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(fontSize).toBeGreaterThanOrEqual(minFontPx);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
  expect(overflow).toBeTruthy();
}

test.describe("API — isolated owner workspaces", () => {
  test("two owner sessions receive distinct incident workspaces", async ({ playwright }) => {
    const a = await playwright.request.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000" });
    const b = await playwright.request.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000" });
    try {
      const stateA = await openOwnerSession(a);
      const stateB = await openOwnerSession(b);
      expect(stateA.incident.id).not.toEqual(stateB.incident.id);
    } finally {
      await a.dispose();
      await b.dispose();
    }
  });
});

test.describe("API — witness reports and consent", () => {
  test("persists a typed witness report on the incident", async ({ request }) => {
    const owner = await openOwnerSession(request);
    const payload = {
      name: "Casey Nguyen",
      location: "South courtyard",
      text: "I smell smoke near the loading dock. I have not entered the building.",
      consent: "true",
    };
    const { state, report } = await submitTextReport(request, owner.incident.id, payload);
    expect(report.kind).toBe("text");
    expect(report.name).toBe(payload.name);
    expect(report.location).toBe(payload.location);
    expect(report.text).toBe(payload.text);
    expect(state.reports.some((r) => r.id === report.id)).toBeTruthy();
  });

  test("rejects witness submission without explicit consent", async ({ request }) => {
    const owner = await openOwnerSession(request);
    const response = await request.post("/api/reports", {
      multipart: {
        incidentId: owner.incident.id,
        name: "No Consent User",
        location: "Plaza",
        text: "Smoke visible.",
        consent: "false",
      },
    });
    expect(response.ok()).toBeFalsy();
    const body = (await response.json()) as { error?: string };
    expect(body.error).toBeTruthy();
  });
});

test.describe("API — coordinator note", () => {
  test("appends a coordinator note to brief history", async ({ request }) => {
    const owner = await openOwnerSession(request);
    const noteText = "Treat occupancy as unknown until verified by simulated arriving units.";
    const response = await request.post("/api/notes", {
      data: { incidentId: owner.incident.id, text: noteText },
    });
    expect(response.ok(), await response.text()).toBeTruthy();
    const { state } = (await response.json()) as { state: DemoState };
    const notes = state.brief.notes;
    expect(notes.length).toBeGreaterThanOrEqual(1);
    expect(notes.some((n) => n.text === noteText)).toBeTruthy();
  });
});

test.describe("API — volunteer approval and acceptance", () => {
  test("coordinator approves assignment; volunteer accepts with role token", async ({ playwright, request }) => {
    const owner = await openOwnerSession(request);
    const volunteer = availableVolunteer(owner);
    const task = "Bring supply kit to designated staging point";

    const approve = await request.post("/api/assignments", {
      data: { incidentId: owner.incident.id, volunteerId: volunteer.id, task },
    });
    expect(approve.ok(), await approve.text()).toBeTruthy();
    const approved = (await approve.json()) as { state: DemoState };
    const assignment = approved.state.assignments.find((a) => a.volunteerId === volunteer.id);
    expect(assignment?.status).toBe("approved");

    expect(owner.access?.volunteerToken).toBeTruthy();
    const volunteerCtx = await playwright.request.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000" });
    try {
      await openRoleSession(volunteerCtx, owner.incident.id, "volunteer", owner.access!.volunteerToken);
      const accept = await volunteerCtx.post(`/api/assignments/${assignment!.id}`, {
        data: {
          action: "accept",
          incidentId: owner.incident.id,
          access: owner.access!.volunteerToken,
        },
      });
      expect(accept.ok(), await accept.text()).toBeTruthy();
      const accepted = (await accept.json()) as { state: DemoState };
      const updated = accepted.state.assignments.find((a: Assignment) => a.id === assignment!.id);
      expect(updated?.status).toBe("accepted");
    } finally {
      await volunteerCtx.dispose();
    }
  });
});

test.describe("API — authorization", () => {
  test("rejects volunteer assignment approval from a witness session", async ({ playwright, request }) => {
    const owner = await openOwnerSession(request);
    const volunteer = availableVolunteer(owner);
    expect(owner.access?.witnessToken).toBeTruthy();

    const witnessCtx = await playwright.request.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000" });
    try {
      await openRoleSession(witnessCtx, owner.incident.id, "witness", owner.access!.witnessToken);
      const response = await witnessCtx.post("/api/assignments", {
        data: {
          incidentId: owner.incident.id,
          volunteerId: volunteer.id,
          task: "Unauthorized self-dispatch attempt",
        },
      });
      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBeGreaterThanOrEqual(401);
      const body = (await response.json()) as { error?: string };
      expect(body.error).toBeTruthy();
    } finally {
      await witnessCtx.dispose();
    }
  });
});

test.describe("API — media validation", () => {
  test("rejects unsupported photo upload types", async ({ request }) => {
    const owner = await openOwnerSession(request);
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><text y="20">not-a-photo</text></svg>',
      "utf8",
    );
    const response = await request.post("/api/reports", {
      multipart: {
        incidentId: owner.incident.id,
        name: "Media Tester",
        location: "West side",
        text: "Attached a file that should be rejected.",
        consent: "true",
        photo: {
          name: "evidence.svg",
          mimeType: "image/svg+xml",
          buffer: svg,
        },
      },
    });
    expect(response.ok()).toBeFalsy();
    const body = (await response.json()) as { error?: string };
    expect(body.error).toBeTruthy();
  });
});

test.describe("UI — readable headings without horizontal overflow", () => {
  test("landing page main heading stays within the viewport", async ({ page }) => {
    await page.goto("/");
    await assertMainHeadingReadable(page);
    await expect(page.getByText(/simulation|staged incident/i).first()).toBeVisible();
  });

  test("dashboard incident workspace heading is readable", async ({ page }) => {
    await openOwnerSession(page.request);
    await page.goto("/dashboard");
    await assertMainHeadingReadable(page);
    await expect(page.getByText(/staged|simulation/i).first()).toBeVisible();
  });

  test("witness report form uses contract fields and readable heading", async ({ page }) => {
    const owner = await openOwnerSession(page.request);
    await page.goto(`/report/${owner.incident.id}`);
    await assertMainHeadingReadable(page);
    await expect(page.locator('[name="name"]')).toBeVisible();
    await expect(page.locator('[name="location"]')).toBeVisible();
    await expect(page.locator('[name="text"]')).toBeVisible();
    await expect(page.locator('[name="consent"]')).toBeVisible();
  });

  test("volunteer view shows Accept and Decline only after coordinator approval", async ({ page }) => {
    const owner = await openOwnerSession(page.request);
    const volunteer = availableVolunteer(owner);
    const approve = await page.request.post("/api/assignments", {
      data: {
        incidentId: owner.incident.id,
        volunteerId: volunteer.id,
        task: "Language support at staging point",
      },
    });
    expect(approve.ok()).toBeTruthy();

    await page.goto(`/volunteer/${owner.incident.id}`);
    await assertMainHeadingReadable(page);
    await expect(page.getByRole("button", { name: /accept/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /decline/i })).toBeVisible();
  });

  test("witness form blocks submit until consent is checked", async ({ page }) => {
    const owner = await openOwnerSession(page.request);
    await page.goto(`/report/${owner.incident.id}`);
    await page.locator('[name="name"]').fill("Taylor Reed");
    await page.locator('[name="location"]').fill("North entrance");
    await page.locator('[name="text"]').fill("Smoke near the roofline; staying outside.");
    await page.locator('[name="consent"]').setChecked(false);
    const submit = page.getByRole("button", { name: /submit|send (report|observation)/i });
    await expect(submit).toBeVisible();
    await submit.click();
    await expect(page.getByText(/confirm the safety consent checkbox/i)).toBeVisible();
    const refresh = await page.request.get("/api/session");
    expect(refresh.ok()).toBeTruthy();
    const { state } = (await refresh.json()) as { state: DemoState };
    expect(state.incident.id).toBe(owner.incident.id);
    expect(state.reports.some((r) => r.name === "Taylor Reed")).toBeFalsy();
  });
});

test.describe("UI — review regressions", () => {
  test("320px owner views hydrate cleanly and keep controls within their panels", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    const owner = await openOwnerSession(page.request);
    const hydrationErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" && /hydrat|server rendered HTML/i.test(message.text())) hydrationErrors.push(message.text());
    });
    for (const path of ["/dashboard", `/report/${owner.incident.id}`, `/volunteer/${owner.incident.id}`]) {
      await page.goto(path);
      await expect(page.locator("main h1")).toBeVisible();
      if (path.includes("report")) await expect(page.getByRole("button", { name: /upload photo/i })).toBeVisible();
      const clipped = await page.locator("header button, main button").evaluateAll((buttons) => buttons.filter((button) => {
        const box = button.getBoundingClientRect();
        if (!box.width || !box.height) return false;
        const panel = button.closest(".card-light")?.getBoundingClientRect();
        return box.left < -1 || box.right > window.innerWidth + 1 || Boolean(panel && box.right > panel.right + 1);
      }).map((button) => button.textContent));
      expect(clipped, path).toEqual([]);
    }
    expect(hydrationErrors).toEqual([]);
  });

  test("volunteer portal offers Accept for a re-approval after an earlier decline", async ({ page }) => {
    const owner = await openOwnerSession(page.request);
    const volunteer = availableVolunteer(owner);
    const approve = (task: string) =>
      page.request.post("/api/assignments", { data: { incidentId: owner.incident.id, volunteerId: volunteer.id, task } });
    const first = await approve("Check-in desk at the staging point");
    expect(first.ok(), await first.text()).toBeTruthy();
    const firstId = ((await first.json()) as { state: DemoState }).state.assignments.find((a) => a.volunteerId === volunteer.id)!.id;
    const decline = await page.request.post(`/api/assignments/${firstId}`, {
      data: { action: "decline", incidentId: owner.incident.id, role: "volunteer" },
    });
    expect(decline.ok(), await decline.text()).toBeTruthy();
    const second = await approve("Supply runner at the staging point");
    expect(second.ok(), await second.text()).toBeTruthy();

    await page.goto(`/volunteer/${owner.incident.id}`);
    await page.getByRole("combobox", { name: /volunteer to view as/i }).selectOption(volunteer.id);
    await expect(page.getByText("Supply runner at the staging point")).toBeVisible();
    await page.getByRole("button", { name: /accept/i }).click();
    await expect(page.getByText(/assignment accepted/i)).toBeVisible();
  });

  test("shared witness link hides coordinator navigation, share links and workspace links", async ({ browser, request }) => {
    const owner = await openOwnerSession(request);
    const ctx = await browser.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000" });
    try {
      const page = await ctx.newPage();
      await page.goto(`/report/${owner.incident.id}?access=${owner.access!.witnessToken}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("button", { name: "Share links" })).toHaveCount(0);
      await expect(page.getByRole("navigation", { name: "Demo views" })).toHaveCount(0);
      await expect(page.getByRole("link", { name: /coordinator/i })).toHaveCount(0);
      // The photo picker is reachable without a mouse.
      await expect(page.getByRole("button", { name: /upload photo/i })).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test("dashboard shows the brief before the scene map and has no hidden horizontal overflow", async ({ page }) => {
    await openOwnerSession(page.request);
    await page.goto("/dashboard");
    const brief = page.getByText("SHARED INCIDENT BRIEF");
    await expect(brief).toBeVisible();
    const briefTop = (await brief.boundingBox())!.y;
    const mapTop = (await page.getByText("SCENE SCHEMATIC").boundingBox())!.y;
    expect(briefTop).toBeLessThan(mapTop);
    // html hides x-overflow, so check the body's real content width too.
    expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth + 2)).toBeTruthy();
    await page.getByRole("button", { name: /^show report W-01/i }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: /collapse report W-01/i })).toBeVisible();
  });
});

test.describe("UI — landing navigation contract", () => {
  test("primary Open demo path reaches the coordinator dashboard", async ({ page }) => {
    await page.goto("/");
    const openDemo = page.getByRole("link", { name: /open demo/i });
    await expect(openDemo).toBeVisible();
    await openDemo.click();
    await expect(page).toHaveURL(/\/dashboard/);
    await assertMainHeadingReadable(page);
  });
});
