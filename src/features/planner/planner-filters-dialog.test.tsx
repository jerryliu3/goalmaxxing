import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlannerFiltersDialog } from "@/features/planner/planner-filters-dialog";

describe("PlannerFiltersDialog", () => {
  afterEach(() => {
    cleanup();
  });
  it("defaults the tasks toggle off and reports changes immediately", () => {
    const onShowTasksInsteadOfGoalsChange = vi.fn();
    render(
      <PlannerFiltersDialog
        open
        onOpenChange={vi.fn()}
        showTasksInsteadOfGoals={false}
        onShowTasksInsteadOfGoalsChange={onShowTasksInsteadOfGoalsChange}
        categoryFilter="__all_categories__"
        onCategoryFilterChange={vi.fn()}
        categoryOptions={[]}
        endMonthFilter={null}
        onEndMonthFilterChange={vi.fn()}
        endMonthOptions={[]}
      />
    );

    const toggle = screen.getByRole("switch", {
      name: /show tasks instead of goals/i,
    });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Category")).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(onShowTasksInsteadOfGoalsChange).toHaveBeenCalledWith(true);
  });

  it("hides goal filters while tasks replace goals", () => {
    render(
      <PlannerFiltersDialog
        open
        onOpenChange={vi.fn()}
        showTasksInsteadOfGoals
        onShowTasksInsteadOfGoalsChange={vi.fn()}
        categoryFilter="__all_categories__"
        onCategoryFilterChange={vi.fn()}
        categoryOptions={[]}
        endMonthFilter={null}
        onEndMonthFilterChange={vi.fn()}
        endMonthOptions={[]}
      />
    );

    expect(
      screen.getByRole("switch", { name: /show tasks instead of goals/i })
    ).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByText("Category")).not.toBeInTheDocument();
  });

  it("disables the tasks toggle in read-only partner view", () => {
    render(
      <PlannerFiltersDialog
        open
        onOpenChange={vi.fn()}
        showTasksInsteadOfGoals={false}
        onShowTasksInsteadOfGoalsChange={vi.fn()}
        tasksToggleDisabled
        categoryFilter="__all_categories__"
        onCategoryFilterChange={vi.fn()}
        categoryOptions={[]}
        endMonthFilter={null}
        onEndMonthFilterChange={vi.fn()}
        endMonthOptions={[]}
      />
    );

    expect(
      screen.getByRole("switch", { name: /show tasks instead of goals/i })
    ).toBeDisabled();
  });
});
