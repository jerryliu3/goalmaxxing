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
      open={open}
      onOpenChange={vi.fn()}
    />
  );
}

describe("InsightsGoalStatsFilters", () => {
  afterEach(() => {
    cleanup();
  });
  it("keeps quick period controls visible outside the sheet", () => {
    const onEndMonthsChange = vi.fn();
    const onViewModeChange = vi.fn();

    renderFilters({ onEndMonthsChange, onViewModeChange, open: false });

    expect(
      screen.getByTestId("insights-quick-filters")
    ).toHaveClass("flex", "overflow-x-auto");
    expect(
      [...screen.getByTestId("insights-quick-filters").querySelectorAll("button")].map(
        (button) => button.textContent
      )
    ).toEqual([
      "Month",
      "Year",
      "All end dates",
      "This month",
      "Next month",
      "Year end",
      "No end date",
    ]);
    // Same chips and period switch as the planner: ink selection, no brand fill.
    expect(screen.getByRole("group", { name: "Progress period" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Month" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("All end dates").closest("button")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("All end dates").closest("button")).not.toHaveClass("bg-primary");
    expect(screen.getByText("Next month").closest("button")).toHaveClass("h-9", "shrink-0", "rounded-full");
    expect(screen.queryByText("Filters")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Next month"));
    expect(onEndMonthsChange).toHaveBeenCalledWith(["2026-09"]);

    fireEvent.click(screen.getByText("All end dates"));
    expect(onEndMonthsChange).toHaveBeenCalledWith([]);

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
          open={false}
          onOpenChange={vi.fn()}
        />
      );
    }

    render(<Harness />);

    const chips = within(screen.getByTestId("insights-quick-filters"));

    const pressed = (label: string) => chips.getByText(label).closest("button")?.getAttribute("aria-pressed");

    fireEvent.click(chips.getByText("This month"));
    expect(pressed("This month")).toBe("true");
    expect(pressed("All end dates")).toBe("false");

    fireEvent.click(chips.getByText("Next month"));
    expect(pressed("Next month")).toBe("true");
    expect(pressed("This month")).toBe("false");

    fireEvent.click(chips.getByText("Next month"));
    expect(pressed("All end dates")).toBe("true");
    expect(pressed("Next month")).toBe("false");
  });
});
