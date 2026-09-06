import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlanDayUnplannedPanel } from "@/features/planner/plan-day-unplanned-panel";

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

  it("keeps unplanned work hidden until Show unplanned is pressed", () => {
    render(
      <PlanDayUnplannedPanel day="2026-09-06" placedEntries={[]} />
    );

    expect(screen.getByRole("button", { name: "Show unplanned" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.queryByText("Nothing unplanned for this day.")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Show unplanned" }));

    expect(screen.getByRole("button", { name: "Show unplanned" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByText("Nothing unplanned for this day.")).toBeInTheDocument();
  });
});
