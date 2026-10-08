import { describe, expect, it } from "vitest";
import {
  applyCalendarCompletionMarkerFilters,
  buildCalendarGoalFilterOptions,
  entryMatchesCalendarSearchQuery,
  goalPassesCalendarFilters,
  normalizeCalendarSearchQuery,
  shouldHideCompletedOnFutureCalendarDay,
} from "@/features/planner/calendar-filters";

describe("calendar filters", () => {
  it("limits goal filter choices by the other active calendar filters", () => {
    const goals = new Map([
      ["run", { category: "Health", end_date: "2026-08-31" }],
      ["read", { category: "Personal", end_date: "2026-09-30" }],
      ["write", { category: "Health", end_date: "2026-08-31" }],
    ]);
    expect(buildCalendarGoalFilterOptions(goals, { run: "Run", read: "Read", write: "Write" }, {
      categoryFilters: ["health"], endMonthFilters: ["2026-08"], searchQuery: "tempo",
      workUnits: [
        { originalGoalId: "run", label: "Easy miles", unitKey: "milestone:1" },
        { originalGoalId: "read", label: "Tempo reads", unitKey: "milestone:1" },
        { originalGoalId: "write", label: "Tempo run", unitKey: "milestone:1" },
      ],
    })).toEqual([{ value: "write", label: "Write" }]);
  });

  it("matches by normalized category and ending month", () => {
    const goals = new Map([
      ["goal-a", { category: "  Personal  ", end_date: "2026-08-31" }],
    ]);

    expect(
      goalPassesCalendarFilters({
        goalId: "goal-a",
        goalsByOriginalId: goals,
        categoryFilters: ["personal"],
        endMonthFilters: ["2026-08"],
      })
    ).toBe(true);
  });

  it("matches custom categories by label and legacy labels by key", () => {
    const goals = new Map([
      ["guitar", { category: " Music ", end_date: null }],
      ["call-mom", { category: "Relationships", end_date: null }],
    ]);
    const passes = (goalId: string, categoryFilters: string[]) =>
      goalPassesCalendarFilters({ goalId, goalsByOriginalId: goals, categoryFilters, endMonthFilters: [] });

    expect(passes("guitar", ["custom:music"])).toBe(true);
    expect(passes("guitar", ["other"])).toBe(false);
    expect(passes("call-mom", ["relationships"])).toBe(true);
  });

  it("matches selected categories and ending months with OR", () => {
    const goals = new Map([
      ["goal-a", { category: "Personal", end_date: "2026-08-31" }],
      ["goal-b", { category: "Health", end_date: "2026-09-30" }],
      ["goal-c", { category: "Career", end_date: "2026-10-31" }],
    ]);

    expect(
      goalPassesCalendarFilters({
        goalId: "goal-a",
        goalsByOriginalId: goals,
        categoryFilters: ["personal", "health"],
        endMonthFilters: [],
      })
    ).toBe(true);
    expect(
      goalPassesCalendarFilters({
        goalId: "goal-b",
        goalsByOriginalId: goals,
        categoryFilters: ["personal", "health"],
        endMonthFilters: [],
      })
    ).toBe(true);
    expect(
      goalPassesCalendarFilters({
        goalId: "goal-c",
        goalsByOriginalId: goals,
        categoryFilters: ["personal", "health"],
        endMonthFilters: [],
      })
    ).toBe(false);
    expect(
      goalPassesCalendarFilters({
        goalId: "goal-a",
        goalsByOriginalId: goals,
        categoryFilters: [],
        endMonthFilters: ["2026-08", "2026-09"],
      })
    ).toBe(true);
    expect(
      goalPassesCalendarFilters({
        goalId: "goal-c",
        goalsByOriginalId: goals,
        categoryFilters: [],
        endMonthFilters: ["2026-08", "2026-09"],
      })
    ).toBe(false);
  });

  it("matches goals with no end date when that chip is selected", () => {
    const goals = new Map([
      ["goal-a", { category: "Personal", end_date: "2026-08-31" }],
      ["goal-open", { category: "Health", end_date: null }],
    ]);

    expect(
      goalPassesCalendarFilters({
        goalId: "goal-open",
        goalsByOriginalId: goals,
        categoryFilters: [],
        endMonthFilters: ["none"],
      })
    ).toBe(true);
    expect(
      goalPassesCalendarFilters({
        goalId: "goal-a",
        goalsByOriginalId: goals,
        categoryFilters: [],
        endMonthFilters: ["none"],
      })
    ).toBe(false);
  });

  it("hides unknown goals when any filter is active", () => {
    const goals = new Map([
      ["goal-a", { category: "Personal", end_date: "2026-08-31" }],
    ]);

    expect(
      goalPassesCalendarFilters({
        goalId: "missing-goal",
        goalsByOriginalId: goals,
        categoryFilters: [],
        endMonthFilters: [],
      })
    ).toBe(true);
    expect(
      goalPassesCalendarFilters({
        goalId: "missing-goal",
        goalsByOriginalId: goals,
        categoryFilters: ["personal"],
        endMonthFilters: [],
      })
    ).toBe(false);
  });

  it("applies viewer filters to partner markers using partner goal metadata", () => {
    const markers = applyCalendarCompletionMarkerFilters({
      viewerMarkers: [
        {
          key: "viewer-marker",
          originalGoalId: "viewer-goal",
          unitKey: "total:1",
          goalTitle: "Viewer goal",
          scheduledDate: "2026-08-15",
          owner: "viewer",
        },
      ],
      partnerMarkers: [
        {
          key: "partner-marker",
          originalGoalId: "partner-goal",
          unitKey: "partner-fact",
          goalTitle: "Partner goal",
          goalCategory: "Personal",
          goalEndDate: "2026-08-31",
          scheduledDate: "2026-08-15",
          owner: "partner",
        },
      ],
      goalPassesFilters: (goalId, goal) =>
        goalId === "viewer-other-goal" ||
        (goal?.category === "Personal" && goal.end_date === "2026-08-31"),
    });

    expect(markers).toEqual([
      {
        key: "partner-marker",
        originalGoalId: "partner-goal",
        unitKey: "partner-fact",
        goalTitle: "Partner goal",
        goalCategory: "Personal",
        goalEndDate: "2026-08-31",
        scheduledDate: "2026-08-15",
        owner: "partner",
      },
    ]);
  });

  it("excludes partner markers when category or end-month metadata does not match", () => {
    const partnerMarker = {
      key: "partner-marker",
      originalGoalId: "partner-goal",
      unitKey: "partner-fact",
      goalTitle: "Partner goal",
      goalCategory: "Health",
      goalEndDate: "2026-09-30",
      scheduledDate: "2026-08-15",
      owner: "partner" as const,
    };

    expect(
      applyCalendarCompletionMarkerFilters({
        viewerMarkers: [],
        partnerMarkers: [partnerMarker],
        goalPassesFilters: (_goalId, goal) =>
          goal?.category === "Personal" && goal.end_date === "2026-08-31",
      })
    ).toEqual([]);
  });

  it("normalizes search query text for case-insensitive substring matching", () => {
    expect(normalizeCalendarSearchQuery("  Tempo Run  ")).toBe("tempo run");
  });

  it("matches goal title substrings case-insensitively", () => {
    expect(
      entryMatchesCalendarSearchQuery(
        {
          goalTitle: "Half Marathon Build",
          label: "Tempo run",
          unitKey: "milestone:2",
        },
        "marathon"
      )
    ).toBe(true);
  });

  it("matches milestone labels for milestone entries", () => {
    expect(
      entryMatchesCalendarSearchQuery(
        {
          goalTitle: "Half Marathon Build",
          label: "Tempo run 4x800",
          unitKey: "milestone:2",
        },
        "4x800"
      )
    ).toBe(true);
  });

  it("does not match non-milestone labels when goal title is present", () => {
    expect(
      entryMatchesCalendarSearchQuery(
        {
          goalTitle: "Hydration",
          label: "Drink two liters",
          unitKey: "total:1",
        },
        "drink"
      )
    ).toBe(false);
  });

  it("falls back to label matching when goal title is absent", () => {
    expect(
      entryMatchesCalendarSearchQuery(
        {
          goalTitle: null,
          label: "Strength session",
          unitKey: "total:1",
        },
        "strength"
      )
    ).toBe(true);
  });

  it("hides completed items on future days unless the filter is on", () => {
    expect(
      shouldHideCompletedOnFutureCalendarDay({
        day: "2026-08-20",
        calendarToday: "2026-08-15",
        showCompletedGoals: false,
      })
    ).toBe(true);
    expect(
      shouldHideCompletedOnFutureCalendarDay({
        day: "2026-08-15",
        calendarToday: "2026-08-15",
        showCompletedGoals: false,
      })
    ).toBe(false);
    expect(
      shouldHideCompletedOnFutureCalendarDay({
        day: "2026-08-20",
        calendarToday: "2026-08-15",
        showCompletedGoals: true,
      })
    ).toBe(false);
  });
});
