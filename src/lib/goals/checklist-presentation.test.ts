import { describe, expect, it } from "vitest";
import {
  projectChecklistGoalPresentation,
  shouldHideTargetAchievedGoal,
} from "@/lib/goals/checklist-presentation";
import { createChecklistTemporalContext } from "@/lib/goals/period-domain";
import type { CompletionDateFact, Goal } from "@/lib/goals/types";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    owner_id: "user-1",
    title: "Run",
    category: "Fitness",
    category_key: "fitness",
    color: "#000000",
    frequency_type: "recurring",
    recurrence_interval: "weekly",
    target_count: 2,
    target_basis: "period",
    start_date: "2026-08-01",
    end_date: null,
    difficulty: "medium",
    privacy: "private",
    is_deleted: false,
    created_at: "2026-08-01T00:00:00Z",
    ...overrides,
  } as Goal;
}

function fact(completedOn: string): CompletionDateFact {
  return {
    goal_id: "goal-1",
    completed_on: completedOn,
    source: "manual",
  };
}

describe("checklist presentation", () => {
  it("keeps exact-date checkbox independent from period green state", () => {
    const presentation = projectChecklistGoalPresentation({
      goal: goal(),
      completions: [fact("2026-08-12"), fact("2026-08-13")],
      progress: {
        goalId: "goal-1",
        outcome: "in_progress",
        admissibleCompletionCount: 2,
      } as ProgressContextSummary,
      temporal: createChecklistTemporalContext({
        selectedDate: "2026-08-12",
        asOfDate: "2026-08-25",
      }),
    });

    expect(presentation.exactDateCompleted).toBe(true);
    expect(presentation.periodCompletionCount).toBe(2);
    expect(presentation.periodSatisfied).toBe(true);
    expect(presentation.isGreen).toBe(true);
  });

  it("hides period goals after the achieved day has passed", () => {
    expect(
      shouldHideTargetAchievedGoal({
        goal: goal(),
        completions: [fact("2026-08-12"), fact("2026-08-13")],
        asOfDate: "2026-08-14",
      })
    ).toBe(true);
    expect(
      shouldHideTargetAchievedGoal({
        goal: goal(),
        completions: [fact("2026-08-12"), fact("2026-08-13")],
        asOfDate: "2026-08-13",
      })
    ).toBe(false);
  });

  it("resets period hiding in the next period", () => {
    expect(
      shouldHideTargetAchievedGoal({
        goal: goal(),
        completions: [fact("2026-08-19")],
        asOfDate: "2026-08-20",
      })
    ).toBe(false);
  });

  it("keeps achieved-day visible when selectedDate is the achievement day", () => {
    const presentation = projectChecklistGoalPresentation({
      goal: goal(),
      completions: [fact("2026-08-12"), fact("2026-08-13")],
      progress: {
        goalId: "goal-1",
        outcome: "achieved",
        admissibleCompletionCount: 2,
      } as ProgressContextSummary,
      temporal: createChecklistTemporalContext({
        selectedDate: "2026-08-13",
        asOfDate: "2026-08-25",
      }),
    });

    expect(presentation.shouldHideWhenCompletedFilterOff).toBe(false);
    expect(presentation.isGreen).toBe(true);
  });

  it("hides using selectedDate cutoff even when asOfDate diverges", () => {
    const presentation = projectChecklistGoalPresentation({
      goal: goal(),
      completions: [fact("2026-08-12"), fact("2026-08-13")],
      progress: {
        goalId: "goal-1",
        outcome: "achieved",
        admissibleCompletionCount: 2,
      } as ProgressContextSummary,
      temporal: createChecklistTemporalContext({
        selectedDate: "2026-08-14",
        asOfDate: "2026-08-13",
      }),
    });

    expect(presentation.shouldHideWhenCompletedFilterOff).toBe(true);
  });

  it("hides achieved milestones after the achievement date", () => {
    const milestone = goal({
      frequency_type: "fixed_milestones",
      recurrence_interval: null,
      target_count: 2,
      target_basis: "lifetime",
    });

    expect(
      shouldHideTargetAchievedGoal({
        goal: milestone,
        completions: [fact("2026-08-10"), fact("2026-08-12")],
        progress: {
          goalId: "goal-1",
          outcome: "achieved",
          achievementDate: "2026-08-12",
          admissibleCompletionCount: 2,
        } as ProgressContextSummary,
        asOfDate: "2026-08-13",
      })
    ).toBe(true);
    expect(
      shouldHideTargetAchievedGoal({
        goal: milestone,
        completions: [fact("2026-08-10"), fact("2026-08-12")],
        progress: {
          goalId: "goal-1",
          outcome: "achieved",
          achievementDate: "2026-08-12",
          admissibleCompletionCount: 2,
        } as ProgressContextSummary,
        asOfDate: "2026-08-12",
      })
    ).toBe(false);
  });
});
