import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PlannerEndMonthQuickFilterChips } from "@/features/planner/planner-end-month-quick-filter-chips";

describe("PlannerEndMonthQuickFilterChips", () => {
  it("selects end-month chips exclusively and clears with All End Dates", async () => {
    const user = userEvent.setup();
    const onEndMonthFiltersChange = vi.fn();

    render(
      <PlannerEndMonthQuickFilterChips
        referenceMonth="2026-08"
        endMonthFilters={[]}
        onEndMonthFiltersChange={onEndMonthFiltersChange}
      />
    );

    expect(
      [...screen.getAllByRole("button")].map((button) => button.textContent)
    ).toEqual(["All End Dates", "This month", "Next month", "Year end", "No end date"]);

    await user.click(screen.getByRole("button", { name: "No end date" }));
    expect(onEndMonthFiltersChange).toHaveBeenCalledWith(["none"]);

    onEndMonthFiltersChange.mockClear();
    await user.click(screen.getByRole("button", { name: "All End Dates" }));
    expect(onEndMonthFiltersChange).toHaveBeenCalledWith([]);
  });
});
