import { describe, expect, it } from "vitest";
import {
  buildCompletionFactMarkersByDate,
  buildEntriesByDate,
  resolveCalendarDayData,
} from "./calendar-entries";
import type {
  PlannerActiveGoalSnapshot,
  PlannerActiveItemSnapshot,
  PlannerWorkUnit,
} from "./calendar-surface.types";

function unit(scheduledDate: string): PlannerWorkUnit {
  return {
    originalGoalId: "goal-a",
    unitKey: "total:1",
    label: "Session",
    scheduledDate,
    classification: "open",
    creditState: "uncredited",
  };
}

function activeGoal(
  overrides: Partial<PlannerActiveGoalSnapshot> = {}
): PlannerActiveGoalSnapshot {
  return {
    id: "goal-a",
    goal_id: "goal-a",
    original_goal_id: "goal-a",
    requirement_fingerprint: "deadline_total:1",
    title: "Goal A",
    category: "fitness",
    color: null,
    ...overrides,
  };
}

function persistedItem(scheduledDate: string): PlannerActiveItemSnapshot {
  return {
    id: "item-a",
    plan_goal_id: "goal-a",
    unit_key: "total:1",
    requirement_kind: "deadline_total",
    scheduled_date: scheduledDate,
    original_scheduled_date: scheduledDate,
    locked: false,
    revision: 0,
  };
}

