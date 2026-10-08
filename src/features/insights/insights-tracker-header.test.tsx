import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState, type ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InsightsTrackerHeader } from "@/features/insights/insights-tracker-header";

function renderHeader(overrides: Partial<ComponentProps<typeof InsightsTrackerHeader>> = {}) {
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
      {...overrides}
    />
  );
}

describe("InsightsTrackerHeader", () => {
  afterEach(() => {
    cleanup();
  });

  it("puts the period switch, stepper, and filter button on one row above search", () => {
    renderHeader();

    const titleRow = screen.getByTestId("insights-tracker-header").querySelector(
      '[data-title-date-row="true"]'
    );
    expect(titleRow).toHaveClass("flex", "justify-between");
    expect(titleRow).toContainElement(screen.getByRole("group", { name: "Progress period" }));
    expect(titleRow).toContainElement(screen.getByLabelText("Choose month and year"));
    expect(titleRow).toContainElement(screen.getByRole("button", { name: "Open progress filters" }));
    expect(titleRow).not.toContainElement(screen.getByRole("searchbox", { name: "Search goals" }));
    expect(screen.queryByTestId("progress-filters-active")).toBeNull();
  });

  it("marks the filter button while an end-date filter is on", () => {
    renderHeader({ goalEndMonths: ["2026-09"] });

    expect(
      screen.getByRole("button", { name: "Open progress filters (end date filter on)" })
    ).toContainElement(screen.getByTestId("progress-filters-active"));
  });

  it("keeps the quick end-date chips on the search row", () => {
    const onGoalEndMonthsChange = vi.fn();
    renderHeader({ onGoalEndMonthsChange });

    const searchRow = screen.getByTestId("insights-tracker-header").querySelector(
      '[data-search-row="true"]'
    );
    const chips = screen.getByRole("group", { name: "Quick end dates" });
    expect(searchRow).toContainElement(screen.getByRole("searchbox", { name: "Search goals" }));
    expect(searchRow).toContainElement(chips);
    expect(within(chips).getAllByRole("button").map((button) => button.textContent)).toEqual([
      "All end dates",
      "This month",
      "Next month",
      "Year end",
      "No end date",
    ]);

    fireEvent.click(within(chips).getByText("Next month"));
    expect(onGoalEndMonthsChange).toHaveBeenCalledWith(["2026-09"]);
  });

  it("keeps end-month chips mutually exclusive and restores the default when cleared", () => {
    function Harness() {
      const [endMonths, setEndMonths] = useState<string[]>([]);
      return (
        <InsightsTrackerHeader
          goals={[]}
          monthCursor={new Date(2026, 7, 12)}
          onMonthCursorChange={vi.fn()}
          perGoalViewMode="month"
          onPerGoalViewModeChange={vi.fn()}
          goalSearchQuery=""
          onGoalSearchQueryChange={vi.fn()}
          goalEndMonths={endMonths}
          onGoalEndMonthsChange={setEndMonths}
          goalSort="earliest_end"
          onGoalSortChange={vi.fn()}
        />
      );
    }
    render(<Harness />);
    const chips = within(screen.getByRole("group", { name: "Quick end dates" }));
    const pressed = (label: string) => chips.getByText(label).closest("button")?.getAttribute("aria-pressed");

    fireEvent.click(chips.getByText("This month"));
    expect(pressed("This month")).toBe("true");
    expect(pressed("All end dates")).toBe("false");
    fireEvent.click(chips.getByText("Next month"));
    expect(pressed("Next month")).toBe("true");
    expect(pressed("This month")).toBe("false");
    fireEvent.click(chips.getByText("Next month"));
    expect(pressed("All end dates")).toBe("true");
  });
});
