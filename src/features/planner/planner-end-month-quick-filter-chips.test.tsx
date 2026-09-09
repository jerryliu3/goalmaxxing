import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PlannerEndMonthQuickFilterChips } from "@/features/planner/planner-end-month-quick-filter-chips";

describe("PlannerEndMonthQuickFilterChips", () => {
  it("selects end-month chips exclusively and clears with All", async () => {
    const user = userEvent.setup();
    const onEndMonthFiltersChange = vi.fn();

    render(
      <PlannerEndMonthQuickFilterChips
        referenceMonth="2026-08"
        endMonthFilters={[]}
        onEndMonthFiltersChange={onEndMonthFiltersChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "This month" }));
    expect(onEndMonthFiltersChange).toHaveBeenCalledWith(["2026-08"]);

    onEndMonthFiltersChange.mockClear();
    await user.click(screen.getByRole("button", { name: "All" }));
    expect(onEndMonthFiltersChange).toHaveBeenCalledWith([]);
  });
});