describe("planner calendar entries", () => {
  it("shows moved-from and moved-to markers for a persisted session", () => {
    const entriesByDate = buildEntriesByDate({
      workUnits: [unit("2026-08-07")],
      activeItems: [persistedItem("2026-08-05")],
      activeGoalsByPlanGoalId: new Map(),
      activeGoalsByOriginalGoalId: new Map(),
      goalTitles: { "goal-a": "Goal A" },
      draftItemEdits: {
        "goal-a:total:1": { scheduledDate: "2026-08-07" },
      },
      draftCommands: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          sequence: 1,
          kind: "move_item",
          goalId: "goal-a",
          unitKey: "total:1",
          sourceDate: "2026-08-05",
          scheduledDate: "2026-08-07",
        },
      ],
    });

    expect(entriesByDate.get("2026-08-05")?.[0]).toMatchObject({
      draftGhost: true,
      draftDiffKind: "moved_from",
    });
    expect(entriesByDate.get("2026-08-07")?.[0]).toMatchObject({
      draftGhost: false,
      draftDiffKind: "moved_to",
    });
  });

  it("never renders a preview-only session", () => {
    const entriesByDate = buildEntriesByDate({
      workUnits: [unit("2026-08-07")],
      activeItems: [],
      activeGoalsByPlanGoalId: new Map(),
      activeGoalsByOriginalGoalId: new Map(),
      goalTitles: { "goal-a": "Goal A" },
      draftItemEdits: {},
    });

    expect(entriesByDate.size).toBe(0);
  });

  it("renders credited archived sessions without persisted planner items", () => {
    const entriesByDate = buildEntriesByDate({
      workUnits: [
        {
          ...unit("2026-08-05"),
          creditedCompletionDate: "2026-08-05",
          creditState: "completed_as_scheduled",
        },
      ],
      activeItems: [],
      activeGoalsByPlanGoalId: new Map(),
      activeGoalsByOriginalGoalId: new Map(),
      goalTitles: { "goal-a": "Goal A" },
      draftItemEdits: {},
    });

    expect(entriesByDate.get("2026-08-05")).toHaveLength(1);
  });

  it("returns persisted entries and completion markers from one projection", () => {
    const marker = {
      key: "goal-a:total:1:2026-08-06",
      originalGoalId: "goal-a",
      unitKey: "total:1",
      goalTitle: "Goal A",
      scheduledDate: "2026-08-05",
    };
    const result = resolveCalendarDayData({
      day: "2026-08-06",
      entriesByDate: new Map(),
      completionFactMarkersByDate: new Map([["2026-08-06", [marker]]]),
    });

    expect(result.entries).toEqual([]);
    expect(result.completionFactMarkers).toEqual([marker]);
  });

  it("does not duplicate completion facts already displayed on their factual date", () => {
    const markers = buildCompletionFactMarkersByDate({
      workUnits: [
        {
          ...unit("2026-08-31"),
          creditedCompletionDate: "2026-09-01",
          creditState: "completed_elsewhere",
        },
      ],
      activeGoalsByOriginalGoalId: new Map(),
      goalTitles: { "goal-a": "Goal A" },
    });

    expect(markers.size).toBe(0);
  });

  it("skips completion markers when scheduled date is null", () => {
    const markers = buildCompletionFactMarkersByDate({
      workUnits: [
        {
          ...unit("2026-08-31"),
          scheduledDate: null,
          creditedCompletionDate: "2026-09-01",
          creditState: "completed_elsewhere",
        },
      ],
      activeGoalsByOriginalGoalId: new Map(),
      goalTitles: { "goal-a": "Goal A" },
    });

    expect(markers.size).toBe(0);
  });

  it("hides linked targets on suppressed dates", () => {
    const links = [
      {
        sourceGoalId: "source-a",
        targetGoalId: "target-b",
        targetSuppressionKind: "until" as const,
        targetResumesOn: "2026-10-01",
      },
    ];
    const entriesByDate = buildEntriesByDate({
      workUnits: [
        {
          originalGoalId: "target-b",
          unitKey: "milestone:21",
          label: "Post",
          scheduledDate: "2026-09-04",
          classification: "open",
          creditState: "uncredited",
        },
      ],
      activeItems: [
        {
          id: "item-target",
          plan_goal_id: "target-b",
          unit_key: "milestone:21",
          requirement_kind: "deadline_total",
          scheduled_date: "2026-10-01",
          original_scheduled_date: "2026-10-01",
          locked: false,
          revision: 0,
        },
      ],
      activeGoalsByPlanGoalId: new Map(),
      activeGoalsByOriginalGoalId: new Map(),
      goalTitles: { "target-b": "Post videos" },
      linkSummaries: links,
      draftItemEdits: {},
    });

    expect(entriesByDate.get("2026-09-04")).toBeUndefined();
    expect(entriesByDate.get("2026-10-01")?.[0]).toMatchObject({
      originalGoalId: "target-b",
      unitKey: "milestone:21",
      creditState: "uncredited",
    });
  });

  it("pins uncredited persisted sessions to their stored scheduled date", () => {
    const entriesByDate = buildEntriesByDate({
      workUnits: [
        {
          originalGoalId: "goal-a",
          unitKey: "total:1",
          label: "Session",
          scheduledDate: "2026-09-04",
          classification: "open",
          creditState: "uncredited",
        },
      ],
      activeItems: [persistedItem("2026-10-01")],
      activeGoalsByPlanGoalId: new Map([
        ["goal-a", activeGoal()],
      ]),
      activeGoalsByOriginalGoalId: new Map([
        ["goal-a", activeGoal()],
      ]),
      goalTitles: { "goal-a": "Goal A" },
      draftItemEdits: {},
    });

    expect(entriesByDate.get("2026-09-04")).toBeUndefined();
    expect(entriesByDate.get("2026-10-01")?.[0]).toMatchObject({
      originalGoalId: "goal-a",
      creditState: "uncredited",
    });
  });

  it("does not paint snapshot credit when a persisted item has no work unit", () => {
    const entriesByDate = buildEntriesByDate({
      workUnits: [],
      activeItems: [persistedItem("2026-10-01")],
      activeGoalsByPlanGoalId: new Map([
        ["goal-a", activeGoal()],
      ]),
      activeGoalsByOriginalGoalId: new Map(),
      goalTitles: { "goal-a": "Goal A" },
      draftItemEdits: {},
    });

    expect(entriesByDate.get("2026-10-01")?.[0]).toMatchObject({
      originalGoalId: "goal-a",
      classification: "open",
      creditState: "uncredited",
    });
  });
});
