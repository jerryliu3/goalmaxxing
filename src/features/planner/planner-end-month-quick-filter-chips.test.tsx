import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PlannerEndMonthQuickFilterChips } from "@/features/planner/planner-end-month-quick-filter-chips";

describe("PlannerEndMonthQuickFilterChips", () => {
  it("selects end-month chips exclusively and clears with All end dates", async () => {
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
    ).toEqual(["All end dates", "This month", "Next month", "Year end", "No end date"]);

    expect(screen.getByRole("button", { name: "All end dates" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "This month" })).toHaveAttribute("aria-pressed", "false");

    await user.click(screen.getByRole("button", { name: "No end date" }));
    expect(onEndMonthFiltersChange).toHaveBeenCalledWith(["none"]);

    onEndMonthFiltersChange.mockClear();
    await user.click(screen.getByRole("button", { name: "All end dates" }));
    expect(onEndMonthFiltersChange).toHaveBeenCalledWith([]);
  });
});
