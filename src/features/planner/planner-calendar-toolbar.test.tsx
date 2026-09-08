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
    onSave: vi.fn(),
    onDiscardDraftChanges: vi.fn(),
    onViewModeChange: vi.fn(),
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

  it("offers Day, Week, and Month without a 3 Day option", () => {
    renderToolbar();

    const viewGroup = screen.getByRole("group", { name: "Plan view mode" });
    expect(
      within(viewGroup)
        .getAllByRole("button")
        .map((button) => button.textContent)
    ).toEqual(["Day", "Week", "Month"]);
    expect(within(viewGroup).getByRole("button", { name: "Week" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(within(viewGroup).queryByRole("button", { name: "3 Day" })).toBeNull();
    expect(screen.getByTestId("plan-view-mode-thumb")).toHaveStyle({
      transform: "translateX(100%)",
    });
  });

  it("slides the view-mode thumb to Month", () => {
    renderToolbar({ viewMode: "month" });

    expect(screen.getByTestId("plan-view-mode-thumb")).toHaveStyle({
      transform: "translateX(200%)",
    });
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
