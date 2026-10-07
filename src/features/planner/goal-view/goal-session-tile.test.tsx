import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import { GoalSessionTile } from "./goal-session-tile";
import type { GoalViewSession, SessionOrdinal } from "./goal-view-model";

const session: GoalViewSession = {
  key: "run:2026-10-09",
  goalId: "run",
  date: "2026-10-09",
  time: "07:30",
  label: "Run a half marathon",
  milestone: null,
  locked: false,
  done: false,
  draft: false,
  entry: { unitKey: "cadence:2026-10-05:2", activeGoal: null, draftGhost: false } as unknown as PlannerDayDetailEntry,
};

function renderTile(
  dateInHeader: boolean,
  ordinal: SessionOrdinal | null = { count: "2 of 3", period: "per week" },
  onOpen?: (session: GoalViewSession) => void
) {
  render(
    <GoalSessionTile
      session={session}
      today="2026-10-02"
      completion={{ credited: false, pending: false, disabledReason: null }}
      editable
      ordinal={ordinal}
      dateInHeader={dateInHeader}
      onMove={vi.fn()}
      onToggle={vi.fn()}
      onOpen={onOpen}
    />
  );
}

describe("GoalSessionTile", () => {
  afterEach(cleanup);

  it("never truncates its date or ordinal, and keeps nudges out of the layout", () => {
    renderTile(false);
    for (const text of ["Fri, Oct 9", "2 of 3", "2 of 3 per week"]) {
      expect(screen.getByText(text).className).not.toMatch(/truncate|line-clamp|text-ellipsis/);
    }
    const nudge = screen.getByRole("button", { name: "Move Run a half marathon one day later" });
    expect(nudge.parentElement).toHaveClass("absolute");
  });

  it("leads with the date where no header names it, under a small title", () => {
    renderTile(false);
    const title = screen.getByTestId("completion-title").parentElement;
    expect(title).toHaveTextContent("Run a half marathon");
    expect(title).toHaveClass("truncate");
    expect(title?.parentElement).toHaveAttribute("title", "Run a half marathon");
    const date = screen.getByText("Fri, Oct 9");
    expect(date).not.toHaveClass("opacity-0");
    expect(date.parentElement).toHaveClass("type-item");
    expect(screen.getByText("2 of 3")).toHaveClass("opacity-0");
    expect(screen.getByText("2 of 3 per week")).not.toHaveClass("opacity-0");
    expect(screen.getByText("07:30")).toBeInTheDocument();
  });

  it("cross-fades the date to the count under a date header, with its period below", () => {
    renderTile(true);
    expect(screen.getByTestId("completion-title")).toHaveTextContent("Run a half marathon");
    expect(screen.getByText("Fri, Oct 9")).toHaveClass("opacity-0");
    expect(screen.getByText("2 of 3")).not.toHaveClass("opacity-0");
    expect(screen.getByText("per week")).not.toHaveClass("opacity-0");
    expect(screen.getByText("2 of 3 per week")).toHaveClass("opacity-0");
    // The line is still the date control.
    expect(screen.getByLabelText("Change date of Run a half marathon, Fri, Oct 9")).toBeEnabled();
  });

  it("keeps a long milestone name readable: the rename button truncates itself", () => {
    render(
      <GoalSessionTile
        session={{ ...session, label: "Long run ten kilometers", milestone: 2, entry: { ...session.entry, unitKey: "milestone:2" } }}
        today="2026-10-02"
        completion={{ credited: false, pending: false, disabledReason: null }}
        editable
        ordinal={{ count: "2 of 5", period: null }}
        onMove={vi.fn()}
        onToggle={vi.fn()}
      />
    );
    const rename = screen.getByRole("button", { name: "Rename milestone Long run ten kilometers" });
    // An ellipsis on the title would hide an overflowing button whole.
    expect(rename.closest(".block")).toHaveClass("[&_button]:max-w-full", "[&_button]:truncate");
    // The ordinal numbers the milestone, so the card drops the "2." prefix.
    expect(screen.getByTestId("completion-title")).toHaveTextContent(/^Long run ten kilometers$/);
  });

  it("keeps the date under a header when there is nothing to count", () => {
    renderTile(true, null);
    expect(screen.getByText("Fri, Oct 9")).not.toHaveClass("opacity-0");
  });

  it("opens its details from the card but not from its controls", () => {
    const onOpen = vi.fn();
    renderTile(false, null, onOpen);
    const card = screen.getByRole("article", { name: "Run a half marathon, Fri, Oct 9. Open details" });
    fireEvent.click(screen.getByTestId("completion-title"));
    expect(onOpen).toHaveBeenCalledWith(session);
    fireEvent.click(screen.getByRole("button", { name: "Move Run a half marathon one day later" }));
    fireEvent.click(screen.getByLabelText("Change date of Run a half marathon, Fri, Oct 9"));
    expect(onOpen).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(card, { key: "Enter" });
    expect(onOpen).toHaveBeenCalledTimes(2);
  });
});
