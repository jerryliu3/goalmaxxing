import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProgressGoalList } from "@/features/insights/progress-goal-list";

describe("ProgressGoalList", () => {
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

    expect(screen.getByRole("button", { name: /Tempo run/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await user.click(screen.getByRole("button", { name: /Lift/ }));
    expect(onToggleGoal).toHaveBeenCalledWith("lift");
  });
});
