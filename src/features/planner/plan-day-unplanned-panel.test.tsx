import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlanDayUnplannedPanel } from "@/features/planner/plan-day-unplanned-panel";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import type { PlanDayChecklistModel } from "@/features/planner/use-plan-day-checklist-model";

vi.mock("@/features/today/use-checklist-data", () => ({
  useChecklistData: () => ({
    data: {
      userId: "user-1",
      goals: [],
      completions: [],
      memberTeamIds: [],
      links: [],
      photoUrls: {},
      progress: null,
    },
    loading: false,
    loadData: vi.fn(),
    redirectToLogin: vi.fn(),
    todayLocalDate: "2026-09-06",
  }),
}));

vi.mock("@/features/today/use-checklist-completion-actions", () => ({
  useChecklistCompletionActions: () => ({
    savingGoalId: null,
    recentlyCompletedGoalId: null,
    toggleCompletion: vi.fn(),
  }),
}));

describe("PlanDayUnplannedPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows active goals that are not already planned for the day", () => {
    render(
      <PlanDayUnplannedPanel day="2026-09-06" placedEntries={[]} />
    );

    expect(screen.getByText("Nothing unplanned for this day.")).toBeInTheDocument();
  });

  it("hides the completion checkbox for unplanned goals on a future day", () => {
    const goal = buildGoal({ id: "goal-run", title: "Run" });
    render(
      <PlanDayUnplannedPanel
        day="2026-09-10"
        placedEntries={[]}
        checklist={
          {
            loading: false,
            todayLocalDate: "2026-09-06",
            visibleGoalIds: null,
            data: { goals: [goal] },
            listModel: {
              completableGoals: [goal],
              presentationByGoalId: new Map([
                ["goal-run", { exactDateCompleted: false }],
              ]),
            },
            savingGoalId: null,
            toggleCompletion: vi.fn(),
          } as unknown as PlanDayChecklistModel
        }
      />
    );

    expect(screen.getByText("Run")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /mark run done/i })
    ).not.toBeInTheDocument();
  });
});
