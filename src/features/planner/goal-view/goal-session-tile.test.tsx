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
  entry: {
    unitKey: "cadence:2026-10-05:2",
    goalTitle: "Run a half marathon",
    activeGoal: null,
    draftGhost: false,
  } as unknown as PlannerDayDetailEntry,
};

function tile(
  dateInHeader: boolean,
  ordinal: SessionOrdinal | null = { count: "2 of 3", period: "per week" },
  overrides: Partial<GoalViewSession> = {},
  onOpen?: (session: GoalViewSession) => void
) {
  return (
    <GoalSessionTile
      session={{ ...session, ...overrides }}
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

const renderTile = (...args: Parameters<typeof tile>) => render(tile(...args));

const lineText = (text: string) =>
  screen.getByText((_, element) => element?.tagName === "SPAN" && element.textContent === text);

describe("GoalSessionTile", () => {
  afterEach(cleanup);

  it("leads with the check and date; with no name, the full count and the time get a line each", () => {
    renderTile(false);
    const card = screen.getByRole("article");
    expect(card).not.toHaveTextContent("Run a half marathon");
    const date = screen.getByText("Fri, Oct 9");
    expect(date).not.toHaveClass("opacity-0");
    expect(date.closest(".type-item")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Mark Run a half marathon done" }).closest("article")).toBe(card);
    const lines = [...card.querySelectorAll("article > span.col-start-2")].map((node) => node.textContent);
    expect(lines).toEqual(["2 of 3per week", "07:30"]);
    for (const text of ["Fri, Oct 9", "2 of 3"]) {
      expect(screen.getByText(text).className).not.toMatch(/truncate|line-clamp|text-ellipsis/);
    }
  });

  it("leads with the count under a date header, its period and time below", () => {
    renderTile(true);
    expect(screen.getByText("Fri, Oct 9")).toHaveClass("opacity-0", "-translate-y-full");
    expect(screen.getByText("2 of 3").closest(".type-item")).not.toBeNull();
    expect(lineText("per week· 07:30")).toBeInTheDocument();
    expect(screen.getByLabelText("Change date of Run a half marathon, Fri, Oct 9")).toBeEnabled();
  });

  it("moves the time up beside a short period when a name takes the third line", () => {
    const ordinal = { count: "2 of 3", period: "per week", periodShort: "/wk" };
    const named = { label: "Tempo run 4x800" };
    const { rerender, container } = renderTile(false, ordinal, named);
    const lines = () => [...container.querySelectorAll("article > span.col-start-2")].map((node) => node.textContent);
    expect(lines()).toEqual(["2 of 3/wk· 07:30", "Tempo run 4x800"]);
    rerender(tile(true, ordinal, named));
    expect(lines()).toEqual(["per week· 07:30", "Tempo run 4x800"]);
    // Without a name the period stays whole.
    rerender(tile(false, ordinal));
    expect(lines()).toEqual(["2 of 3per week", "07:30"]);
  });

  it("shows the time only when one is set", () => {
    renderTile(false, undefined, { time: "" });
    expect(screen.queryByText(/Any time|·/)).toBeNull();
    expect(lineText("2 of 3per week")).toBeInTheDocument();
  });

  it("marks the count, period, and time to glide in both modes", () => {
    const { rerender, container } = renderTile(false);
    const keys = () => [...container.querySelectorAll("[data-glide]")].map((node) => node.getAttribute("data-glide"));
    expect(keys()).toEqual(["count", "period", "time"]);
    rerender(tile(true));
    expect(keys()).toEqual(["count", "period", "time"]);
  });

  it("gives a custom name the third line, renamable for milestones", () => {
    const named = {
      label: "Long run ten kilometers",
      milestone: 2,
      entry: { ...session.entry, unitKey: "milestone:2" } as PlannerDayDetailEntry,
    };
    const { container } = renderTile(false, { count: "2 of 5", period: null }, named);
    const rename = screen.getByRole("button", { name: "Rename milestone Long run ten kilometers" });
    expect(rename.closest("[data-glide]")).toHaveAttribute("data-glide", "name");
    const lines = [...container.querySelectorAll("article > span.col-start-2")].map((node) => node.textContent);
    expect(lines).toEqual(["2 of 5· 07:30", "Long run ten kilometers"]);
  });

  it("shows an unnamed milestone's default name, lighter but renamable from the start", () => {
    renderTile(false, { count: "2 of 5", period: null }, {
      label: "Milestone 2",
      milestone: 2,
      entry: { ...session.entry, unitKey: "milestone:2" } as PlannerDayDetailEntry,
    });
    const rename = screen.getByRole("button", { name: "Rename milestone Milestone 2" });
    expect(rename.closest(".truncate")).toHaveClass("text-muted-foreground/70");
  });

  it("leaves the goal's own title off a session card, but keeps a session's own name", () => {
    renderTile(false);
    expect(screen.queryByText("Run a half marathon")).toBeNull();
    cleanup();
    renderTile(false, undefined, { label: "Tempo run 4x800" });
    expect(screen.getByText("Tempo run 4x800")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Rename milestone/ })).toBeNull();
  });

  it("keeps the date under a header when there is nothing to count", () => {
    renderTile(true, null);
    expect(screen.getByText("Fri, Oct 9")).not.toHaveClass("opacity-0");
  });

  it("keeps nudges out of the layout", () => {
    renderTile(false);
    const nudge = screen.getByRole("button", { name: "Move Run a half marathon one day later" });
    expect(nudge.parentElement).toHaveClass("absolute");
    // Editing a field in the card (a milestone name, the date) hides them.
    expect(nudge.parentElement).toHaveClass("group-has-[input:focus]:invisible");
  });

  it("keeps the milestone title, with rename, on phone rows", () => {
    render(
      <GoalSessionTile
        session={{ ...session, label: "Long run ten kilometers", milestone: 2, entry: { ...session.entry, unitKey: "milestone:2" } }}
        layout="row"
        today="2026-10-02"
        completion={{ credited: false, pending: false, disabledReason: null }}
        editable
        ordinal={{ count: "2 of 5", period: null }}
        onMove={vi.fn()}
        onToggle={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Rename milestone Long run ten kilometers" })).toBeInTheDocument();
    expect(screen.getByTestId("completion-title")).toHaveTextContent(/^2\. Long run ten kilometers$/);
  });

  it("opens its details from the card but not from its controls", () => {
    const onOpen = vi.fn();
    renderTile(false, undefined, {}, onOpen);
    const card = screen.getByRole("article", { name: "Run a half marathon, Fri, Oct 9. Open details" });
    fireEvent.click(screen.getByText("2 of 3"));
    expect(onOpen).toHaveBeenCalledWith(session);
    fireEvent.click(screen.getByRole("button", { name: "Move Run a half marathon one day later" }));
    fireEvent.click(screen.getByLabelText("Change date of Run a half marathon, Fri, Oct 9"));
    expect(onOpen).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(card, { key: "Enter" });
    expect(onOpen).toHaveBeenCalledTimes(2);
  });
});
