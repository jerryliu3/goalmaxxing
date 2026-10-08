import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InsightsGoalStatsFilters } from "./insights-goal-stats-filters";

function renderFilters({
  endMonths = [] as string[],
  onEndMonthsChange = vi.fn(),
  onViewModeChange = vi.fn(),
  open = true,
}: {
  endMonths?: string[];
  onEndMonthsChange?: (months: string[]) => void;
  onViewModeChange?: (mode: "month" | "year") => void;
  open?: boolean;
} = {}) {
  return render(
    <InsightsGoalStatsFilters
      goals={[]}
      referenceMonth="2026-08"
      endMonths={endMonths}
      onEndMonthsChange={onEndMonthsChange}
      sort="earliest_end"
      onSortChange={vi.fn()}
      viewMode="month"
      onViewModeChange={onViewModeChange}
      open={open}
      onOpenChange={vi.fn()}
    />
  );
}

describe("InsightsGoalStatsFilters", () => {
  afterEach(() => {
    cleanup();
  });
  it("keeps only the period switch outside the sheet", () => {
    const onViewModeChange = vi.fn();

    renderFilters({ onViewModeChange, open: false });

    expect(
      [...screen.getByTestId("insights-quick-filters").querySelectorAll("button")].map(
        (button) => button.textContent
      )
    ).toEqual(["Month", "Year"]);
    expect(screen.getByRole("group", { name: "Progress period" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Month" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("All end dates")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Year" }));
    expect(onViewModeChange).toHaveBeenCalledWith("year");
  });

  it("moves full controls into a sheet", () => {
    renderFilters();

    expect(
      screen.getByRole("heading", { name: "Progress filters" })
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Progress filters" })).not.toHaveClass(
      "overflow-visible"
    );
    expect(screen.queryByText("Show past goals")).not.toBeInTheDocument();
    expect(screen.getByText(/Only goals overlapping the displayed period appear/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Goal stats view mode")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Choose month and year")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Quick end dates" })).toBeNull();
  });
});
