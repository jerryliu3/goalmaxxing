import { describe, expect, it } from "vitest";
import {
  placedGoalIdsForDay,
  selectUnplannedGoals,
  selectVisibleUnplannedGoals,
} from "@/features/planner/plan-day-unplanned";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import type { Goal } from "@/lib/goals/types";

function goal(overrides: Partial<Goal> & Pick<Goal, "id" | "title">): Goal {
  return {
    owner_id: "user-1",
    description: null,
    category: "Health",
    category_key: "health",
    color: null,
    frequency_type: "recurring",
    recurrence_interval: "daily",
    target_count: null,
    target_basis: "period",
    milestone_names: null,
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    photo_path: null,
    team_id: null,
    is_deleted: false,
    archived_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function entry(
  overrides: Partial<PlannerDayDetailEntry> & Pick<PlannerDayDetailEntry, "key" | "originalGoalId">
): PlannerDayDetailEntry {
  return {
    entryKind: "goal",
    goalTitle: "Placed",
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

describe("plan day unplanned selection", () => {
  it("collects placed goal ids and ignores task entries", () => {
    expect(
      placedGoalIdsForDay([
        entry({ key: "goal-a", originalGoalId: "goal-a" }),
        entry({
          key: "task:1",
          originalGoalId: "task-1",
          entryKind: "task",
        }),
      ])
    ).toEqual(new Set(["goal-a"]));
  });

  it("hides goals that already have a placed row for the day", () => {
    const unplanned = selectUnplannedGoals({
      viewDate: "2026-09-06",
      placedGoalIds: new Set(["goal-a"]),
      goals: [
        goal({ id: "goal-a", title: "Placed run" }),
        goal({ id: "goal-b", title: "Flexible walk" }),
      ],
    });

    expect(unplanned.map((item) => item.id)).toEqual(["goal-b"]);
  });

  it("counts only visible unplanned goals", () => {
    const goals = [
      goal({ id: "goal-a", title: "Placed run" }),
      goal({ id: "goal-b", title: "Flexible walk" }),
      goal({ id: "goal-c", title: "Hidden stretch" }),
    ];
    expect(
      selectVisibleUnplannedGoals({
        viewDate: "2026-09-06",
        placedGoalIds: new Set(["goal-a"]),
        visibleGoalIds: new Set(["goal-b"]),
        goals,
      }).map((item) => item.id)
    ).toEqual(["goal-b"]);
    expect(
      selectVisibleUnplannedGoals({
        viewDate: "2026-09-06",
        placedGoalIds: new Set(["goal-a"]),
        visibleGoalIds: null,
        goals,
      }).map((item) => item.id)
    ).toEqual(["goal-b", "goal-c"]);
  });
});
