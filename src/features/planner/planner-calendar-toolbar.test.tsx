import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlannerCalendarToolbar } from "@/features/planner/planner-calendar-toolbar";

function renderToolbar(
  overrides?: Partial<ComponentProps<typeof PlannerCalendarToolbar>>
) {
  const props: ComponentProps<typeof PlannerCalendarToolbar> = {
    plannerReadOnly: false,
    loading: false,
    viewMode: "week",
    canOpenSettings: true,
    linkedTargetDetails: [],
    searchQuery: "",
    referenceMonth: "2026-08",
    endMonthFilters: [],
    onEndMonthFiltersChange: vi.fn(),
    onViewModeChange: vi.fn(),
    goalIdFilters: [],
    onGoalIdFiltersChange: vi.fn(),
    goalFilterOptions: [
      { value: "run", label: "Run a half marathon" },
      { value: "gym", label: "Get stronger" },
    ],
    goalViewOpen: false,
    onGoalViewOpenChange: vi.fn(),
    onOpenFilters: vi.fn(),
    onOpenSettings: vi.fn(),
    onSearchQueryChange: vi.fn(),
    ...overrides,
  };
  render(<PlannerCalendarToolbar {...props} />);
  return props;
}

describe("PlannerCalendarToolbar", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps search and the goal dropdown available in Day", () => {
    renderToolbar({ viewMode: "day" });
    expect(screen.getByRole("searchbox", { name: "Search goals" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter by goal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filters" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Goals" })).toBeNull();
  });
  it("offers Goal View, Day, Week, and Month without a 3 Day option", () => {
    renderToolbar();

    const viewGroup = screen.getByRole("group", { name: "Plan view mode" });
    expect(
      within(viewGroup)
        .getAllByRole("button")
        .map((button) => button.textContent)
    ).toEqual(["Day", "Week", "Month", "Goal View"]);
    expect(within(viewGroup).getByRole("button", { name: "Week" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(within(viewGroup).queryByRole("button", { name: "3 Day" })).toBeNull();
    // The current view takes the selection pair; primary stays for actions.
    expect(screen.getByTestId("plan-view-mode-thumb")).toHaveClass("bg-selection");
    expect(screen.getByTestId("plan-view-mode-thumb")).not.toHaveClass("bg-primary");
    expect(within(viewGroup).getByRole("button", { name: "Week" })).toHaveClass(
      "text-selection-foreground"
    );
  });

  it("slides the view-mode thumb to Month", () => {
    renderToolbar({ viewMode: "month" });

    expect(screen.getByTestId("plan-view-mode-thumb")).toHaveStyle({
      transform: "translateX(200%)",
    });
  });

  it("switches to the continuous Goal View and back to Today", () => {
    const props = renderToolbar({ goalViewOpen: true });
    const group = screen.getByRole("group", { name: "Plan view mode" });
    expect(within(group).getByRole("button", { name: "Goal View" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("plan-view-mode-thumb")).toHaveStyle({ transform: "translateX(300%)" });
    fireEvent.click(within(group).getByRole("button", { name: "Day" }));
    expect(props.onGoalViewOpenChange).toHaveBeenCalledWith(false);
    expect(props.onViewModeChange).toHaveBeenCalledWith("day");
  });

  it("puts the goals dropdown beside the search bar and reports selections", () => {
    const props = renderToolbar();
    const search = screen.getByRole("searchbox", { name: "Search goals" });
    const dropdown = screen.getByRole("button", { name: "Filter by goal" });
    expect(
      search.compareDocumentPosition(dropdown) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    fireEvent.click(dropdown);
    fireEvent.click(screen.getByRole("checkbox", { name: "Get stronger" }));
    expect(props.onGoalIdFiltersChange).toHaveBeenCalledWith(["gym"]);
  });

  it("hides the goals dropdown when there are no goal options", () => {
    renderToolbar({ goalFilterOptions: [] });
    expect(screen.queryByRole("button", { name: "Filter by goal" })).toBeNull();
  });

  it("opens Goal View without changing the calendar view mode", () => {
    const props = renderToolbar();
    fireEvent.click(screen.getByRole("button", { name: "Goal View" }));
    expect(props.onGoalViewOpenChange).toHaveBeenCalledWith(true);
    expect(props.onViewModeChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Preview" })).toBeNull();
  });

  it("places plan help beside the Plan title", () => {
    renderToolbar();

    const title = screen.getByRole("heading", { name: "Agenda" });
    const helpButton = screen.getByRole("button", { name: "Open planner help" });
    expect(title.parentElement).toContainElement(helpButton);
  });

  it("renders the status slot in the heading row, not save controls", () => {
    renderToolbar({ status: <button type="button">3 sessions slipped · Review</button> });

    const heading = screen.getByRole("heading", { name: "Agenda" });
    const status = screen.getByRole("button", { name: "3 sessions slipped · Review" });
    expect(
      heading.compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save plan" })).toBeNull();
    expect(screen.queryByTestId("planner-preview-mode-badge")).toBeNull();
  });

  it("shows hidden linked goals from the plan help dialog", async () => {
    renderToolbar({
      linkedTargetDetails: [
        {
          goalId: "goal-b",
          goalTitle: "Goal B",
          statusCopy: "hidden while linked subgoals are still active",
          sourceGoalTitles: ["Goal A"],
        },
      ],
    });

    fireEvent.click(screen.getByRole("button", { name: "Open planner help" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "See hidden goals" }));

    expect(
      within(dialog).getByText(
        /Goal B: hidden while linked subgoals are still active Linked source goals: Goal A\./i
      )
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Back to plan" })).toBeNull();
  });

  it("keeps plan help to the guide when nothing is hidden", async () => {
    renderToolbar();

    fireEvent.click(screen.getByRole("button", { name: "Open planner help" }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByText(/Save plan or Discard from the bar/)).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "See hidden goals" })).toBeNull();
  });
});
