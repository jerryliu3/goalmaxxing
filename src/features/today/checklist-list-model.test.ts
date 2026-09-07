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
  it("filters today's goals by recurrence while keeping upcoming counts", () => {
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
});
