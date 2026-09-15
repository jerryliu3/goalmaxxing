import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import { buildGoalFolios } from "./folio-model";
import { FolioShelf } from "./folio-shelf";
import { summary } from "./folio-test-fixtures";

afterEach(cleanup);

describe("folio reader", () => {
  it("opens the shared Tempo card, navigates goals, bounds arrows, and restores focus", async () => {
    const user = userEvent.setup();
    const goals = [buildGoal({ id: "first", title: "Learn piano", end_date: "2026-07-01" }), buildGoal({ id: "second", title: "Run a 10k", end_date: "2026-08-01" })];
    const folios = buildGoalFolios(goals, goals.map(goal => summary(goal.id)), "user-1");
    render(<FolioShelf folios={folios} />);
    const book = screen.getByRole("button", { name: "Open 2026, 2 goals" });
    await user.click(book);
    const reader = screen.getByRole("dialog");
    expect(within(reader).getByRole("article", { name: "Learn piano goal card" })).toHaveClass("tempo-card");
    expect(within(reader).getByRole("button", { name: "Previous goal" })).toBeDisabled();
    await user.click(within(reader).getByRole("button", { name: "Next goal" }));
    expect(within(reader).getByRole("article", { name: "Run a 10k goal card" })).toBeInTheDocument();
    expect(within(reader).getByRole("button", { name: "Next goal" })).toBeDisabled();
    // Focus an enabled control, then use the reader's keyboard navigation.
    within(reader).getByRole("button", { name: "Previous goal" }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(within(reader).getByRole("button", { name: "Previous goal" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(book).toHaveFocus();
  });

  it("labels the shared card by how each goal ended", async () => {
    const user = userEvent.setup();
    const goals = [buildGoal({ id: "won", title: "Learn piano", end_date: "2026-07-01" }), buildGoal({ id: "stopped", title: "Run a 10k", end_date: "2026-08-01" })];
    const folios = buildGoalFolios(goals, [summary("won", { outcome: "achieved", achievementDate: "2026-07-01" }), summary("stopped")], "user-1");
    render(<FolioShelf folios={folios} />);
    await user.click(screen.getByRole("button", { name: "Open 2026, 2 goals" }));
    const reader = screen.getByRole("dialog");
    expect(within(reader).getByText("A goal you accomplished")).toBeInTheDocument();
    await user.click(within(reader).getByRole("button", { name: "Next goal" }));
    expect(within(reader).getByText("A goal you showed up for")).toBeInTheDocument();
  });
});
