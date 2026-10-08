import { describe, expect, it } from "vitest";
import {
  selectOverallCompletionPercent,
  selectProgressPeriodWindow,
  selectSearchedGoals,
  selectVisiblePerGoalHeatmaps,
  unionGoalsById,
} from "@/features/insights/insights-selectors";
import type { Goal } from "@/lib/goals/types";

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

describe("insights selectors", () => {
  it("filters goals by title search and overall completion average", () => {
    const goals = [
      goal({ id: "a", owner_id: "me", title: "Run" }),
      goal({ id: "b", owner_id: "me", title: "Read" }),
    ];
    expect(selectSearchedGoals(goals, " re ").map((row) => row.id)).toEqual(["b"]);
    expect(
      selectOverallCompletionPercent(goals, new Map([["a", { percent: 50 }], ["b", { percent: 100 }]]))
    ).toBe(75);
    expect(selectOverallCompletionPercent([], new Map())).toBe(0);
  });

  it("unions lane goals without duplicating shared ids", () => {
    const viewerGoals = [
      goal({ id: "shared", owner_id: "me", title: "Shared" }),
      goal({ id: "mine", owner_id: "me", title: "Mine" }),
    ];
    const partnerGoals = [
      goal({ id: "shared", owner_id: "partner", title: "Shared copy" }),
      goal({ id: "theirs", owner_id: "partner", title: "Theirs" }),
    ];
    expect(
      unionGoalsById([viewerGoals, partnerGoals]).map((row) => row.id)
    ).toEqual(["shared", "mine", "theirs"]);
  });

  it("uses inclusive overlap and excludes both past and future goals", () => {
    const ranges = [
      ["past", "2026-01-01", "2026-07-31"],
      ["future", "2026-09-01", "2026-12-31"],
      ["spans", "2026-01-01", "2026-12-31"],
      ["ends-at-start", "2026-07-01", "2026-08-01"],
      ["starts-at-end", "2026-08-31", "2026-10-01"],
      ["open", "2026-08-01", null],
      ["open-future", "2026-09-01", null],
    ] as const;
    const goals = ranges.map(([id, start_date, end_date]) =>
      goal({ id, owner_id: "me", title: id, start_date, end_date })
    );
    const visible = selectVisiblePerGoalHeatmaps({
      goals,
      visiblePeriodStart: "2026-08-01",
      visiblePeriodEnd: "2026-08-31",
      endMonths: [],
      sort: "earliest_end",
    });
    expect(visible.map((row) => row.id)).toEqual([
      "ends-at-start", "starts-at-end", "spans", "open",
    ]);
    expect(selectVisiblePerGoalHeatmaps({
      goals,
      visiblePeriodStart: "2026-08-01",
      visiblePeriodEnd: "2026-08-31",
      endMonths: ["2026-12"],
      sort: "earliest_end",
    }).map((row) => row.id)).toEqual(["spans"]);
  });

  it("derives month and year bounds including leap days", () => {
    expect(selectProgressPeriodWindow(new Date(2024, 1, 12), "month")).toEqual({
      start: "2024-02-01", end: "2024-02-29",
    });
    expect(selectProgressPeriodWindow(new Date(2024, 1, 12), "year")).toEqual({
      start: "2024-01-01", end: "2024-12-31",
    });
  });

  it("recomputes overlap when the displayed period changes", () => {
    const goals = [
      goal({ id: "august", owner_id: "me", title: "August", start_date: "2026-08-01", end_date: "2026-08-31" }),
      goal({ id: "september", owner_id: "me", title: "September", start_date: "2026-09-01", end_date: "2026-09-30" }),
    ];
    const visible = (cursor: Date, mode: "month" | "year") => {
      const window = selectProgressPeriodWindow(cursor, mode);
      return selectVisiblePerGoalHeatmaps({
        goals, visiblePeriodStart: window.start, visiblePeriodEnd: window.end,
        endMonths: [], sort: "earliest_end",
      }).map((row) => row.id);
    };
    expect(visible(new Date(2026, 7, 1), "month")).toEqual(["august"]);
    expect(visible(new Date(2026, 8, 1), "month")).toEqual(["september"]);
    expect(visible(new Date(2026, 8, 1), "year")).toEqual(["august", "september"]);
  });
});
