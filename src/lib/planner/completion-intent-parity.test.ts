import { describe, expect, it } from "vitest";
import { buildPlannerDayEntry } from "@/features/planner/test-fixtures";
import {
  resolveChecklistCompletionIntent,
  resolveInsightsCompletionIntent,
  resolvePlannerEntryCompletionIntent,
} from "@/lib/planner/completion-intent";
import type { Goal } from "@/lib/goals/types";

const temporal = { selectedDate: "2026-08-12", asOfDate: "2026-08-25" };

const periodCadenceGoal = {
  id: "goal-period",
  frequency_type: "recurring",
  recurrence_interval: "weekly",
  target_count: 2,
  target_basis: "period",
  start_date: "2026-08-01",
} as Goal;

const lifetimeGoal = {
  id: "goal-lifetime",
  frequency_type: "recurring",
  recurrence_interval: "daily",
  target_count: 10,
  target_basis: "lifetime",
  start_date: "2026-08-01",
} as Goal;

const milestoneGoal = {
  id: "goal-milestone",
  frequency_type: "fixed_milestones",
  target_count: 3,
  target_basis: "lifetime",
  start_date: "2026-08-01",
} as Goal;

describe("completion intent parity", () => {
  it.each([
    ["period cadence", periodCadenceGoal],
    ["lifetime recurring", lifetimeGoal],
    ["fixed milestones", milestoneGoal],
  ])("routes %s checklist and insights through exact-date semantics", (_label, goal) => {
    const checklist = resolveChecklistCompletionIntent({
      goal,
      completions: [],
      temporal,
    });
    const insights = resolveInsightsCompletionIntent({
      goal,
      completionDate: temporal.selectedDate,
      hasCompletionOnDate: false,
      temporal,
    });

    expect(checklist.decision.route).toBe("canonical_exact_date");
    expect(insights.decision.route).toBe("canonical_exact_date");
    expect(checklist.mutation.date).toBe(temporal.selectedDate);
    expect(insights.mutation.date).toBe(temporal.selectedDate);
  });

  it("routes on-plan planner cadence entries through item_date", () => {
    const planner = resolvePlannerEntryCompletionIntent({
      entry: buildPlannerDayEntry({
        unitKey: "cadence:2026-08:1",
        activeGoal: { id: "pg-1" } as never,
        activeItem: {
          id: "item-1",
          requirement_kind: "cadence",
        } as never,
      }),
      temporal,
      canMutatePlanItems: true,
    });

    expect(planner.decision.route).toBe("item_date");
    expect(planner.mutation.date).toBe(temporal.selectedDate);
  });
});
