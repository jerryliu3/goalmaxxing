import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlannerFiltersDialog } from "@/features/planner/planner-filters-dialog";

describe("PlannerFiltersDialog", () => {
  afterEach(() => {
    cleanup();
  });
  it("defaults the tasks toggle off and reports changes immediately", () => {
    const onHideTasksChange = vi.fn();
    render(
      <PlannerFiltersDialog
        open
        onOpenChange={vi.fn()}
        hideTasks={false}
        onHideTasksChange={onHideTasksChange}
        categoryFilters={[]}
        onCategoryFiltersChange={vi.fn()}
        categoryOptions={[]}
        endMonthFilters={[]}
        onEndMonthFiltersChange={vi.fn()}
        endMonthOptions={[]}
      />
    );

    const toggle = screen.getByRole("checkbox", {
      name: /hide tasks/i,
    });
    expect(toggle).not.toBeChecked();
    expect(
      screen.getByRole("heading", { name: "Planner filters" })
    ).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.queryByText("Recurrence")).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(onHideTasksChange).toHaveBeenCalledWith(true);
  });

  it("keeps Goal View focused on goals", () => {
    render(
      <PlannerFiltersDialog open onOpenChange={vi.fn()}
        hideTasks={false} showTasksToggle={false}
        onHideTasksChange={vi.fn()}
        categoryFilters={[]} onCategoryFiltersChange={vi.fn()} categoryOptions={[]}
        endMonthFilters={[]} onEndMonthFiltersChange={vi.fn()} endMonthOptions={[]}
      />
    );
    expect(screen.queryByRole("checkbox", { name: "Hide tasks" })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Show completed goals" })).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("keeps goal filters when tasks are hidden", () => {
    render(
      <PlannerFiltersDialog
        open
        onOpenChange={vi.fn()}
        hideTasks
        onHideTasksChange={vi.fn()}
        categoryFilters={[]}
        onCategoryFiltersChange={vi.fn()}
        categoryOptions={[]}
        endMonthFilters={[]}
        onEndMonthFiltersChange={vi.fn()}
        endMonthOptions={[]}
      />
    );

    expect(
      screen.getByRole("checkbox", { name: /hide tasks/i })
    ).toBeChecked();
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("disables the tasks toggle in read-only partner view", () => {
    render(
      <PlannerFiltersDialog
        open
        onOpenChange={vi.fn()}
        hideTasks={false}
        onHideTasksChange={vi.fn()}
        tasksToggleDisabled
        categoryFilters={[]}
        onCategoryFiltersChange={vi.fn()}
        categoryOptions={[]}
        endMonthFilters={[]}
        onEndMonthFiltersChange={vi.fn()}
        endMonthOptions={[]}
      />
    );

    expect(
      screen.getByRole("checkbox", { name: /hide tasks/i })
    ).toBeDisabled();
  });

  it("shows checklist filter fields in day view", () => {
    render(
      <PlannerFiltersDialog
        open
        onOpenChange={vi.fn()}
        hideTasks={false}
        onHideTasksChange={vi.fn()}
        categoryFilters={[]}
        onCategoryFiltersChange={vi.fn()}
        categoryOptions={[]}
        endMonthFilters={[]}
        onEndMonthFiltersChange={vi.fn()}
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

  it("lets week and month filters select multiple categories and ending months", async () => {
    const onCategoryFiltersChange = vi.fn();
    const onEndMonthFiltersChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PlannerFiltersDialog
        open
        onOpenChange={vi.fn()}
        hideTasks={false}
        onHideTasksChange={vi.fn()}
        categoryFilters={["Health"]}
        onCategoryFiltersChange={onCategoryFiltersChange}
        categoryOptions={[
          { value: "Health", label: "Health" },
          { value: "Personal", label: "Personal" },
        ]}
        endMonthFilters={["2026-08"]}
        onEndMonthFiltersChange={onEndMonthFiltersChange}
        endMonthOptions={[
          { value: "2026-08", label: "August 2026" },
          { value: "2026-09", label: "September 2026" },
        ]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Category" }));
    await user.click(screen.getByRole("checkbox", { name: "Personal" }));
    expect(onCategoryFiltersChange).toHaveBeenCalledWith(["Health", "Personal"]);

    await user.click(screen.getByRole("button", { name: "Ending in" }));
    await user.click(screen.getByRole("checkbox", { name: "September 2026" }));
    expect(onEndMonthFiltersChange).toHaveBeenCalledWith(["2026-08", "2026-09"]);
  });

  it("lets week and month filters reveal completed future sessions", () => {
    const onShowCompletedGoalsChange = vi.fn();
    render(
      <PlannerFiltersDialog
        open
        onOpenChange={vi.fn()}
        hideTasks={false}
        onHideTasksChange={vi.fn()}
        categoryFilters={[]}
        onCategoryFiltersChange={vi.fn()}
        categoryOptions={[]}
        endMonthFilters={[]}
        onEndMonthFiltersChange={vi.fn()}
        endMonthOptions={[]}
        showCompletedGoals={false}
        onShowCompletedGoalsChange={onShowCompletedGoalsChange}
      />
    );

    const toggle = screen.getByRole("checkbox", { name: "Show completed goals" });
    expect(toggle).not.toBeChecked();
    expect(
      screen.getByText(/completed goals in the checklist and Goal View, including\s+milestones/i)
    ).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(onShowCompletedGoalsChange).toHaveBeenCalledWith(true);
  });
});
