import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import type { Goal } from "@/lib/goals/types";
import { GoalView, type GoalViewProps } from "./goal-view";
import { buildGoalViewSessions, type GoalViewSession } from "./goal-view-model";

const viewport = vi.hoisted(() => ({ desktop: true }));
vi.mock("@/lib/ui/use-media-query", () => ({ useMediaQuery: () => viewport.desktop }));
vi.mock("motion/react", () => ({ useReducedMotion: () => false }));
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
    weekStartsOn: 1,
    showPast: false,
    previewOpen: false,
    onPreviewOpenChange: vi.fn(),
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

describe("GoalView", () => {
  afterEach(() => {
    cleanup();
    viewport.desktop = true;
  });

  it("shows one rail per goal with a card and its upcoming dates", () => {
    renderView();
    const run = screen.getByRole("region", { name: "Run a half marathon scheduled dates" });
    expect(within(run).getByTestId("card-run")).toBeInTheDocument();
    expect(within(run).getAllByRole("article")).toHaveLength(2);
    const gym = screen.getByRole("region", { name: "Get stronger scheduled dates" });
    expect(within(gym).getAllByRole("article")).toHaveLength(1);
  });

  it("adds past sessions only when the planner filter asks for them", () => {
    const view = renderView();
    const gym = screen.getByRole("region", { name: "Get stronger scheduled dates" });
    expect(within(gym).queryByText("Not logged")).toBeNull();
    view.rerenderWith({ showPast: true });
    expect(within(gym).getAllByRole("article")).toHaveLength(2);
    expect(within(gym).getByText("Not logged")).toBeInTheDocument();
    expect(within(gym).getByText(/2 scheduled sessions/)).toBeInTheDocument();
  });

  it("links each goal title to its editor", () => {
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
    expect(within(run).getByText("Step 02")).toBeInTheDocument();
    const field = within(run).getByLabelText("Change date of run session, Fri, Oct 9") as HTMLInputElement;
    // Only the date is a control: the rest of the tile is not a button.
    expect(
      within(run).queryByRole("button", { name: /^Edit run session/ })
    ).toBeNull();
    expect(field.parentElement).toHaveTextContent(/^9\s*Oct$/);
    expect(field).toHaveClass("h-full", "w-full");
    expect(field).not.toHaveAttribute("aria-hidden");
    expect(field).not.toHaveAttribute("tabindex", "-1");
    expect(field.parentElement!.querySelector('[aria-hidden="true"]')).toHaveClass("underline");
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
      .mockReturnValueOnce({ credited: false, pending: false, disabledReason: null })
      .mockReturnValue({
        credited: false,
        pending: false,
        disabledReason: "You can only mark planner sessions done for today or past dates.",
      });
    const props = renderView({ resolveCompletion });
    const toggles = screen.getAllByRole("button", { name: /^Complete / });
    expect(toggles.some((button) => !(button as HTMLButtonElement).disabled)).toBe(true);
    expect(toggles.some((button) => (button as HTMLButtonElement).disabled)).toBe(true);
    fireEvent.click(toggles.find((button) => !(button as HTMLButtonElement).disabled)!);
    expect(props.onToggleSession).toHaveBeenCalledTimes(1);
  });

  it("previews every week of the window in one scrollable list", () => {
    renderView({ previewOpen: true });
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: /week/i })).toBeNull();
    const weeks = within(dialog).getByLabelText("Goal sessions by week");
    // 60 days back through 300 forward spans 52 planner weeks.
    expect(within(weeks).getAllByRole("region").length).toBeGreaterThanOrEqual(51);
    const current = within(weeks).getByRole("region", { name: "Week of Sep 28" });
    expect(current).toHaveAttribute("data-current-week");
    expect(within(current).getAllByText("Get stronger").length).toBeGreaterThan(0);
  });

  it("jumps back to the current week from the preview's Today button", () => {
    const scrollTo = vi.fn();
    Element.prototype.scrollTo = scrollTo;
    renderView({ previewOpen: true });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Today" }));
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: "smooth" }));
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

      fireEvent.click(screen.getByRole("button", { name: "Select Run a half marathon" }));
      expect(screen.getByText("Goal 1 of 2")).toBeInTheDocument();
    });

    it("lets the selected card turn without stealing swipes and exits on goal navigation", () => {
      renderView();
      expect(screen.getByTestId("card-run")).toHaveAttribute("data-rotatable", "false");
      fireEvent.click(screen.getByRole("button", { name: "Turn card" }));
      expect(screen.getByTestId("card-run")).toHaveAttribute("data-rotatable", "true");
      expect(screen.getByTestId("card-gym")).toHaveAttribute("data-rotatable", "false");
      expect(screen.getByLabelText("Turn the selected goal card")).toHaveClass("overflow-x-hidden");

      fireEvent.click(screen.getByRole("button", { name: "Done turning" }));
      expect(screen.getByLabelText("Swipe between goal cards")).toHaveClass("overflow-x-auto");
      expect(screen.getByTestId("card-run")).toHaveAttribute("data-rotatable", "false");

      fireEvent.click(screen.getByRole("button", { name: "Turn card" }));
      fireEvent.click(screen.getByRole("button", { name: "Next goal" }));
      expect(screen.getByRole("button", { name: "Turn card" })).toHaveAttribute("aria-pressed", "false");
      fireEvent.click(screen.getByRole("button", { name: "Previous goal" }));
      expect(screen.getByTestId("card-run")).toHaveAttribute("data-rotatable", "false");
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
