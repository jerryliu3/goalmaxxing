import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GoalByGoalConcept } from "@/features/ux-recovery/goal-by-goal-concept";
import { GoalViewConcept } from "@/features/ux-recovery/goal-view-concept";
import { RecoveryIndex } from "@/features/ux-recovery/recovery-index";

afterEach(cleanup);

const REVIEW = "5 sessions slipped · Review";
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

describe("recovery study", () => {
  it("lists the two review concepts and points the Agenda entry at Goal by goal", () => {
    render(<RecoveryIndex />);
    for (const [name, slug] of [
      ["Goal by goal", "goal-by-goal"],
      ["In Goal View", "goal-view"],
    ]) {
      expect(screen.getByRole("link", { name: `Open ${name}` })).toHaveAttribute("href", `/ux/recovery/${slug}`);
    }
    expect(screen.queryByRole("link", { name: "Open Focused list" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: REVIEW })).toHaveAttribute("href", "/ux/recovery/goal-by-goal");
  });

  it("goal by goal: nothing previews until Review; the calendar filter lives in the panel", () => {
    render(<GoalByGoalConcept />);
    expect(screen.queryByRole("complementary", { name: "Slipped sessions" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show full calendar" })).not.toBeInTheDocument();

    click(REVIEW);
    const panel = screen.getByRole("complementary", { name: "Slipped sessions" });
    expect(within(panel).getByText("Goal 1 of 4 · saves as you go")).toBeInTheDocument();
    fireEvent.click(within(panel).getByRole("button", { name: "Show full calendar" }));
    expect(within(panel).getByRole("button", { name: "Only this goal" })).toBeInTheDocument();
  });

  it("goal by goal: Accept turns the row into a confirmation with its own Undo", () => {
    render(<GoalByGoalConcept />);
    click(REVIEW);
    click("Accept Run on Thu Oct 8");
    expect(screen.getByText("Moved to Thu Oct 8")).toBeInTheDocument();
    expect(screen.getByText("All set for Run 3× a week.")).toBeInTheDocument();

    click("Undo Run moved to Thu Oct 8");
    expect(screen.queryByText("Moved to Thu Oct 8")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept Run on Thu Oct 8" })).toBeInTheDocument();
  });

  it("goal by goal: Next goal is always there, Back returns, and the summary groups every change by goal", () => {
    render(<GoalByGoalConcept />);
    click(REVIEW);
    click("Next goal");
    expect(screen.getByText("Goal 2 of 4 · saves as you go")).toBeInTheDocument();
    click("Back");
    expect(screen.getByText("Goal 1 of 4 · saves as you go")).toBeInTheDocument();

    click("Accept Run on Thu Oct 8");
    click("Next goal");
    click("Next goal");
    click("Let go of Session 4 of 8 missed Thu Oct 1");
    click("Next goal");
    click("Summary");

    expect(screen.getByText("The rest can wait.")).toBeInTheDocument();
    // The summary calendar shows only the slipped goals; the full calendar is one toggle away.
    expect(screen.getByText("Slipped goals · as saved")).toBeInTheDocument();
    click("Show full calendar");
    expect(screen.getByText("All goals · slipped highlighted · as saved")).toBeInTheDocument();
    click("Only slipped goals");
    expect(screen.getByText("Slipped goals · as saved")).toBeInTheDocument();
    const run = screen.getByRole("region", { name: "Run 3× a week changes" });
    expect(within(run).getByText("Moved to Thu Oct 8")).toBeInTheDocument();
    const portfolio = screen.getByRole("region", { name: "Ship portfolio site changes" });
    expect(within(portfolio).getByText("Let go")).toBeInTheDocument();
    expect(within(portfolio).getByText("Left for later")).toBeInTheDocument();

    // Per-row Undo still works from the summary.
    fireEvent.click(within(run).getByRole("button", { name: "Undo Run moved to Thu Oct 8" }));
    expect(within(run).getByText("Left for later")).toBeInTheDocument();

    click("Done");
    expect(screen.queryByRole("complementary", { name: "Slipped sessions" })).not.toBeInTheDocument();
  });

  it("goal by goal: Auto-rebalance opens the proposal; Apply rebalance saves it in one action", () => {
    render(<GoalByGoalConcept />);
    click(REVIEW);
    fireEvent.click(screen.getByRole("switch", { name: "Auto-rebalance" }));
    expect(screen.getByText("Proposed new dates")).toBeInTheDocument();
    expect(screen.getByText("Auto-rebalance · not saved yet")).toBeInTheDocument();
    expect(screen.getByText("Slipped goals · proposed dates, not saved yet")).toBeInTheDocument();
    const portfolio = screen.getByRole("region", { name: "Ship portfolio site changes" });
    expect(within(portfolio).getByText("Oct 1 → Oct 13")).toBeInTheDocument();
    expect(within(portfolio).getByText("Oct 13 → Oct 21")).toBeInTheDocument();
    expect(within(portfolio).getAllByText("Proposed")).toHaveLength(2);

    click("Apply rebalance");
    expect(screen.queryByText("Proposed new dates")).not.toBeInTheDocument();
    expect(screen.getAllByText("Saved with Auto-rebalance")).toHaveLength(2);
    expect(within(screen.getByRole("region", { name: "Ship portfolio site changes" })).getByText("Oct 13 → Oct 21")).toBeInTheDocument();
  });

  it("goal by goal: One goal at a time leaves the proposal unsaved", () => {
    render(<GoalByGoalConcept />);
    click(REVIEW);
    fireEvent.click(screen.getByRole("switch", { name: "Auto-rebalance" }));
    click("One goal at a time");
    expect(screen.getByText("Goal 1 of 4 · saves as you go")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept Run on Thu Oct 8" })).toBeInTheDocument();
  });

  it("goal view: lanes show slipped markers only after Review, and decided rows stay with Undo", () => {
    render(<GoalViewConcept />);
    expect(screen.queryByRole("button", { name: /slipped$/ })).not.toBeInTheDocument();

    click(REVIEW);
    click("Ship portfolio site: 2 slipped");
    const lane = screen.getByRole("region", { name: "Ship portfolio site lane" });
    fireEvent.click(within(lane).getByRole("button", { name: "Let go of Session 4 of 8 missed Thu Oct 1" }));
    expect(screen.getByRole("button", { name: "Ship portfolio site: 1 slipped" })).toBeInTheDocument();
    expect(within(lane).getByText("Let go")).toBeInTheDocument();

    fireEvent.click(within(lane).getByRole("button", { name: "Undo let go of Session 4 of 8" }));
    expect(screen.getByRole("button", { name: "Ship portfolio site: 2 slipped" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("switch", { name: "Auto-rebalance" }));
    expect(within(screen.getByRole("region", { name: "Recovery summary" })).getByText("Proposed new dates")).toBeInTheDocument();
  });
});
