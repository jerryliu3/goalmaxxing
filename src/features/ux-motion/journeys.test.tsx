import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TaskCapture } from "./task-capture";
import { MilestoneJourney } from "./milestone-journey";

vi.mock("@/features/goals/goal-progress-card", () => ({ GoalProgressCard: () => <span>Goal material preview</span> }));

describe("motion study interactions", () => {
  afterEach(cleanup);

  it("captures successive tasks, retaining keyboard focus and allowing completion", async () => {
    const user = userEvent.setup();
    render(<TaskCapture still />);
    await user.click(screen.getByRole("button", { name: "Add", exact: true }));
    const composer = screen.getByRole("textbox", { name: "A task for today" });
    expect(composer).toHaveFocus();
    expect(composer).toHaveValue("");
    await user.type(composer, "Book the train{Enter}");
    expect(screen.getByText("2 sample tasks · ready for the next")).toBeInTheDocument();
    screen.getByRole("button", { name: "Complete Book the train" }).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Reopen Book the train" })).toBeInTheDocument();
  });

  it("keeps a partial milestone goal active and files only its final completion", async () => {
    const user = userEvent.setup();
    render(<MilestoneJourney still />);
    screen.getByRole("button", { name: "Complete First draft", exact: true }).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByText("2 of 3 milestones complete. The goal is still in progress.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Publish, not completed" }));
    screen.getByRole("button", { name: "Complete Publish", exact: true }).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByText("Goal achieved. Your portfolio is now part of your past-goal history.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open 2026, 2 goals" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skip to library" })).not.toBeInTheDocument();
  });
});
