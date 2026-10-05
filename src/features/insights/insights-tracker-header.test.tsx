import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InsightsTrackerHeader } from "@/features/insights/insights-tracker-header";

describe("InsightsTrackerHeader", () => {
  afterEach(() => {
    cleanup();
  });

  it("centers the period stepper and filter button between title columns", () => {
    render(
      <InsightsTrackerHeader
        goals={[]}
        monthCursor={new Date(2026, 7, 12)}
        onMonthCursorChange={vi.fn()}
        perGoalViewMode="month"
        onPerGoalViewModeChange={vi.fn()}
        goalSearchQuery=""
        onGoalSearchQueryChange={vi.fn()}
        goalEndMonths={[]}
        onGoalEndMonthsChange={vi.fn()}
        goalSort="earliest_end"
        onGoalSortChange={vi.fn()}
        showHistoricalGoals={false}
        onShowHistoricalGoalsChange={vi.fn()}
      />
    );

    const titleRow = screen.getByTestId("insights-tracker-header").querySelector(
      '[data-title-date-row="true"]'
    );
    expect(titleRow).toHaveClass("flex", "justify-center");
    expect(titleRow).toContainElement(
      screen.getByRole("button", { name: "Open progress filters" })
    );
    expect(screen.getByLabelText("Choose month and year")).toBeInTheDocument();
  });
});
