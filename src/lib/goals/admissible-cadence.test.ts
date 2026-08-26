import { describe, expect, it } from "vitest";
import type { Completion, Goal } from "@/lib/goals/types";
import {
  getCadenceHitRatePercent,
  getCreditedUnitCount,
  getCurrentPeriodCompletionCount,
  isCadencePeriodSatisfiedForCurrentPeriod,
} from "./admissible";

function buildGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-id",
    owner_id: "owner-id",
    title: "Goal",
    description: null,
    category: "Personal",
    color: null,
    frequency_type: "recurring",
    recurrence_interval: "weekly",
    target_count: 3,
    target_basis: "period",
    milestone_names: null,
    start_date: "2026-08-01",
    end_date: null,
    photo_path: null,
    team_id: null,
    is_deleted: false,
    archived_at: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

function completion(date: string, index = 0): Completion {
  return {
    id: `${date}-${index}`,
    goal_id: "goal-id",
    user_id: "owner-id",
    completed_on: date,
    source: "manual",
    created_at: `${date}T12:00:00Z`,
  };
}

describe("cadence per-period credit", () => {
  it("counts a period satisfied only after N distinct days", () => {
    const goal = buildGoal();
    const weekOne = [
      completion("2026-08-03"),
      completion("2026-08-04"),
      completion("2026-08-05"),
    ];

    expect(
      isCadencePeriodSatisfiedForCurrentPeriod(goal, weekOne, {
        asOfDate: "2026-08-05",
        weeklyAnchor: { weekStartsOn: 1 },
      })
    ).toBe(true);
    expect(
      getCurrentPeriodCompletionCount(goal, [completion("2026-08-03")], {
        asOfDate: "2026-08-05",
        weeklyAnchor: { weekStartsOn: 1 },
      })
    ).toBe(1);
  });

  it("uses closed-period hit rate for cadence progress", () => {
    const goal = buildGoal();
    const completions = [
      completion("2026-08-03"),
      completion("2026-08-04"),
      completion("2026-08-05"),
      completion("2026-08-10"),
      completion("2026-08-11"),
      completion("2026-08-12"),
    ];

    expect(
      getCadenceHitRatePercent(goal, completions, {
        asOfDate: "2026-08-17",
        weeklyAnchor: { weekStartsOn: 1 },
      })
    ).toBeCloseTo(66.7, 1);
    expect(
      getCreditedUnitCount(goal, completions, {
        asOfDate: "2026-08-17",
        weeklyAnchor: { weekStartsOn: 1 },
      })
    ).toBe(2);
  });
});
