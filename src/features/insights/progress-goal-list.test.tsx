import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProgressGoalList, type ProgressGoalListItem } from "@/features/insights/progress-goal-list";

const GOALS: ProgressGoalListItem[] = [
  { id: "run", title: "Tempo run", color: "#22c55e", rateLabel: "8/12 completions", progress: 8 / 12 },
  { id: "lift", title: "Lift", color: "#0ea5e9", rateLabel: "4 completions", progress: null },
];

describe("ProgressGoalList", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows selection as a filled check in the goal's color", async () => {
    const onToggleGoal = vi.fn();
    const user = userEvent.setup();
    render(
      <ProgressGoalList goals={GOALS} selectedGoalIds={new Set(["run"])} onToggleGoal={onToggleGoal} />
    );

    const run = screen.getByRole("button", { name: /Tempo run/ });
    const lift = screen.getByRole("button", { name: /Lift/ });
    expect(run).toHaveAttribute("aria-pressed", "true");
    expect(lift).toHaveAttribute("aria-pressed", "false");
    expect(run.querySelector("[data-goal-check]")).toHaveClass("bg-(--goal-color)");
    expect(run.querySelector("[data-goal-check] svg")).not.toBeNull();
    expect(lift.querySelector("[data-goal-check]")).toHaveClass("bg-transparent");
    // Rows are plain, not filled pills.
    expect(run).not.toHaveClass("bg-muted");
    await user.click(lift);
    expect(onToggleGoal).toHaveBeenCalledWith("lift");
  });

  it("keeps full titles reachable and draws progress only for goals with a target", () => {
    render(<ProgressGoalList goals={GOALS} selectedGoalIds={new Set(["run", "lift"])} onToggleGoal={() => {}} />);

    const run = screen.getByRole("button", { name: /Tempo run/ });
    expect(run).toHaveAttribute("title", "Tempo run");
    expect(within(run).getByText("8/12 completions")).toBeVisible();
    expect(run.querySelector<HTMLElement>("[data-goal-progress]")?.style.width).toBe("67%");
    expect(screen.getByRole("button", { name: /Lift/ }).querySelector("[data-goal-progress]")).toBeNull();
  });

  it("offers Select all / Clear all and counts the selection", async () => {
    const onSelectAll = vi.fn();
    const onClearAll = vi.fn();
    const user = userEvent.setup();
    render(
      <ProgressGoalList
        goals={GOALS}
        selectedGoalIds={new Set(["run"])}
        onToggleGoal={() => {}}
        onSelectAll={onSelectAll}
        onClearAll={onClearAll}
      />
    );

    expect(screen.getByRole("heading", { name: "Selected goals (1)" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Select all" }));
    expect(onSelectAll).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(onClearAll).toHaveBeenCalled();
  });

  it("collapses a long list behind Show all", async () => {
    const user = userEvent.setup();
    const goals = Array.from({ length: 12 }, (_, index) => ({
      id: `goal-${index}`, title: `Goal ${index + 1}`, color: "#22c55e", rateLabel: "1 completion",
    }));
    render(<ProgressGoalList goals={goals} selectedGoalIds={new Set()} onToggleGoal={() => {}} />);

    const list = screen.getByTestId("progress-goal-list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(8);
    await user.click(screen.getByRole("button", { name: "Show all 12 goals" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(12);
    await user.click(screen.getByRole("button", { name: "Show fewer" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(8);
  });

  it("isolates one goal from the Only control", async () => {
    const onSelectOnly = vi.fn();
    const user = userEvent.setup();
    render(
      <ProgressGoalList
        goals={GOALS}
        selectedGoalIds={new Set(["run", "lift"])}
        onToggleGoal={() => {}}
        onSelectOnly={onSelectOnly}
      />
    );

    const only = screen.getAllByRole("button", { name: "Only" })[0];
    await user.click(only);
    expect(onSelectOnly).toHaveBeenCalledWith("run");
    expect(only).not.toHaveFocus();
  });
});
