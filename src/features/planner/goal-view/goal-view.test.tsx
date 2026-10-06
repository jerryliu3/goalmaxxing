import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import type { Goal } from "@/lib/goals/types";
import { GoalView, type GoalViewProps } from "./goal-view";
import { buildGoalViewSessions, buildGoalViewWindow, type GoalViewSession } from "./goal-view-model";

const viewport = vi.hoisted(() => ({ desktop: true }));
vi.mock("@/lib/ui/use-media-query", () => ({ useMediaQuery: () => viewport.desktop }));
vi.mock("motion/react", () => ({ useReducedMotion: () => false }));
vi.mock("next/navigation", () => ({ usePathname: () => "/calendar" }));
vi.mock("./goal-view-card", () => ({
  GoalViewCard: ({ goal, interactive = true }: { goal: Goal; interactive?: boolean }) =>
    <div data-testid={`card-${goal.id}`} data-rotatable={interactive} />,
}));
vi.mock("@/features/planner/plan-ledger-completion-control", () => ({
  PlanLedgerCompletionControl: ({
    label,
    disabled,
    onToggle,
  }: {
    label: string;
    disabled?: boolean;
    onToggle: (el: HTMLButtonElement) => void;
  }) => (
    <button
      type="button"
      disabled={disabled}
      aria-label={`Complete ${label}`}
      onClick={(event) => onToggle(event.currentTarget)}
    />
  ),
}));

const TODAY = "2026-10-02";
const goal = (id: string, title: string) => ({ id, title }) as Goal;
const GOALS = [goal("run", "Run a half marathon"), goal("gym", "Get stronger")];

function entry(
  goalId: string,
  date: string,
  patch: Partial<PlannerDayDetailEntry> = {}
): PlannerDayDetailEntry {
  return {
    key: `${goalId}:${date}`,
    originalGoalId: goalId,
    goalTitle: goalId === "run" ? "Run a half marathon" : "Get stronger",
    unitKey: "cadence:1",
    label: `${goalId} session`,
    classification: "open",
    creditState: "uncredited",
    activeGoal: null,
    activeItem: null,
    draftDiffKind: null,
    draftDiffFromDate: null,
    draftDiffToDate: null,
    draftGhost: false,
    ...patch,
  };
}

const ENTRIES: Record<string, PlannerDayDetailEntry[]> = {
  "2026-09-30": [entry("gym", "2026-09-30")],
  [TODAY]: [entry("run", TODAY, { effectiveScheduledLocalTime: "07:30" })],
  "2026-10-03": [entry("gym", "2026-10-03")],
  "2026-10-09": [entry("run", "2026-10-09", { unitKey: "milestone:2" })],
};
const SESSIONS = buildGoalViewSessions(Object.keys(ENTRIES), (day) => ENTRIES[day] ?? []);

function renderView(overrides: Partial<GoalViewProps> = {}) {
  const props: GoalViewProps = {
    goals: GOALS,
    progressByGoalId: new Map(),
    sessions: SESSIONS,
    today: TODAY,
    window: buildGoalViewWindow(TODAY),
    weekStartsOn: 1,
    loading: false,
    onVisibleDate: vi.fn(),
    onInspectDate: vi.fn(),
    onOpenSession: vi.fn(),
    resolveCompletion: () => ({ credited: false, pending: false, disabledReason: null }),
    isEditable: () => true,
    onMoveSession: vi.fn(),
    onToggleSession: vi.fn(),
    ...overrides,
  };
  const view = render(<GoalView {...props} />);
  return { ...props, rerenderWith: (patch: Partial<GoalViewProps>) =>
    view.rerender(<GoalView {...props} {...patch} />) };
}

function pickDate(tile: HTMLElement, date: string) {
  const field = tile.querySelector<HTMLInputElement>('input[type="date"]')!;
  fireEvent.change(field, { target: { value: date } });
}

