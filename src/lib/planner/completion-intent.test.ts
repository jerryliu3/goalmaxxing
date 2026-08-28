import { describe, expect, it } from "vitest";
import {
  resolveChecklistCompletionIntent,
  resolveInsightsCompletionIntent,
  resolveTargetedRecurring,
} from "@/lib/planner/completion-intent";
import type { Goal } from "@/lib/goals/types";

const periodCadenceGoal = {
  id: "goal-1",
  frequency_type: "recurring",
  recurrence_interval: "weekly",
  target_count: 2,
  target_basis: "period",
  start_date: "2026-08-01",
} as Goal;

describe("completion intent", () => {
  it("routes period-cadence goals through exact-date semantics on every surface", () => {
    expect(resolveTargetedRecurring(periodCadenceGoal)).toBe(true);

    const checklist = resolveChecklistCompletionIntent({
      goal: periodCadenceGoal,
      completions: [],
      temporal: { selectedDate: "2026-08-12", asOfDate: "2026-08-25" },
    });
    const insights = resolveInsightsCompletionIntent({
      goal: periodCadenceGoal,
      completionDate: "2026-08-12",
      hasCompletionOnDate: false,
      temporal: { selectedDate: "2026-08-12", asOfDate: "2026-08-25" },
    });

    expect(checklist.decision.route).toBe("canonical_exact_date");
    expect(insights.decision.route).toBe("canonical_exact_date");
    expect(checklist.mutation.date).toBe("2026-08-12");
    expect(insights.mutation.date).toBe("2026-08-12");
  });

  it("routes non-target cadence goals through exact-date semantics", () => {
    const untargetedCadenceGoal = {
      id: "goal-2",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: null,
      start_date: "2026-08-01",
    } as Goal;

    const intent = resolveChecklistCompletionIntent({
      goal: untargetedCadenceGoal,
      completions: [],
      temporal: { selectedDate: "2026-08-12", asOfDate: "2026-08-25" },
    });

    expect(intent.decision.route).toBe("canonical_exact_date");
    expect(intent.mutation.date).toBe("2026-08-12");
  });
});
