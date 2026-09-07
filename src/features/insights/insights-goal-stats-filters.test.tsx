import { useState } from "react";
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
      showEndedGoals={false}
      endedGoalCount={3}
      onShowEndedGoalsChange={vi.fn()}
      open={open}
      onOpenChange={vi.fn()}
    />
  );
}

describe("InsightsGoalStatsFilters", () => {
  afterEach(() => {
    cleanup();
  });
  it("keeps quick period controls visible and moves full controls into a sheet", () => {
    const onEndMonthsChange = vi.fn();
    const onViewModeChange = vi.fn();

    renderFilters({ onEndMonthsChange, onViewModeChange });

    expect(
      screen.getByTestId("insights-quick-filters")
    ).toHaveClass("flex", "overflow-x-auto");
    expect(
      screen.getByText("All End Months").closest("button")
    ).toHaveClass("h-8", "shrink-0", "rounded-full");
    expect(
      screen.getByText("All End Months").closest("button")
    ).toHaveClass("bg-primary");
    expect(
      screen.getByText("Next month").closest("button")
    ).toHaveClass("h-8", "shrink-0", "rounded-full");
    expect(screen.queryByText("Filters")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Next month"));
    expect(onEndMonthsChange).toHaveBeenCalledWith(["2026-09"]);

    fireEvent.click(screen.getByText("All End Months"));
    expect(onEndMonthsChange).toHaveBeenCalledWith([]);

    fireEvent.click(screen.getByText("Year view"));
    expect(onViewModeChange).toHaveBeenCalledWith("year");

    expect(
      screen.getByRole("heading", { name: "Insights filters" })
    ).toBeInTheDocument();
    expect(screen.getByText("Show past goals")).toBeInTheDocument();
    expect(screen.getByText("(3)")).toBeInTheDocument();
    expect(screen.queryByLabelText("Goal stats view mode")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Choose month and year")).not.toBeInTheDocument();
  });

  it("keeps end-month chips mutually exclusive and restores the default when cleared", () => {
    function Harness() {
      const [endMonths, setEndMonths] = useState<string[]>([]);
      return (
        <InsightsGoalStatsFilters
          goals={[]}
          referenceMonth="2026-08"
          endMonths={endMonths}
          onEndMonthsChange={setEndMonths}
          sort="earliest_end"
          onSortChange={vi.fn()}
          viewMode="month"
          onViewModeChange={vi.fn()}
          showEndedGoals={false}
          endedGoalCount={3}
          onShowEndedGoalsChange={vi.fn()}
          open={false}
          onOpenChange={vi.fn()}
        />
      );
    }

    render(<Harness />);

    const chips = within(screen.getByTestId("insights-quick-filters"));

    fireEvent.click(chips.getByText("This month"));
    expect(chips.getByText("This month").closest("button")).toHaveClass("bg-primary");
    expect(chips.getByText("All End Months").closest("button")).not.toHaveClass(
      "bg-primary"
    );

    fireEvent.click(chips.getByText("Next month"));
    expect(chips.getByText("Next month").closest("button")).toHaveClass("bg-primary");
    expect(chips.getByText("This month").closest("button")).not.toHaveClass(
      "bg-primary"
    );

    fireEvent.click(chips.getByText("Next month"));
    expect(chips.getByText("All End Months").closest("button")).toHaveClass(
      "bg-primary"
    );
    expect(chips.getByText("Next month").closest("button")).not.toHaveClass(
      "bg-primary"
    );
  });
});
