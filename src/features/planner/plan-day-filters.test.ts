import { describe, expect, it } from "vitest";
import {
  filterPlannerDayEntries,
  filterPlannerDayMarkers,
} from "@/features/planner/plan-day-filters";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";

function entry(
  overrides: Partial<PlannerDayDetailEntry> &
    Pick<PlannerDayDetailEntry, "key" | "originalGoalId">
): PlannerDayDetailEntry {
  return {
    entryKind: "goal",
    goalTitle: "Goal",
    unitKey: "total:1",
    label: null,
    classification: "open",
    creditState: "uncredited",
    activeGoal: null,
    activeItem: null,
    draftDiffKind: null,
    draftDiffFromDate: null,
    draftDiffToDate: null,
    draftGhost: false,
    ...overrides,
  };
}

describe("plan day filters", () => {
  it("keeps every entry until checklist data is ready", () => {
    const entries = [
      entry({ key: "a", originalGoalId: "goal-a" }),
      entry({ key: "b", originalGoalId: "goal-b" }),
    ];
    expect(filterPlannerDayEntries(entries, null)).toEqual(entries);
  });

  it("hides planned goals that miss the checklist facet set and keeps tasks", () => {
    const entries = [
      entry({ key: "a", originalGoalId: "goal-a" }),
      entry({ key: "b", originalGoalId: "goal-b" }),
      entry({ key: "task", originalGoalId: "task-1", entryKind: "task" }),
    ];
    expect(
      filterPlannerDayEntries(entries, new Set(["goal-a"])).map((item) => item.key)
    ).toEqual(["a", "task"]);
  });

  it("keeps partner markers visible while filtering viewer markers", () => {
    const markers = filterPlannerDayMarkers(
      [
        {
          key: "viewer",
          originalGoalId: "goal-a",
          unitKey: "total:1",
          goalTitle: "Mine",
          scheduledDate: "2026-09-06",
          owner: "viewer",
        },
        {
          key: "partner",
          originalGoalId: "partner-goal",
          unitKey: "fact",
          goalTitle: "Theirs",
          scheduledDate: "2026-09-06",
          owner: "partner",
        },
      ],
      new Set()
    );

    expect(markers.map((marker) => marker.key)).toEqual(["partner"]);
  });
});
