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

  it("keeps unplanned work collapsed until Unplanned is expanded", () => {
    render(
      <PlanDayUnplannedPanel day="2026-09-06" placedEntries={[]} />
    );

    expect(screen.getByRole("button", { name: "Unplanned" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(screen.queryByText("Nothing unplanned for this day.")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Unplanned" }));

    expect(screen.getByRole("button", { name: "Unplanned" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByText("Nothing unplanned for this day.")).toBeInTheDocument();
  });
});
