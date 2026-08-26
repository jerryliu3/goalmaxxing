import { describe, expect, it } from "vitest";
import {
  resolveGoalTargetBasis,
  resolveGoalTargetBasisFromInput,
} from "@/lib/goals/target-basis";
import type { Goal } from "@/lib/goals/types";

function goal(
  recurrenceInterval: "daily" | "weekly" | "monthly",
  targetCount: number,
  targetBasis?: Goal["target_basis"]
): Goal {
  return {
    id: "goal-1",
    owner_id: "user-1",
    title: "Goal",
    description: null,
    category: "Personal",
    color: null,
    frequency_type: "recurring",
    recurrence_interval: recurrenceInterval,
    target_count: targetCount,
    target_basis: targetBasis,
    milestone_names: null,
    start_date: "2026-08-17",
    end_date: null,
    photo_path: null,
    team_id: null,
    is_deleted: false,
    archived_at: null,
    created_at: "2026-08-17T00:00:00.000Z",
    updated_at: "2026-08-17T00:00:00.000Z",
  };
}

describe("resolveGoalTargetBasis", () => {
  it("prefers stored target_basis over legacy inference", () => {
    expect(resolveGoalTargetBasis(goal("weekly", 8, "period"))).toBe("period");
    expect(resolveGoalTargetBasis(goal("daily", 2, "lifetime"))).toBe("lifetime");
  });

  it("uses recurrence-aware period thresholds for legacy goals without a basis", () => {
    const cases = [
      ["daily", 1, "period"],
      ["weekly", 7, "period"],
      ["monthly", 31, "period"],
      ["daily", 2, "lifetime"],
      ["weekly", 8, "lifetime"],
      ["monthly", 32, "lifetime"],
    ] as const;

    for (const [interval, targetCount, expected] of cases) {
      expect(resolveGoalTargetBasis(goal(interval, targetCount))).toBe(expected);
      expect(
        resolveGoalTargetBasisFromInput({
          frequencyType: "recurring",
          recurrenceInterval: interval,
          targetCount,
          targetBasis: null,
        }).basis
      ).toBe(expected);
    }
  });
});
