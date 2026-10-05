import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProgressGoalList } from "@/features/insights/progress-goal-list";

describe("ProgressGoalList", () => {
  afterEach(() => {
    cleanup();
  });
  it("toggles selected goals and marks the pressed state", async () => {
    const onToggleGoal = vi.fn();
    const user = userEvent.setup();
    render(
      <ProgressGoalList
        goals={[
          { id: "run", title: "Tempo run", color: "#22c55e", rateLabel: "8 of 12" },
          { id: "lift", title: "Lift", color: "#0ea5e9", rateLabel: "unplaced" },
        ]}
        selectedGoalIds={new Set(["run", "lift"])}
        onToggleGoal={onToggleGoal}
      />
    );

    const tempo = screen.getByRole("button", { name: /Tempo run/ });
    expect(tempo).toHaveAttribute("aria-pressed", "true");
    expect(tempo).toHaveClass("bg-muted");
    expect(tempo).not.toHaveClass("bg-primary/15");
    await user.click(screen.getByRole("button", { name: /Lift/ }));
    expect(onToggleGoal).toHaveBeenCalledWith("lift");
  });

  it("uses a two-row scrolling grid on small widths and Select all / Clear all", async () => {
    const onSelectAll = vi.fn();
    const onClearAll = vi.fn();
    const user = userEvent.setup();
    render(
      <ProgressGoalList
        goals={[
          { id: "run", title: "Tempo run", color: "#22c55e", rateLabel: "8 of 12" },
          { id: "lift", title: "Lift", color: "#0ea5e9", rateLabel: "unplaced" },
        ]}
        selectedGoalIds={new Set(["run"])}
        onToggleGoal={() => {}}
        onSelectAll={onSelectAll}
        onClearAll={onClearAll}
      />
    );

    expect(screen.getByRole("list")).toHaveClass("grid-rows-2", "md:flex-col");
    expect(screen.getByText("Tempo run")).toHaveClass("line-clamp-2", "text-xs", "font-medium");
    expect(screen.getByText("Tempo run")).not.toHaveClass("font-semibold");
    expect(screen.getByText("8 of 12")).toHaveClass("hidden", "md:inline");
    await user.click(screen.getByRole("button", { name: "Select all" }));
    expect(onSelectAll).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(onClearAll).toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Goals (1)" })).toBeInTheDocument();
  });

  it("isolates one goal from the Only control", async () => {
    const onSelectOnly = vi.fn();
    const user = userEvent.setup();
    render(
      <ProgressGoalList
        goals={[
          { id: "run", title: "Tempo run", color: "#22c55e", rateLabel: "8 of 12" },
          { id: "lift", title: "Lift", color: "#0ea5e9", rateLabel: "unplaced" },
        ]}
        selectedGoalIds={new Set(["run", "lift"])}
        onToggleGoal={() => {}}
        onSelectOnly={onSelectOnly}
      />
    );

    const only = screen.getAllByRole("button", { name: "Only" })[0];
    expect(only).toHaveClass("text-foreground");
    expect(only).not.toHaveClass("shadow-sm");
    expect(only).not.toHaveClass("bg-background/90");
    await user.click(only);
    expect(onSelectOnly).toHaveBeenCalledWith("run");
    expect(only).not.toHaveFocus();
  });
});
