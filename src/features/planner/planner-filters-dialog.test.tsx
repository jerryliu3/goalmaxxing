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
    expect(
      screen.getByRole("heading", { name: "Calendar filters" })
    ).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.queryByText("Recurrence")).not.toBeInTheDocument();

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

  it("shows checklist filter fields in day view", () => {
    render(
      <PlannerFiltersDialog
        open
        onOpenChange={vi.fn()}
        showTasksInsteadOfGoals={false}
        onShowTasksInsteadOfGoalsChange={vi.fn()}
        categoryFilter="__all_categories__"
        onCategoryFilterChange={vi.fn()}
        categoryOptions={[]}
        endMonthFilter={null}
        onEndMonthFilterChange={vi.fn()}
        endMonthOptions={[]}
        dayFilters={{
          categoryFilterOptions: [{ value: "health", label: "Health" }],
          categoryFilters: [],
          onCategoryFiltersChange: vi.fn(),
          recurrenceQuickFilters: [
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
          ],
          recurrenceFilters: [],
          onRecurrenceFiltersChange: vi.fn(),
          completableGoals: [],
          checklistFilterStartMonth: "2026-09",
          effectiveTodayEndMonths: [],
          onTodayEndMonthsChange: vi.fn(),
          todaySort: "earliest_end",
          onTodaySortChange: vi.fn(),
          visibilityOptions: [
            {
              label: "Show past goals",
              count: 2,
              checked: false,
              onChange: vi.fn(),
            },
            {
              label: "Show upcoming goals",
              count: 0,
              checked: false,
              onChange: vi.fn(),
            },
            {
              label: "Show archived goals",
              count: 0,
              checked: false,
              onChange: vi.fn(),
            },
            {
              label: "Show completed goals",
              count: 0,
              checked: false,
              onChange: vi.fn(),
            },
            {
              label: "Show suppressed linked goals",
              count: 0,
              checked: false,
              onChange: vi.fn(),
            },
          ],
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Day filters" })).toBeInTheDocument();
    expect(screen.getByText("Recurrence")).toBeInTheDocument();
    expect(screen.getByText("Show past goals")).toBeInTheDocument();
    expect(screen.getByText("Show upcoming goals")).toBeInTheDocument();
    expect(screen.getByText("Show archived goals")).toBeInTheDocument();
    expect(screen.getByText("Show completed goals")).toBeInTheDocument();
    expect(screen.getByText("Show suppressed linked goals")).toBeInTheDocument();
    expect(screen.getByText("(2)")).toBeInTheDocument();
  });
});
