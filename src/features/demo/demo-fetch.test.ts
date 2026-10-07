import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlannerWorkUnit } from "@cadence/shared/planner/context";
import { DEMO_ALEX_ID, DEMO_UNSUPPORTED_CODE } from "@/features/demo/demo-ids";
import { handleDemoFetch } from "@/features/demo/demo-fetch";
import { buildDemoSnapshot } from "@/features/demo/demo-snapshot";
import {
  clearDemoStore,
  initDemoStore,
  setCompletionFact,
} from "@/features/demo/demo-store";
import { planDraftMove } from "@/features/planner/plan-draft-move";
import { buildPlannerDayEntry } from "@/features/planner/test-fixtures";

describe("demo fetch router", () => {
  afterEach(() => {
    clearDemoStore();
  });

  it("serves planner context without calling through to the network", async () => {
    initDemoStore(buildDemoSnapshot("2026-08-22"));
    const originalFetch = vi.fn(() => {
      throw new Error("network should not be used");
    });

    const response = await handleDemoFetch(
      "/api/planner/context?scopeMonth=2026-08",
      { method: "GET" },
      originalFetch as unknown as typeof fetch
    );
    const payload = (await response.json()) as {
      goalTitles: Record<string, string>;
      activePlan: { goals: Array<{ title: string }> };
    };

    expect(originalFetch).not.toHaveBeenCalled();
    expect(response.ok).toBe(true);
    expect(payload.goalTitles).toMatchObject(
      expect.objectContaining({
        [Object.keys(payload.goalTitles)[0] ?? ""]: expect.any(String),
      })
    );
    expect(payload.activePlan.goals.some((goal) => goal.title === "Strength")).toBe(
      true
    );

    const progress = await handleDemoFetch(
      "/api/progress/context?asOfDate=2026-08-22&timezone=America%2FNew_York&viewDate=2026-08-22",
      { method: "GET" },
      originalFetch as unknown as typeof fetch
    );
    expect(progress.ok).toBe(true);
    expect(originalFetch).not.toHaveBeenCalled();
  });

  it("marks a goal achieved on the day it hits its target", async () => {
    initDemoStore(buildDemoSnapshot("2026-08-22"));
    setCompletionFact({
      goalId: "10000000-0000-4000-8000-000000000006",
      date: "2026-08-22",
      userId: DEMO_ALEX_ID,
      desiredFactState: "present",
    });
    const originalFetch = vi.fn();
    const progress = await handleDemoFetch(
      "/api/progress/context?asOfDate=2026-08-22&timezone=America%2FNew_York&viewDate=2026-08-22",
      { method: "GET" },
      originalFetch as unknown as typeof fetch
    );
    const payload = (await progress.json()) as {
      summaries: Array<{ goalId: string; outcome: string }>;
      facts: Array<{ goal_id: string; completed_on: string }>;
    };
    const conference = payload.summaries.find(
      (summary) => summary.goalId === "10000000-0000-4000-8000-000000000006"
    );

    expect(conference?.outcome).toBe("achieved");
    expect(
      payload.facts.some(
        (fact) =>
          fact.goal_id === "10000000-0000-4000-8000-000000000006" &&
          fact.completed_on === "2026-08-22"
      )
    ).toBe(true);
  });

  it("still treats a target hit before today as achieved", async () => {
    initDemoStore(buildDemoSnapshot("2026-08-22"));
    setCompletionFact({
      goalId: "10000000-0000-4000-8000-000000000006",
      date: "2026-08-21",
      userId: DEMO_ALEX_ID,
      desiredFactState: "present",
    });
    const originalFetch = vi.fn();
    const progress = await handleDemoFetch(
      "/api/progress/context?asOfDate=2026-08-22&timezone=America%2FNew_York",
      { method: "GET" },
      originalFetch as unknown as typeof fetch
    );
    const payload = (await progress.json()) as {
      summaries: Array<{ goalId: string; outcome: string }>;
    };
    expect(
      payload.summaries.find(
        (summary) => summary.goalId === "10000000-0000-4000-8000-000000000006"
      )?.outcome
    ).toBe("achieved");
  });

  it("gives uncredited demo sessions a movable window", async () => {
    initDemoStore(buildDemoSnapshot("2026-08-22"));
    const originalFetch = vi.fn();
    const response = await handleDemoFetch(
      "/api/planner/context?scopeMonth=2026-08",
      { method: "GET" },
      originalFetch as unknown as typeof fetch
    );
    const payload = (await response.json()) as {
      preview: { workUnits: PlannerWorkUnit[] };
    };
    const uncredited = payload.preview.workUnits.filter(
      (unit) => unit.creditState === "uncredited" && unit.scheduledDate
    );
    const credited = payload.preview.workUnits.filter(
      (unit) => unit.creditState !== "uncredited"
    );
    const asOfSession = uncredited.find((unit) => unit.scheduledDate === "2026-08-22");

    expect(uncredited.length).toBeGreaterThan(0);
    expect(credited.length).toBeGreaterThan(0);
    expect(
      uncredited.every(
        (unit) =>
          unit.draftMoveWindow != null &&
          unit.scheduledDate != null &&
          unit.scheduledDate >= unit.draftMoveWindow.start &&
          unit.scheduledDate <= unit.draftMoveWindow.end
      )
    ).toBe(true);
    expect(
      credited.every(
        (unit) => unit.draftMoveWindow == null && unit.placementWindow == null
      )
    ).toBe(true);
    expect(asOfSession).toBeDefined();
    expect(
      planDraftMove({
        entry: buildPlannerDayEntry({
          creditState: "uncredited",
        }),
        nextDate: "2026-08-23",
        scopeMonth: "2026-08",
        previewUnit: asOfSession,
        conflictKeys: undefined,
        completionFactConflict: undefined,
      })
    ).toEqual({ ok: true, scheduledDate: "2026-08-23" });
  });

  it("applies completion writes to the in-memory snapshot", async () => {
    initDemoStore(buildDemoSnapshot("2026-08-22"));
    const originalFetch = vi.fn();
    const response = await handleDemoFetch(
      "/api/completions",
      {
        method: "POST",
        body: JSON.stringify({
          goalId: "10000000-0000-4000-8000-000000000003",
          date: "2026-08-22",
          desiredFactState: "present",
          timezone: "America/New_York",
        }),
      },
      originalFetch as unknown as typeof fetch
    );
    const payload = (await response.json()) as { factState: string };
    const progress = await handleDemoFetch(
      "/api/progress/context?asOfDate=2026-08-22&timezone=America%2FNew_York&viewDate=2026-08-22",
      { method: "GET" },
      originalFetch as unknown as typeof fetch
    );
    const progressPayload = (await progress.json()) as {
      facts: Array<{ goal_id: string; completed_on: string }>;
    };

    expect(originalFetch).not.toHaveBeenCalled();
    expect(response.ok).toBe(true);
    expect(payload.factState).toBe("present");
    expect(
      progressPayload.facts.some(
        (fact) =>
          fact.goal_id === "10000000-0000-4000-8000-000000000003" &&
          fact.completed_on === "2026-08-22"
      )
    ).toBe(true);
  });

  it("applies calendar move commands on local save", async () => {
    initDemoStore(buildDemoSnapshot("2026-08-22"));
    const originalFetch = vi.fn();
    const context = await handleDemoFetch(
      "/api/planner/context?scopeMonth=2026-08",
      { method: "GET" },
      originalFetch as unknown as typeof fetch
    );
    const before = (await context.json()) as {
      activePlan: {
        items: Array<{
          id: string;
          unit_key: string;
          scheduled_date: string | null;
          plan_goal_id: string;
        }>;
      };
    };
    const strengthItem = before.activePlan.items.find(
      (item) =>
        item.plan_goal_id === "10000000-0000-4000-8000-000000000001" &&
        item.scheduled_date === "2026-08-15"
    );
    expect(strengthItem).toBeTruthy();

    const save = await handleDemoFetch(
      "/api/planner/save",
      {
        method: "POST",
        body: JSON.stringify({
          expectedDigest: "a".repeat(64),
          startDate: "2026-08-01",
          endDate: "2026-08-31",
          previewHash: "b".repeat(64),
          confirmationHash: null,
          draftCommands: [
            {
              id: "80000000-0000-4000-8000-000000000001",
              sequence: 0,
              kind: "move_item",
              goalId: strengthItem?.plan_goal_id,
              unitKey: strengthItem?.unit_key,
              scheduledDate: "2026-08-16",
              sourceDate: "2026-08-15",
            },
          ],
        }),
      },
      originalFetch as unknown as typeof fetch
    );
    expect(save.ok).toBe(true);

    const after = await handleDemoFetch(
      "/api/planner/context?scopeMonth=2026-08",
      { method: "GET" },
      originalFetch as unknown as typeof fetch
    );
    const afterPayload = (await after.json()) as {
      activePlan: { items: Array<{ id: string; scheduled_date: string | null }> };
    };
    expect(
      afterPayload.activePlan.items.find((item) => item.id === strengthItem?.id)
        ?.scheduled_date
    ).toBe("2026-08-16");
  });

  it("serves achievements showcase payload without calling through to the network", async () => {
    initDemoStore(buildDemoSnapshot("2026-08-22"));
    const originalFetch = vi.fn(() => {
      throw new Error("network should not be used");
    });

    const response = await handleDemoFetch(
      "/api/xp/achievements",
      { method: "GET" },
      originalFetch as unknown as typeof fetch
    );
    const payload = (await response.json()) as {
      schemaVersion: string;
      collection: { totalXp: number };
      personalRecords: Array<{ label: string }>;
    };

    expect(originalFetch).not.toHaveBeenCalled();
    expect(response.ok).toBe(true);
    expect(payload.schemaVersion).toBe("3");
    expect(payload.collection.totalXp).toBe(2460);
    expect(payload.personalRecords.map((record) => record.label)).toContain(
      "Best active week"
    );
  });

  it("serves Growth profile data entirely inside the demo sandbox", async () => {
    const snapshot = buildDemoSnapshot("2026-08-22");
    initDemoStore(snapshot);
    const network = vi.fn();
    const response = await handleDemoFetch(
      `/api/social/profiles/${snapshot.profiles[0].id}?year=2026`,
      { method: "GET" },
      network as unknown as typeof fetch
    );
    const body = await response.json();
    expect(response.ok).toBe(true);
    expect(body.item.xp.totalXp).toBe(2460);
    expect(body.item.yearHeatmap).toHaveLength(365);
    expect(network).not.toHaveBeenCalled();
  });

  it("keeps unsupported writes from pretending to succeed", async () => {
    initDemoStore(buildDemoSnapshot("2026-08-22"));
    const originalFetch = vi.fn();
    const response = await handleDemoFetch(
      "/api/goals",
      {
        method: "POST",
        body: JSON.stringify({ title: "New goal" }),
      },
      originalFetch as unknown as typeof fetch
    );
    const payload = (await response.json()) as { code: string };

    expect(originalFetch).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
    expect(payload.code).toBe(DEMO_UNSUPPORTED_CODE);
  });

  it("blocks supabase rest URLs without calling through", async () => {
    initDemoStore(buildDemoSnapshot("2026-08-22"));
    const originalFetch = vi.fn();
    const response = await handleDemoFetch(
      "https://example.supabase.co/rest/v1/goals",
      { method: "GET" },
      originalFetch as unknown as typeof fetch
    );

    expect(originalFetch).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});
