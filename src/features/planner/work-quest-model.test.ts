import { describe, expect, it } from "vitest";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import {
  formatQuestSittingTime,
  projectWorkQuestModel,
} from "@/features/planner/work-quest-model";

describe("work quest model", () => {
  it("keeps minimized facts short and leaves rhythm on the expanded model", () => {
    const quest = projectWorkQuestModel({
      id: "tempo-run",
      title: "Tempo run",
      goal: buildGoal({
        id: "tempo-run",
        title: "Tempo run",
        description: "Easy outdoor miles",
        category: "Health",
        category_key: "health",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        target_count: 3,
        target_basis: "period",
        difficulty: "medium",
        end_date: "2026-12-31",
        default_local_time: "07:30",
        is_private: false,
      }),
      sittingTime: "07:30",
      completed: false,
      presentation: {
        exactDateCompleted: false,
        completionSourceForSelectedDate: null,
        periodCompletionCount: 1,
        periodTarget: 3,
        periodSatisfied: false,
        lifetimeCompletionCount: 1,
        lifetimeAchieved: false,
        isGreen: false,
        displayCompletionCount: 1,
        shouldHideWhenCompletedFilterOff: false,
      },
    });

    expect(quest.sittingLabel).toBe("7:30 AM");
    expect(quest.cadenceLabel).toBe("3 days a week");
    expect(quest.horizonLabel).toBe("Until Dec 31");
    expect(quest.effort).toEqual({ label: "steady", level: 2 });
    expect(quest.periodDone).toBe(1);
    expect(quest.periodTarget).toBe(3);
    expect(quest.periodScopeLabel).toBe("this week");
    expect(quest.contribution).toBe("Easy outdoor miles");
  });

  it("labels unplaced and open-ended work without inventing a time", () => {
    const quest = projectWorkQuestModel({
      id: "review",
      title: "Review offer",
      goal: buildGoal({
        id: "review",
        title: "Review offer",
        category: "Career",
        category_key: "career",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        target_count: 1,
        target_basis: "lifetime",
        difficulty: "hard",
        end_date: null,
        is_private: true,
      }),
      unplaced: true,
      completed: false,
    });

    expect(quest.sittingLabel).toBe("Unplaced");
    expect(quest.cadenceLabel).toBe("One sitting");
    expect(quest.horizonLabel).toBe("No end date");
    expect(quest.isPrivate).toBe(true);
    expect(quest.effort?.label).toBe("heavy");
  });

  it("formats planner local times for the card face", () => {
    expect(formatQuestSittingTime("07:30")).toBe("7:30 AM");
    expect(formatQuestSittingTime("18:05")).toBe("6:05 PM");
    expect(formatQuestSittingTime(null)).toBeNull();
  });
});
