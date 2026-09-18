import { describe, expect, it } from "vitest";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import { summary } from "@/features/insights/folio/folio-test-fixtures";
import { goalCardProgress } from "./goal-card-progress";

describe("goal card progress", () => {
  it("uses credited lifetime units, never selected-period counts or raw facts", () => {
    const goal = buildGoal({ target_basis: "lifetime", target_count: 12 });
    const model = goalCardProgress(goal, summary(goal.id, { creditedUnitCount: 5, expectedUnitCount: 12, admissibleCompletionCount: 30, currentPeriodCompletionCount: 1, placementTerminal: false, lifecycle: "active", outcome: "in_progress" }));
    expect(model.assembly).toEqual({ completed: 5, target: 12 });
    expect(model.achieved).toBe(false);
  });
  it("uses milestone units and canonical achievement", () => {
    const goal = buildGoal({ frequency_type: "fixed_milestones", target_count: 3 });
    const model = goalCardProgress(goal, summary(goal.id, { creditedUnitCount: 3, expectedUnitCount: 3, outcome: "achieved" }));
    expect(model.label).toBe("3 / 3 milestones");
    expect(model.achieved).toBe(true);
  });
  it("does not award ongoing goals for a perfect hit rate", () => {
    const goal = buildGoal({ target_basis: "period", recurrence_interval: "weekly", target_count: 3 });
    const model = goalCardProgress(goal, summary(goal.id, { creditedUnitCount: 12, expectedUnitCount: 12, percent: 100, outcome: "in_progress", currentPeriodCompletionCount: 2, currentPeriodTarget: 3 }));
    expect(model.assembly).toBeUndefined();
    expect(model.achieved).toBe(false);
    expect(model.label).toBe("2 / 3 this week");
  });
});
