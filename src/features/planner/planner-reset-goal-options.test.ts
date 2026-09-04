import { describe, expect, it } from "vitest";
import {
  buildPlannerResetGoalOptions,
  formatPlannerResetGoalSelectionLabel,
} from "@/features/planner/planner-reset-goal-options";
import type { PlannerActiveGoalSnapshot } from "@cadence/shared/planner/context";

function goal(
  overrides: Partial<PlannerActiveGoalSnapshot> = {}
): PlannerActiveGoalSnapshot {
  return {
    id: "plan-goal-1",
    goal_id: "goal-1",
    original_goal_id: "goal-1",
    requirement_fingerprint: "cadence:weekly",
    title: "Running",
    category: "fitness",
    color: null,
    ...overrides,
  };
}

describe("buildPlannerResetGoalOptions", () => {
  it("returns open active-plan goals sorted by title", () => {
    expect(
      buildPlannerResetGoalOptions(
        [
          goal({ original_goal_id: "goal-b", title: "Beta" }),
          goal({ original_goal_id: "goal-a", title: "Alpha", end_date: "2026-12-31" }),
          goal({ original_goal_id: "goal-c", title: "Closed", end_date: "2026-01-01" }),
        ],
        "2026-08-15"
      )
    ).toEqual([
      { goalId: "goal-a", title: "Alpha" },
      { goalId: "goal-b", title: "Beta" },
    ]);
  });
});

describe("formatPlannerResetGoalSelectionLabel", () => {
  it("formats multi-goal labels for confirmation copy", () => {
    expect(
      formatPlannerResetGoalSelectionLabel([
        { goalId: "goal-a", title: "Alpha" },
        { goalId: "goal-b", title: "Beta" },
      ])
    ).toBe("Alpha, Beta");
    expect(
      formatPlannerResetGoalSelectionLabel(
        Array.from({ length: 4 }, (_, index) => ({
          goalId: `goal-${index}`,
          title: `Goal ${index}`,
        }))
      )
    ).toBe("4 goals");
  });
});