it("shows the range of the loaded session snapshot", () => {
  const view = renderView({ window: { start: "2026-10-01", end: "2026-10-31" } });
  expect(screen.getByText(/Showing sessions from Oct 1, 2026 through Oct 31, 2026/)).toBeInTheDocument();
  expect(screen.queryByText(/Further dates load in the background/)).toBeNull();
  view.rerenderWith({ window: buildGoalViewWindow(TODAY) });
  expect(screen.queryByText(/Further dates load in the background/)).not.toBeInTheDocument();
});

describe("GoalView", () => {
  afterEach(() => {
    cleanup();
    viewport.desktop = true;
  });

  it("shows one lane per goal with its card and upcoming dates", () => {
    renderView();
    const run = screen.getByRole("region", { name: "Run a half marathon scheduled dates" });
    expect(within(run).getByTestId("card-run")).toBeInTheDocument();
    expect(within(run).getAllByRole("article")).toHaveLength(2);
    const gym = screen.getByRole("region", { name: "Get stronger scheduled dates" });
    expect(within(gym).getAllByRole("article")).toHaveLength(1);
  });

  it("links each goal card to its editor", () => {
    renderView();
    expect(screen.getByRole("link", { name: "Edit goal Get stronger" })).toHaveAttribute(
      "href",
      "/goals/gym"
    );
    expect(screen.getByRole("link", { name: "Edit goal Run a half marathon" })).toHaveAttribute(
      "href",
      "/goals/run"
    );
  });

  it("uses a directly interactive native date input and moves a session to the chosen date", () => {
    const props = renderView();
    const run = screen.getByRole("region", { name: "Run a half marathon scheduled dates" });
    // Cards drop the title (the lane names the goal); it stays as the tooltip.
    expect(within(run).getAllByRole("article")[1]).toHaveAttribute("title", "run session");
    const field = within(run).getByLabelText("Change date of run session, Fri, Oct 9") as HTMLInputElement;
    // Only the date is a control: the rest of the tile is not a button.
    expect(
      within(run).queryByRole("button", { name: /^Edit run session/ })
    ).toBeNull();
    expect(field.parentElement).toHaveTextContent("Fri, Oct 9");
    expect(field).toHaveClass("h-full", "w-full");
    expect(field).not.toHaveAttribute("aria-hidden");
    expect(field).not.toHaveAttribute("tabindex", "-1");
    expect(field.parentElement!.querySelector('[aria-hidden="true"]')).not.toHaveClass("underline");
    expect(field.min).toBe(TODAY);
    pickDate(field.parentElement!, "2026-10-12");
    expect(props.onMoveSession).toHaveBeenCalledWith(
      expect.objectContaining({ key: "run:2026-10-09", milestone: 2 }),
      "2026-10-12"
    );
  });

  it("does not open a picker for locked, done or read-only sessions", () => {
    const props = renderView({
      isEditable: (session) => session.key !== "gym:2026-10-03",
    });
    const gym = screen.getByRole("region", { name: "Get stronger scheduled dates" });
    const field = within(gym).getByLabelText(/^Change date of gym session/);
    expect(field).toBeDisabled();
    expect(field).toHaveClass("disabled:opacity-0");
    expect(field.parentElement!.querySelector('[aria-hidden="true"]')).not.toHaveClass("underline");
    fireEvent.change(field, { target: { value: "2026-10-12" } });
    expect(props.onMoveSession).not.toHaveBeenCalled();
  });

  it("ignores cleared, unchanged and past date input values", () => {
    const props = renderView();
    const field = screen.getByLabelText("Change date of run session, Fri, Oct 9");
    for (const value of ["", "2026-10-09", "2026-10-01"]) {
      fireEvent.change(field, { target: { value } });
    }
    expect(props.onMoveSession).not.toHaveBeenCalled();
  });

  it("moves a future session one day earlier or later", () => {
    const props = renderView();
    const gym = screen.getByRole("region", { name: "Get stronger scheduled dates" });
    fireEvent.click(within(gym).getByRole("button", { name: "Move gym session one day later" }));
    expect(props.onMoveSession).toHaveBeenCalledWith(
      expect.objectContaining({ key: "gym:2026-10-03" }),
      "2026-10-04"
    );
  });

  it("does not let a session move into the past or when it is locked or done", () => {
    renderView({
      sessions: SESSIONS.map((session: GoalViewSession) =>
        session.key === "gym:2026-10-03" ? { ...session, locked: true } : session
      ),
    });
    const run = screen.getByRole("region", { name: "Run a half marathon scheduled dates" });
    const [todayTile] = within(run).getAllByRole("article");
    expect(
      within(todayTile).getByRole("button", { name: "Move run session one day earlier" })
    ).toBeDisabled();
    const gym = screen.getByRole("region", { name: "Get stronger scheduled dates" });
    expect(
      within(gym).getByRole("button", { name: "Move gym session one day later" })
    ).toBeDisabled();
  });

  it("toggles completion and respects a disabled reason", () => {
    const resolveCompletion = vi
      .fn()
      .mockImplementation((session: GoalViewSession) => ({
        credited: false,
        pending: false,
        disabledReason: session.date > TODAY
          ? "You can only mark planner sessions done for today or past dates."
          : null,
      }));
    const props = renderView({ resolveCompletion });
    const toggles = screen.getAllByRole("button", { name: /^Complete / });
    expect(toggles.some((button) => !(button as HTMLButtonElement).disabled)).toBe(true);
    expect(toggles.some((button) => (button as HTMLButtonElement).disabled)).toBe(true);
    fireEvent.click(toggles.find((button) => !(button as HTMLButtonElement).disabled)!);
    expect(props.onToggleSession).toHaveBeenCalledTimes(1);
  });

  describe("with Calendar on", () => {
    const lanes = () => screen.getByRole("region", { name: "Goal lanes, scroll across dates" });
    const tileLeft = (key: string) =>
      lanes().querySelector<HTMLElement>(`[data-lane-tile="${key}"]`)?.style.left;
    // The axis opens a year before the week of Sep 28, so Oct 2 is column 369.
    const TODAY_COLUMN = 365 + 4;

    beforeEach(() => {
      // jsdom does not implement element scrolling.
      Element.prototype.scrollTo = vi.fn();
    });

    it("moves the same session cards onto their dates and back", () => {
      renderView();
      const card = lanes().querySelector(`[data-lane-tile="run:${TODAY}"] article`);
      expect(tileLeft(`run:${TODAY}`)).toBe("6px");
      expect(tileLeft("gym:2026-10-03")).toBe("6px");
      expect(lanes().querySelector("[data-lane-header]")).toBeNull();

      fireEvent.click(screen.getByRole("switch", { name: "Calendar" }));
      // The leading session stays at the left edge; the rest sit on their dates.
      expect(lanes().scrollLeft).toBe(TODAY_COLUMN * 144);
      expect(tileLeft(`run:${TODAY}`)).toBe(`${TODAY_COLUMN * 144 + 6}px`);
      expect(tileLeft("gym:2026-10-03")).toBe(`${(TODAY_COLUMN + 1) * 144 + 6}px`);
      // Calendar shows past sessions too.
      expect(tileLeft("gym:2026-09-30")).toBe(`${(TODAY_COLUMN - 2) * 144 + 6}px`);
      expect(lanes().querySelector(`[data-lane-tile="run:${TODAY}"] article`)).toBe(card);
      expect(lanes().querySelector("[data-lane-header]")).not.toBeNull();

      fireEvent.click(screen.getByRole("switch", { name: "Calendar" }));
      expect(tileLeft(`run:${TODAY}`)).toBe("6px");
      expect(lanes().scrollLeft).toBe(0);
      expect(lanes().querySelector("[data-lane-header]")).toBeNull();
    });

    it("opens a session's details from its card, and the day preview from a date", () => {
      const props = renderView();
      fireEvent.click(screen.getByRole("switch", { name: "Calendar" }));
      fireEvent.click(screen.getByRole("button", { name: "Inspect Wednesday, September 30, 2026" }));
      expect(props.onInspectDate).toHaveBeenLastCalledWith("2026-09-30");
      const card = within(lanes()).getAllByRole("article")[0];
      fireEvent.click(card);
      expect(props.onOpenSession).toHaveBeenCalledWith(
        expect.objectContaining({
          key: card.getAttribute("data-planner-entry-key"),
        })
      );
      fireEvent.click(screen.getAllByRole("button", { name: /^Complete / })[0]);
      expect(props.onOpenSession).toHaveBeenCalledTimes(1);
      expect(props.onInspectDate).toHaveBeenCalledTimes(1);
    });

    it("reports the date in view so the planner can load around it", () => {
      const props = renderView();
      expect(props.onVisibleDate).toHaveBeenLastCalledWith(TODAY);
      fireEvent.click(screen.getByRole("switch", { name: "Calendar" }));
      expect(props.onVisibleDate).toHaveBeenLastCalledWith(TODAY);
      // Never the axis start the switching render briefly had in view.
      expect(props.onVisibleDate).not.toHaveBeenCalledWith("2025-09-28");
      lanes().scrollLeft = (TODAY_COLUMN + 30) * 144;
      fireEvent.scroll(lanes());
      fireEvent.click(screen.getByRole("button", { name: "Later dates" }));
      expect(props.onVisibleDate).toHaveBeenCalled();
    });

    it("pages its arrows to the first date not fully in view, never skipping one", () => {
      renderView();
      fireEvent.click(screen.getByRole("switch", { name: "Calendar" }));
      const scroller = lanes();
      // A 184px label column and room for exactly five 144px days, scrolled
      // 30px into today's column: Oct 2 and Oct 7 are cut off at the edges.
      Object.defineProperty(scroller, "clientWidth", { configurable: true, value: 184 + 5 * 144 });
      scroller.scrollLeft = TODAY_COLUMN * 144 + 30;
      fireEvent.scroll(scroller);
      const scrollTo = vi.mocked(Element.prototype.scrollTo);
      scrollTo.mockClear();
      fireEvent.click(screen.getByRole("button", { name: "Later dates" }));
      // Oct 7 (cut off on the right) leads the next view.
      expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: (TODAY_COLUMN + 5) * 144 }));
      fireEvent.click(screen.getByRole("button", { name: "Earlier dates" }));
      // Oct 2 (cut off on the left) ends the previous view.
      expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: (TODAY_COLUMN - 4) * 144 }));
    });

    it("restarts Cards from the calendar's leading date, and from today on Today", () => {
      renderView();
      fireEvent.click(screen.getByRole("switch", { name: "Calendar" }));
      // Leave the calendar at Friday Oct 9, so Cards restarts from there.
      lanes().scrollLeft = (TODAY_COLUMN + 7) * 144;
      fireEvent.scroll(lanes());
      fireEvent.click(screen.getByRole("switch", { name: "Calendar" }));
      // Oct 9 leads, with today's run session one column to its left.
      expect(tileLeft("run:2026-10-09")).toBe("150px");
      expect(tileLeft(`run:${TODAY}`)).toBe("6px");
      expect(lanes().scrollLeft).toBe(144);
      expect(screen.getByLabelText("Jump to a date, showing October 2026")).toHaveValue("2026-10-09");

      fireEvent.click(screen.getByRole("button", { name: "Today" }));
      expect(tileLeft("run:2026-10-09")).toBe("150px");
      expect(lanes().scrollLeft).toBe(0);
      expect(screen.getByLabelText("Jump to a date, showing October 2026")).toHaveValue(TODAY);
    });

    it("keeps its controls when the loaded window has no sessions", () => {
      const view = renderView();
      fireEvent.click(screen.getByRole("switch", { name: "Calendar" }));
      view.rerenderWith({ sessions: [] });
      expect(screen.getByText("No scheduled sessions around these dates.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Today" })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("switch", { name: "Calendar" }));
      expect(screen.getByText("No goals have scheduled sessions in this window.")).toBeInTheDocument();
      expect(screen.getByRole("switch", { name: "Calendar" })).toBeInTheDocument();
    });

    it("adds goals whose loaded sessions are all past, for browsing back", () => {
      renderView({
        sessions: SESSIONS.filter((s) => s.goalId === "run" || s.date < TODAY),
      });
      const gymLane = () => screen.queryByRole("region", { name: "Get stronger scheduled dates" });
      // Without Calendar, gym has nothing to come, so it has no lane.
      expect(gymLane()).toBeNull();
      fireEvent.click(screen.getByRole("switch", { name: "Calendar" }));
      expect(gymLane()).toBeInTheDocument();
      expect(screen.getByRole("switch", { name: "Calendar" })).toHaveAttribute("aria-checked", "true");
      fireEvent.click(screen.getByRole("switch", { name: "Calendar" }));
      expect(gymLane()).toBeNull();
    });

    it("leads each card with its ordinal instead of a date under the date header", () => {
      const weekly = {
        ...GOALS[1],
        frequency_type: "recurring",
        target_basis: "period",
        recurrence_interval: "weekly",
        target_count: 2,
        start_date: "2026-09-01",
      } as Goal;
      renderView({ goals: [GOALS[0], weekly] });
      const gym = () => screen.getByRole("region", { name: "Get stronger scheduled dates" });
      // Without Calendar there is no header, so the date shows.
      expect(within(gym()).getByText("Sat, Oct 3")).not.toHaveClass("opacity-0");
      fireEvent.click(screen.getByRole("switch", { name: "Calendar" }));
      expect(within(gym()).getByText("Sat, Oct 3")).toHaveClass("opacity-0");
      // Oct 3 is the second gym session of the week that began Sep 28.
      const card = within(gym()).getByText("2 of 2").closest("article") as HTMLElement;
      expect(within(card).getByText("2 of 2")).not.toHaveClass("opacity-0");
      expect(within(card).getByText("per week")).not.toHaveClass("opacity-0");
      expect(within(card).getByText("2 of 2 per week")).toHaveClass("opacity-0");
      expect(card).toHaveAttribute("title", "gym session");
    });

    it("draws lanes only for Calendar; without it the cards float in a line", () => {
      renderView();
      const run = () => screen.getByRole("region", { name: "Run a half marathon scheduled dates" });
      expect(lanes()).toHaveClass("border-transparent", "bg-transparent");
      expect(run()).toHaveClass("border-transparent");
      fireEvent.click(screen.getByRole("switch", { name: "Calendar" }));
      expect(lanes()).toHaveClass("border-border", "bg-card");
      expect(run()).toHaveClass("border-border");
    });

    it("names the month in view once, with a slim weekday and day header", () => {
      renderView();
      fireEvent.click(screen.getByRole("switch", { name: "Calendar" }));
      expect(screen.queryByText("Goals × time")).toBeNull();
      expect(screen.queryByText(/Week of/)).toBeNull();
      const friday = screen.getByRole("button", { name: "Inspect Friday, October 2, 2026" });
      expect(friday).toHaveTextContent(/^Fri2$/);
      expect(screen.getByRole("button", { name: "Inspect Thursday, October 1, 2026" })).toHaveTextContent(
        /^Thu · Oct1$/
      );
      expect(screen.getByText("October 2026")).toBeInTheDocument();
    });

    it("focuses one lane from its label", () => {
      renderView();
      const label = screen.getByRole("button", { name: /Get stronger/ });
      fireEvent.click(label);
      expect(label).toHaveAttribute("aria-pressed", "true");
      const run = screen.getByRole("region", { name: "Run a half marathon scheduled dates" });
      expect(run.querySelector(".opacity-45")).not.toBeNull();
      fireEvent.click(label);
      expect(run.querySelector(".opacity-45")).toBeNull();
    });
  });

  describe("on a phone", () => {
    beforeEach(() => {
      viewport.desktop = false;
      // jsdom does not implement element scrolling; the deck centers cards.
      Element.prototype.scrollTo = vi.fn();
    });

    it("swipes between goal cards and lists the selected goal's dates vertically", () => {
      renderView();
      expect(screen.getByText("Goal 1 of 2")).toBeInTheDocument();
      expect(screen.getByTestId("card-run")).toBeInTheDocument();
      expect(screen.getByTestId("card-gym")).toBeInTheDocument();
      expect(screen.getByLabelText("Swipe between goal cards")).toBeInTheDocument();

      const run = screen.getByRole("region", { name: "Run a half marathon scheduled dates" });
      expect(within(run).getAllByRole("article")).toHaveLength(2);
      expect(
        screen.queryByRole("region", { name: "Get stronger scheduled dates" })
      ).toBeNull();
      // Dates stack in a column instead of a horizontally scrolling track.
      expect(within(run).queryByLabelText(/dates, scroll to explore/)).toBeNull();
    });

    it("selects another goal from the arrows and the dots", () => {
      renderView();
      fireEvent.click(screen.getByRole("button", { name: "Next goal" }));
      expect(screen.getByText("Goal 2 of 2")).toBeInTheDocument();
      const gym = screen.getByRole("region", { name: "Get stronger scheduled dates" });
      expect(within(gym).getAllByRole("article")).toHaveLength(1);
      expect(screen.getByRole("button", { name: "Next goal" })).toBeDisabled();

      const scrollbar = screen.getByRole("slider", { name: "Browse goals" });
      fireEvent.change(scrollbar, { target: { value: "0" } });
      fireEvent.keyDown(scrollbar, { key: "Home" });
      expect(screen.getByText("Goal 1 of 2")).toBeInTheDocument();
    });

    it("keeps visible cards directly interactive while the container remains swipeable", () => {
      renderView();
      expect(screen.getByTestId("card-run")).toHaveAttribute("data-rotatable", "true");
      expect(screen.getByTestId("card-gym")).toHaveAttribute("data-rotatable", "true");
      expect(screen.getByLabelText("Swipe between goal cards")).toHaveClass("overflow-x-auto");
      expect(screen.queryByRole("button", { name: "Turn card" })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Next goal" }));
      fireEvent.click(screen.getByRole("button", { name: "Previous goal" }));
      expect(screen.getByTestId("card-run")).toHaveAttribute("data-rotatable", "true");
    });

    it("keeps nudging and completing available from the vertical rows", () => {
      const props = renderView();
      fireEvent.click(screen.getByRole("button", { name: "Next goal" }));
      fireEvent.click(
        screen.getByRole("button", { name: "Move gym session one day later" })
      );
      expect(props.onMoveSession).toHaveBeenCalledWith(
        expect.objectContaining({ key: "gym:2026-10-03" }),
        "2026-10-04"
      );
      fireEvent.click(screen.getByRole("button", { name: "Complete gym session" }));
      expect(props.onToggleSession).toHaveBeenCalledTimes(1);
    });

    it("shows Calendar as lanes without the goal card thumbnails", () => {
      renderView();
      expect(screen.getByTestId("goal-deck")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("switch", { name: "Calendar" }));
      expect(screen.queryByTestId("goal-deck")).toBeNull();
      const lanes = screen.getByRole("region", { name: "Goal lanes, scroll across dates" });
      // Phone columns are 120px; Calendar opens on this week.
      expect(lanes.scrollLeft).toBe(365 * 120);
      expect(screen.queryByRole("link", { name: /^Edit goal/ })).toBeNull();
      fireEvent.click(screen.getByRole("switch", { name: "Calendar" }));
      expect(screen.getByTestId("goal-deck")).toBeInTheDocument();
    });

    it("edits a date from the same native touch target in the phone rows", () => {
      const props = renderView();
      const field = screen.getByLabelText("Change date of run session, Fri, Oct 9") as HTMLInputElement;
      // Opening never depends on showPicker support or a synthetic input click.
      field.showPicker = vi.fn(() => { throw new Error("Unsupported mobile picker"); });
      fireEvent.pointerDown(field, { pointerType: "touch" });
      fireEvent.click(field);
      expect(field.showPicker).not.toHaveBeenCalled();
      fireEvent.change(field, { target: { value: "2026-10-12" } });
      expect(props.onMoveSession).toHaveBeenCalledWith(expect.objectContaining({ key: "run:2026-10-09" }), "2026-10-12");
    });
  });

  it("explains an empty window", () => {
    renderView({ sessions: [] });
    expect(
      screen.getByText("No goals have scheduled sessions in this window.")
    ).toBeInTheDocument();
  });
});
