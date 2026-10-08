import { describe, expect, it } from "vitest";
import { selectChecklistListModel } from "@/features/today/checklist-list-model";
import { emptyTodayData } from "@/features/today/fetch-checklist-data";
import type { Goal } from "@/lib/goals/types";

function goal(overrides: Partial<Goal> & Pick<Goal, "id" | "title">): Goal {
  return {
    owner_id: "user-1",
    description: null,
    category: "Health",
    category_key: "health",
    color: null,
    frequency_type: "recurring",
    recurrence_interval: "daily",
    target_count: null,
    target_basis: "period",
    milestone_names: null,
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    photo_path: null,
    team_id: null,
    is_deleted: false,
    archived_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("selectChecklistListModel", () => {
  it("filters today's goals and the upcoming list by recurrence", () => {
    const model = selectChecklistListModel({
      data: {
        ...emptyTodayData,
        userId: "user-1",
        goals: [
          goal({ id: "daily", title: "Run" }),
          goal({
            id: "weekly",
            title: "Long run",
            recurrence_interval: "weekly",
          }),
          goal({
            id: "later",
            title: "Future block",
            start_date: "2026-10-01",
            recurrence_interval: "weekly",
          }),
          goal({
            id: "later-daily",
            title: "Future daily",
            start_date: "2026-10-01",
          }),
        ],
      },
      viewDate: "2026-09-06",
      todayLocalDate: "2026-09-06",
      categoryFilters: [],
      recurrenceFilters: ["weekly"],
      searchQuery: "",
      todayEndMonths: [],
      todaySort: "earliest_end",
      showTargetAchievedGoals: false,
      showSuppressedLinkedTargets: false,
    });

    expect([...model.filteredTodayGoalIds]).toEqual(["weekly"]);
    expect(model.upcoming.map((item) => item.id)).toEqual(["later"]);
  });

  it("applies the goal, category, and search filters to past and archived goals", () => {
    const model = selectChecklistListModel({
      data: {
        ...emptyTodayData,
        userId: "user-1",
        goals: [
          goal({ id: "guitar", title: "Guitar", category: "Music", category_key: "other" }),
          goal({ id: "run", title: "Run" }),
          goal({ id: "old-guitar", title: "Old guitar", category: "Music", category_key: "other", end_date: "2026-03-31" }),
          goal({ id: "old-run", title: "Old run", end_date: "2026-03-31" }),
          goal({ id: "shelved-guitar", title: "Shelved guitar", category: "Music", category_key: "other", archived_at: "2026-05-01T00:00:00.000Z" }),
          goal({ id: "shelved-scales", title: "Scales", category: "Music", category_key: "other", archived_at: "2026-05-01T00:00:00.000Z" }),
        ],
      },
      viewDate: "2026-09-06",
      todayLocalDate: "2026-09-06",
      categoryFilters: ["custom:music"],
      recurrenceFilters: [],
      goalIdFilters: ["guitar", "old-guitar", "shelved-guitar", "shelved-scales", "run"],
      searchQuery: "guitar",
      todayEndMonths: [],
      todaySort: "earliest_end",
      showTargetAchievedGoals: false,
      showSuppressedLinkedTargets: false,
    });

    expect([...model.filteredTodayGoalIds]).toEqual(["guitar"]);
    expect(model.pastGoals.map((item) => item.id)).toEqual(["old-guitar"]);
    expect(model.archivedGoals.map((item) => item.id)).toEqual(["shelved-guitar"]);
  });

  it("restores achieved milestones when showTargetAchievedGoals is on", () => {
    const milestone = goal({
      id: "milestone",
      title: "Ship the site",
      frequency_type: "fixed_milestones",
      recurrence_interval: null,
      target_count: 2,
      target_basis: "lifetime",
      end_date: null,
    });
    const data = {
      ...emptyTodayData,
      userId: "user-1",
      goals: [milestone],
      completions: [
        {
          goal_id: "milestone",
          completed_on: "2026-08-10",
          source: "manual" as const,
        },
        {
          goal_id: "milestone",
          completed_on: "2026-08-12",
          source: "manual" as const,
        },
      ],
      progress: {
        schemaVersion: "1" as const,
        asOfDate: "2026-08-13",
        timezone: "UTC",
        weekStartsOn: 1,
        summaries: [
          {
            goalId: "milestone",
            admissibleCompletionCount: 2,
            creditedUnitCount: 2,
            expectedUnitCount: 2,
            percent: 100,
            lifecycle: "active" as const,
            outcome: "achieved" as const,
            placementTerminal: false,
            achievementDate: "2026-08-12",
            periodSatisfied: false,
            currentPeriodCompletionCount: 0,
            currentPeriodTarget: null,
            closedPeriodHitRatePercent: null,
            currentStreak: 0,
            longestStreak: 0,
            milestoneDates: [],
          },
        ],
        facts: [],
        truncated: false as const,
        correlationId: "test",
      },
    };
    const hidden = selectChecklistListModel({
      data,
      viewDate: "2026-08-13",
      todayLocalDate: "2026-08-13",
      categoryFilters: [],
      recurrenceFilters: [],
      searchQuery: "",
      todayEndMonths: [],
      todaySort: "earliest_end",
      showTargetAchievedGoals: false,
      showSuppressedLinkedTargets: false,
    });
    const shown = selectChecklistListModel({
      data,
      viewDate: "2026-08-13",
      todayLocalDate: "2026-08-13",
      categoryFilters: [],
      recurrenceFilters: [],
      searchQuery: "",
      todayEndMonths: [],
      todaySort: "earliest_end",
      showTargetAchievedGoals: true,
      showSuppressedLinkedTargets: false,
    });

    expect([...hidden.filteredTodayGoalIds]).toEqual([]);
    expect([...hidden.targetAchievedGoalIds]).toEqual(["milestone"]);
    expect([...shown.filteredTodayGoalIds]).toEqual(["milestone"]);
  });
});
