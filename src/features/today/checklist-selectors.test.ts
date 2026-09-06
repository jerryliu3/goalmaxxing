import { describe, expect, it } from "vitest";
import {
  getRecurrenceGroup,
  groupGoalsByRecurrence,
  selectTargetAchievedGoalIds,
  selectFilteredTodayGoals,
} from "@/features/today/checklist-selectors";
import type { CompletionDateFact, Goal } from "@/lib/goals/types";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";

function goal(overrides: Partial<Goal> & Pick<Goal, "id" | "owner_id" | "title">): Goal {
  return {
    description: null,
    category: "health",
    color: null,
    frequency_type: "recurring",
    recurrence_interval: "daily",
    target_count: null,
    milestone_names: null,
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    photo_path: null,
    team_id: null,
    is_deleted: false,
    archived_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
    target_basis: overrides.target_basis ?? "period",
  };
}

describe("checklist selectors", () => {
  it("groups recurrence and filters today's matching goals", () => {
    const goals = [
      goal({ id: "daily", owner_id: "me", title: "Run", start_date: "2026-08-01" }),
      goal({
        id: "weekly",
        owner_id: "me",
        title: "Long run",
        recurrence_interval: "weekly",
        start_date: "2026-08-01",
      }),
      goal({
        id: "future",
        owner_id: "me",
        title: "Later",
        start_date: "2026-09-01",
      }),
    ];
    expect(getRecurrenceGroup(goals[1])).toBe("weekly");
    expect(
      groupGoalsByRecurrence(goals, "earliest_end").map((group) => group.key)
    ).toEqual(["daily", "weekly"]);
    expect(
      selectFilteredTodayGoals({
        activeGoals: goals,
        todayDate: "2026-08-13",
        categoryFilters: [],
        recurrenceFilters: [],
        searchQuery: "run",
        endMonths: [],
      }).map((row) => row.id)
    ).toEqual(["daily", "weekly"]);

    expect(
      selectFilteredTodayGoals({
        activeGoals: goals,
        todayDate: "2026-08-13",
        categoryFilters: [],
        recurrenceFilters: [],
        searchQuery: "run",
        endMonths: [],
        targetAchievedGoalIds: new Set(["daily"]),
        showTargetAchievedGoals: false,
      }).map((row) => row.id)
    ).toEqual(["weekly"]);
  });

  it("hides linked targets while their source is active on the viewed day", () => {
    const source = goal({
      id: "source-a",
      owner_id: "me",
      title: "Create videos",
      start_date: "2026-09-01",
      end_date: "2026-09-30",
    });
    const target = goal({
      id: "target-b",
      owner_id: "me",
      title: "Post videos",
      start_date: "2026-01-01",
      end_date: null,
    });

    expect(
      selectFilteredTodayGoals({
        activeGoals: [source, target],
        todayDate: "2026-09-04",
        categoryFilters: [],
        recurrenceFilters: [],
        searchQuery: "",
        endMonths: [],
        hiddenLinkedTargetGoalIds: new Set(["target-b"]),
      }).map((row) => row.id)
    ).toEqual(["source-a"]);
  });

  it("applies OR filtering for categories, cadence, and end months", () => {
    const goals = [
      goal({
        id: "health-daily",
        owner_id: "me",
        title: "Health daily",
        category: "health",
        category_key: "health",
        recurrence_interval: "daily",
        end_date: "2026-08-30",
      }),
      goal({
        id: "career-weekly",
        owner_id: "me",
        title: "Career weekly",
        category: "career",
        category_key: "career",
        recurrence_interval: "weekly",
        end_date: "2026-09-30",
      }),
      goal({
        id: "personal-monthly",
        owner_id: "me",
        title: "Personal monthly",
        category: "personal",
        category_key: "personal",
        recurrence_interval: "monthly",
        end_date: "2026-10-31",
      }),
    ];

    expect(
      selectFilteredTodayGoals({
        activeGoals: goals,
        todayDate: "2026-08-13",
        categoryFilters: ["health", "career"],
        recurrenceFilters: ["daily", "weekly"],
        searchQuery: "",
        endMonths: ["2026-08", "2026-09"],
      }).map((row) => row.id)
    ).toEqual(["health-daily", "career-weekly"]);
  });

  it("hides target-hit goals only when they were completed before the viewed day", () => {
    const goals = [
      goal({ id: "hit-today", owner_id: "me", title: "Hit today", start_date: "2026-08-01" }),
      goal({
        id: "hit-yesterday",
        owner_id: "me",
        title: "Hit yesterday",
        start_date: "2026-08-01",
      }),
    ];
    const targetAchievedGoalIds = selectTargetAchievedGoalIds({
      goals: [
        ...goals,
        goal({
          id: "hit-earlier-missing-facts",
          owner_id: "me",
          title: "Hit earlier",
          start_date: "2026-08-01",
        }),
      ],
      progressByGoal: new Map<string, ProgressContextSummary | undefined>([
        ["hit-today", { outcome: "achieved" } as ProgressContextSummary],
        ["hit-yesterday", { outcome: "achieved" } as ProgressContextSummary],
        [
          "hit-earlier-missing-facts",
          { outcome: "achieved" } as ProgressContextSummary,
        ],
      ]),
      completionsByGoal: new Map<string, CompletionDateFact[]>([
        ["hit-today", [{ completed_on: "2026-08-13", goal_id: "hit-today", source: "manual" }]],
        ["hit-yesterday", [{ completed_on: "2026-08-12", goal_id: "hit-yesterday", source: "manual" }]],
      ]),
      asOfDate: "2026-08-13",
    });

    expect([...targetAchievedGoalIds].sort()).toEqual([
      "hit-earlier-missing-facts",
      "hit-yesterday",
    ]);
    expect(
      selectFilteredTodayGoals({
        activeGoals: goals,
        todayDate: "2026-08-13",
        categoryFilters: [],
        recurrenceFilters: [],
        searchQuery: "",
        endMonths: [],
        targetAchievedGoalIds,
        showTargetAchievedGoals: false,
      }).map((row) => row.id)
    ).toEqual(["hit-today"]);
  });

  it("keeps lifetime goals visible before their actual achievement date", () => {
    const lifetimeGoal = goal({
      id: "lifetime-goal",
      owner_id: "me",
      title: "Lifetime target",
      recurrence_interval: "weekly",
      target_basis: "lifetime",
      target_count: 3,
      start_date: "2026-08-01",
    });
    const progressByGoal = new Map<string, ProgressContextSummary | undefined>([
      [
        "lifetime-goal",
        { outcome: "achieved", achievementDate: "2026-08-13" } as ProgressContextSummary,
      ],
    ]);

    expect(
      selectTargetAchievedGoalIds({
        goals: [lifetimeGoal],
        progressByGoal,
        completionsByGoal: new Map(),
        asOfDate: "2026-08-12",
      })
    ).toEqual(new Set());
    expect(
      selectTargetAchievedGoalIds({
        goals: [lifetimeGoal],
        progressByGoal,
        completionsByGoal: new Map(),
        asOfDate: "2026-08-14",
      })
    ).toEqual(new Set(["lifetime-goal"]));
  });

  it("hides period cadence goals after the achieved day", () => {
    const periodGoal = goal({
      id: "period-goal",
      owner_id: "me",
      title: "Weekly 2x",
      recurrence_interval: "weekly",
      target_basis: "period",
      target_count: 2,
      start_date: "2026-08-01",
    });

    const idsOnAchievedDay = selectTargetAchievedGoalIds({
      goals: [periodGoal],
      progressByGoal: new Map<string, ProgressContextSummary | undefined>([
        ["period-goal", { outcome: "in_progress" } as ProgressContextSummary],
      ]),
      completionsByGoal: new Map<string, CompletionDateFact[]>([
        [
          "period-goal",
          [
            { completed_on: "2026-08-12", goal_id: "period-goal", source: "manual" },
            { completed_on: "2026-08-13", goal_id: "period-goal", source: "manual" },
          ],
        ],
      ]),
      asOfDate: "2026-08-13",
    });
    expect([...idsOnAchievedDay]).toEqual([]);

    const idsAfterAchievedDay = selectTargetAchievedGoalIds({
      goals: [periodGoal],
      progressByGoal: new Map<string, ProgressContextSummary | undefined>([
        ["period-goal", { outcome: "in_progress" } as ProgressContextSummary],
      ]),
      completionsByGoal: new Map<string, CompletionDateFact[]>([
        [
          "period-goal",
          [
            { completed_on: "2026-08-12", goal_id: "period-goal", source: "manual" },
            { completed_on: "2026-08-13", goal_id: "period-goal", source: "manual" },
          ],
        ],
      ]),
      asOfDate: "2026-08-14",
    });
    expect([...idsAfterAchievedDay]).toEqual(["period-goal"]);
  });

  it("treats an empty period target as one completion for filter timing", () => {
    const periodGoal = goal({
      id: "period-goal-default-target",
      owner_id: "me",
      title: "Daily default target",
      target_basis: "period",
      target_count: null,
      start_date: "2026-08-01",
    });
    const completionsByGoal = new Map<string, CompletionDateFact[]>([
      [
        "period-goal-default-target",
        [
          {
            completed_on: "2026-08-13",
            goal_id: "period-goal-default-target",
            source: "manual",
          },
        ],
      ],
    ]);
    const progressByGoal = new Map<string, ProgressContextSummary | undefined>([
      [
        "period-goal-default-target",
        { outcome: "in_progress" } as ProgressContextSummary,
      ],
    ]);

    expect(
      selectTargetAchievedGoalIds({
        goals: [periodGoal],
        progressByGoal,
        completionsByGoal,
        asOfDate: "2026-08-13",
      })
    ).toEqual(new Set());
    expect(
      selectTargetAchievedGoalIds({
        goals: [periodGoal],
        progressByGoal,
        completionsByGoal,
        asOfDate: "2026-08-14",
      })
    ).toEqual(new Set(["period-goal-default-target"]));
  });
});
