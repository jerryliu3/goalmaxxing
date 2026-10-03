import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlannerCalendarToolbar } from "@/features/planner/planner-calendar-toolbar";

function renderToolbar(
  overrides?: Partial<ComponentProps<typeof PlannerCalendarToolbar>>
) {
  const props: ComponentProps<typeof PlannerCalendarToolbar> = {
    hasDraftSession: false,
    plannerReadOnly: false,
    canShowSaveAction: false,
    saveButtonLabel: "Save plan",
    draftSaveBlockedMessage: null,
    saveDisabled: false,
    undoDisabled: false,
    loading: false,
    viewMode: "week",
    canOpenSettings: true,
    linkedTargetDetails: [],
    searchQuery: "",
    referenceMonth: "2026-08",
    endMonthFilters: [],
    onEndMonthFiltersChange: vi.fn(),
    onSave: vi.fn(),
    onDiscardDraftChanges: vi.fn(),
    onViewModeChange: vi.fn(),
    goalIdFilters: [],
    onGoalIdFiltersChange: vi.fn(),
    goalFilterOptions: [
      { value: "run", label: "Run a half marathon" },
      { value: "gym", label: "Get stronger" },
    ],
    goalViewOpen: false,
    onGoalViewOpenChange: vi.fn(),
    onGoalViewPreview: vi.fn(),
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

  it("links from Plan directly to the current goal collection", () => {
    renderToolbar();
    expect(screen.getByRole("link", { name: "Goals" })).toHaveAttribute("href", "/insights/folios?view=current&from=plan");
  });

  it("offers Goal View, Day, Week, and Month without a 3 Day option", () => {
    renderToolbar();

    const viewGroup = screen.getByRole("group", { name: "Plan view mode" });
    expect(
      within(viewGroup)
        .getAllByRole("button")
        .map((button) => button.textContent)
    ).toEqual(["Goal View", "Day View", "Week View", "Month View"]);
    expect(within(viewGroup).getByRole("button", { name: "Week View" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(within(viewGroup).queryByRole("button", { name: "3 Day" })).toBeNull();
    expect(screen.getByTestId("plan-view-mode-thumb")).toHaveClass("bg-primary");
    expect(within(viewGroup).getByRole("button", { name: "Week View" })).toHaveClass(
      "text-primary-foreground"
    );
  });

  it("slides the view-mode thumb to Month", () => {
    renderToolbar({ viewMode: "month" });

    expect(screen.getByTestId("plan-view-mode-thumb")).toHaveStyle({
      transform: "translateX(300%)",
    });
  });

  it("selects Goal View as a lens and leaves it when a calendar view is chosen", () => {
    const props = renderToolbar({ goalViewOpen: true });
    const viewGroup = screen.getByRole("group", { name: "Plan view mode" });

    expect(within(viewGroup).getByRole("button", { name: "Goal View" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(within(viewGroup).getByRole("button", { name: "Week View" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.getByTestId("plan-view-mode-thumb")).toHaveStyle({
      transform: "translateX(0%)",
    });

    fireEvent.click(within(viewGroup).getByRole("button", { name: "Month View" }));
    expect(props.onGoalViewOpenChange).toHaveBeenCalledWith(false);
    expect(props.onViewModeChange).toHaveBeenCalledWith("month");
  });

  it("puts the goals dropdown beside the search bar and reports selections", () => {
    const props = renderToolbar();
    const search = screen.getByRole("searchbox", { name: "Search goals" });
    const dropdown = screen.getByRole("button", { name: "All goals" });
    expect(
      search.compareDocumentPosition(dropdown) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    fireEvent.click(dropdown);
    fireEvent.click(screen.getByRole("checkbox", { name: "Get stronger" }));
    expect(props.onGoalIdFiltersChange).toHaveBeenCalledWith(["gym"]);
  });

  it("hides the goals dropdown when there are no goal options", () => {
    renderToolbar({ goalFilterOptions: [] });
    expect(screen.queryByRole("button", { name: "All goals" })).toBeNull();
  });

  it("offers Preview beside Filters only while Goal View is open", () => {
    renderToolbar();
    expect(screen.queryByRole("button", { name: "Preview" })).toBeNull();
    cleanup();

    const props = renderToolbar({ goalViewOpen: true });
    const preview = screen.getByRole("button", { name: "Preview" });
    expect(preview.nextElementSibling).toBe(screen.getByRole("button", { name: "Filters" }));
    fireEvent.click(preview);
    expect(props.onGoalViewPreview).toHaveBeenCalledTimes(1);
  });

  it("opens Goal View from the view switch", () => {
    const props = renderToolbar();
    fireEvent.click(screen.getByRole("button", { name: "Goal View" }));
    expect(props.onGoalViewOpenChange).toHaveBeenCalledWith(true);
    expect(props.onViewModeChange).not.toHaveBeenCalled();
  });

  it("places plan help beside the Plan title", () => {
    renderToolbar();

    const title = screen.getByRole("heading", { name: "Planner" });
    const helpButton = screen.getByRole("button", { name: "Open planner help" });
    expect(title.parentElement).toContainElement(helpButton);
  });

  it("themes Planning Mode with secondary chrome instead of warning yellow", () => {
    renderToolbar({ hasDraftSession: true });

    const badge = screen.getByTestId("planner-preview-mode-badge");
    expect(badge).toHaveTextContent("Planning Mode");
    expect(badge).toHaveAttribute("data-variant", "secondary");
    expect(badge.className).not.toMatch(/warning/);
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
  });
});
