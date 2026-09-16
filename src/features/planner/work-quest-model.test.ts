import { describe, expect, it } from "vitest";
import {
  formatQuestSittingDate,
  formatQuestSittingTime,
  projectPlannerEntryWorkQuest,
} from "@/features/planner/work-quest-model";
import type { ChecklistGoalPresentation } from "@/lib/goals/checklist-presentation";
import type { Goal } from "@/lib/goals/types";

const goal: Goal = {
  id: "tempo-run",
  owner_id: "user-1",
  title: "Tempo run",
  description: null,
  category: "Health",
  category_key: "health",
  color: "#22c55e",
  frequency_type: "recurring",
  recurrence_interval: "weekly",
  target_count: 3,
  target_basis: "period",
  milestone_names: null,
  start_date: "2026-08-01",
  end_date: "2026-12-31",
  photo_path: null,
  team_id: null,
  is_deleted: false,
  archived_at: null,
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
};

const presentation: ChecklistGoalPresentation = {
  exactDateCompleted: false,
  completionSourceForSelectedDate: null,
  periodCompletionCount: 2,
  periodTarget: 3,
  periodSatisfied: false,
  lifetimeCompletionCount: 8,
  lifetimeAchieved: false,
  isGreen: false,
  displayCompletionCount: 2,
  shouldHideWhenCompletedFilterOff: false,
};

describe("work quest model", () => {
  it("projects compact context and period progress for an expanded card", () => {
    const quest = projectPlannerEntryWorkQuest({
      entry: {
        key: "tempo-run:cadence:0",
        originalGoalId: "tempo-run",
        goalTitle: "Tempo run",
        label: "Easy outdoor miles",
        unitKey: "cadence:0",
        activeGoal: { category: "Health", color: "#22c55e" },
      },
      goal,
      presentation,
      completed: false,
    });

    expect(quest.id).toBe("tempo-run");
    expect(quest.title).toBe("Tempo run");
    expect(quest.categoryLabel).toBe("Health");
    expect(quest.color).toBe("#22c55e");
    expect(quest.cadenceLabel).toBe("3 days a week");
    expect(quest.deadlineLabel).toBe("Dec 31, 2026");
    expect(quest.progress).toEqual({
      completed: 2,
      target: 3,
      label: "2 of 3 this week",
    });
    expect(quest.completed).toBe(false);
  });

  it("uses milestone position for milestone progress", () => {
    const quest = projectPlannerEntryWorkQuest({
      entry: {
        key: "launch:milestone:2",
        originalGoalId: "launch",
        goalTitle: "Launch",
        label: "Ship beta",
        unitKey: "milestone:2",
        activeGoal: null,
      },
      goal: {
        ...goal,
        id: "launch",
        title: "Launch",
        frequency_type: "fixed_milestones",
        recurrence_interval: null,
        target_count: 4,
        milestone_names: ["Research", "Ship beta", "Launch", "Review"],
      },
      presentation: {
        ...presentation,
        periodCompletionCount: null,
        periodTarget: null,
        lifetimeCompletionCount: 1,
        displayCompletionCount: 1,
      },
      completed: false,
    });

    expect(quest.cadenceLabel).toBe("4 milestones");
    expect(quest.progress).toEqual({
      completed: 1,
      target: 4,
      label: "Milestone 2 of 4",
    });
  });

  it("describes total-basis cadence without inventing a rhythm", () => {
    const quest = projectPlannerEntryWorkQuest({
      entry: {
        key: "read:total:1",
        originalGoalId: "read",
        goalTitle: "Read the backlog",
        label: null,
        unitKey: "total:1",
        activeGoal: null,
      },
      goal: {
        ...goal,
        id: "read",
        title: "Read the backlog",
        target_basis: "lifetime",
        target_count: 12,
      },
      presentation: {
        ...presentation,
        periodCompletionCount: null,
        periodTarget: null,
        lifetimeCompletionCount: 5,
        displayCompletionCount: 5,
      },
      completed: false,
    });

    expect(quest.cadenceLabel).toBe("12 sessions in total");
    expect(quest.progress).toEqual({
      completed: 5,
      target: 12,
      label: "5 of 12 total",
    });
  });

  it("falls back to a neutral category when the entry has no active goal", () => {
    const quest = projectPlannerEntryWorkQuest({
      entry: {
        key: "review:cadence:0",
        originalGoalId: "review",
        goalTitle: "Review offer",
        label: null,
        unitKey: "cadence:0",
        activeGoal: null,
      },
      completed: true,
    });

    expect(quest.categoryLabel).toBe("Goal");
    expect(quest.cadenceLabel).toBeNull();
    expect(quest.deadlineLabel).toBe("No deadline");
    expect(quest.progress).toBeNull();
    expect(quest.completed).toBe(true);
  });

  it("formats planner local dates and times for the quest sentence", () => {
    expect(formatQuestSittingTime("07:30")).toBe("7:30 AM");
    expect(formatQuestSittingTime("18:05")).toBe("6:05 PM");
    expect(formatQuestSittingTime(null)).toBeNull();
    expect(formatQuestSittingDate("2026-08-31")).toBe("Mon, Aug 31");
    expect(formatQuestSittingDate(null)).toBeNull();
  });
});
