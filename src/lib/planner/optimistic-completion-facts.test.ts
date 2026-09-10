import { describe, expect, it } from "vitest";
import type { ChecklistGoalPresentation } from "@/lib/goals/checklist-presentation";
import {
  applyOptimisticChecklistPresentations,
  optimisticCompletionFactKey,
  overlayCurrentlyCredited,
  parseOptimisticCompletionFactKey,
  pruneOptimisticCompletionFacts,
  withOptimisticCompletionFact,
  withoutOptimisticCompletionFact,
} from "@/lib/planner/optimistic-completion-facts";

function presentation(exactDateCompleted: boolean): ChecklistGoalPresentation {
  return {
    exactDateCompleted,
    completionSourceForSelectedDate: null,
    periodCompletionCount: null,
    periodTarget: null,
    periodSatisfied: false,
    lifetimeCompletionCount: 0,
    lifetimeAchieved: false,
    isGreen: false,
    displayCompletionCount: 0,
    shouldHideWhenCompletedFilterOff: false,
  };
}

describe("optimistic completion facts", () => {
  it("parses goal and date keys", () => {
    const key = optimisticCompletionFactKey("goal-1", "2026-09-10");
    expect(parseOptimisticCompletionFactKey(key)).toEqual({
      goalId: "goal-1",
      date: "2026-09-10",
    });
  });

  it("overlays credited state until canonical matches", () => {
    expect(overlayCurrentlyCredited(false, undefined, "g", "2026-09-10")).toBe(false);
    const overlay = withOptimisticCompletionFact(new Map(), "g", "2026-09-10", true);
    expect(overlayCurrentlyCredited(false, overlay, "g", "2026-09-10")).toBe(true);
    const pruned = pruneOptimisticCompletionFacts(overlay, (goalId, date) =>
      goalId === "g" && date === "2026-09-10"
    );
    expect(pruned.size).toBe(0);
    expect(withoutOptimisticCompletionFact(overlay, "g", "2026-09-10").size).toBe(0);
  });

  it("applies overlay to checklist presentations for the view date", () => {
    const byGoal = new Map([["g", presentation(false)]]);
    const overlay = withOptimisticCompletionFact(new Map(), "g", "2026-09-10", true);
    const next = applyOptimisticChecklistPresentations(byGoal, overlay, "2026-09-10");
    expect(next.get("g")?.exactDateCompleted).toBe(true);
    expect(applyOptimisticChecklistPresentations(byGoal, overlay, "2026-09-11")).toBe(
      byGoal
    );
  });
});
