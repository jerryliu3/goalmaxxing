import { describe, expect, it } from "vitest";
import {
  applyCalendarCompletionMarkerFilters,
  buildCalendarCategoryFilterOptions,
  entryMatchesCalendarSearchQuery,
  goalPassesCalendarFilters,
  normalizeCalendarSearchQuery,
} from "@/features/planner/calendar-filters";

describe("calendar filters", () => {
  it("builds sorted category options and trims category labels", () => {
    const options = buildCalendarCategoryFilterOptions(
      new Map([
        ["goal-a", { category: "  Personal  ", end_date: "2026-08-31" }],
        ["goal-b", { category: "Health", end_date: "2026-09-30" }],
        ["goal-c", { category: "Personal", end_date: null }],
      ])
    );

    expect(options).toEqual([
      { value: "Health", label: "Health" },
      { value: "Personal", label: "Personal" },
    ]);
  });

  it("matches by normalized category and ending month", () => {
    const goals = new Map([
      ["goal-a", { category: "  Personal  ", end_date: "2026-08-31" }],
    ]);

    expect(
      goalPassesCalendarFilters({
        goalId: "goal-a",
        goalsByOriginalId: goals,
        categoryFilters: ["Personal"],
        endMonthFilters: ["2026-08"],
      })
    ).toBe(true);
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
        categoryFilters: ["Personal", "Health"],
        endMonthFilters: [],
      })
    ).toBe(true);
    expect(
      goalPassesCalendarFilters({
        goalId: "goal-b",
        goalsByOriginalId: goals,
        categoryFilters: ["Personal", "Health"],
        endMonthFilters: [],
      })
    ).toBe(true);
    expect(
      goalPassesCalendarFilters({
        goalId: "goal-c",
        goalsByOriginalId: goals,
        categoryFilters: ["Personal", "Health"],
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
        categoryFilters: ["Personal"],
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
});
