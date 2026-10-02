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
  GoalViewCard: ({ goal }: { goal: Goal }) => <div data-testid={`card-${goal.id}`} />,
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
    selectedEntryKey: null,
    resolveCompletion: () => ({ credited: false, pending: false, disabledReason: null }),
    isEditable: () => true,
    onOpenSession: vi.fn(),
    onMoveSession: vi.fn(),
    onToggleSession: vi.fn(),
    ...overrides,
  };
  render(<GoalView {...props} />);
  return props;
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

  it("adds past sessions only when asked", () => {
    renderView();
    const gym = screen.getByRole("region", { name: "Get stronger scheduled dates" });
    expect(within(gym).queryByText("Not logged")).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Show past sessions" }));
    expect(within(gym).getAllByRole("article")).toHaveLength(2);
    expect(within(gym).getByText("Not logged")).toBeInTheDocument();
    expect(within(gym).getByText(/2 scheduled sessions/)).toBeInTheDocument();
  });

  it("expands the planner editor slot under the selected session's goal", () => {
    renderView({ selectedEntryKey: "gym:2026-10-03" });
    const gym = screen.getByRole("region", { name: "Get stronger scheduled dates" });
    expect(
      gym.querySelector('[data-plan-checklist-editor-slot="gym:2026-10-03"]')
    ).not.toBeNull();
    const run = screen.getByRole("region", { name: "Run a half marathon scheduled dates" });
    expect(run.querySelector("[data-plan-checklist-editor-slot]")).toBeNull();
  });

  it("opens a session for editing with its milestone step", () => {
    const props = renderView();
    const run = screen.getByRole("region", { name: "Run a half marathon scheduled dates" });
    expect(within(run).getByText("Step 02")).toBeInTheDocument();
    fireEvent.click(
      within(run).getByRole("button", { name: "Edit run session, Fri, Oct 9" })
    );
    expect(props.onOpenSession).toHaveBeenCalledWith(
      expect.objectContaining({ key: "run:2026-10-09", milestone: 2 })
    );
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

  it("previews the week across goals and hands a chosen session back for editing", () => {
    const props = renderView();
    fireEvent.click(screen.getByRole("button", { name: "Preview goals" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Sep 28 — Oct 4, 2026/)).toBeInTheDocument();
    // Two gym sessions fall in this week; either hands back as the gym goal.
    fireEvent.click(within(dialog).getAllByRole("button", { name: /Get stronger/ })[0]);
    expect(props.onOpenSession).toHaveBeenCalledWith(
      expect.objectContaining({ goalId: "gym" })
    );
    expect(screen.queryByRole("dialog")).toBeNull();
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

    it("expands the planner editor right under the selected row", () => {
      renderView({ selectedEntryKey: "run:2026-10-09" });
      const slot = screen
        .getByRole("region", { name: "Run a half marathon scheduled dates" })
        .querySelector('[data-plan-checklist-editor-slot="run:2026-10-09"]');
      expect(slot?.previousElementSibling).toHaveAttribute(
        "data-planner-entry-key",
        "run:2026-10-09"
      );
    });

    it("jumps the deck to the goal of a session chosen in the preview", () => {
      renderView();
      fireEvent.click(screen.getByRole("button", { name: "Preview goals" }));
      fireEvent.click(
        within(screen.getByRole("dialog")).getAllByRole("button", {
          name: /Get stronger/,
        })[0]
      );
      expect(screen.getByText("Goal 2 of 2")).toBeInTheDocument();
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
  });

  it("explains an empty window", () => {
    renderView({ sessions: [] });
    expect(
      screen.getByText("No goals have scheduled sessions in this window.")
    ).toBeInTheDocument();
  });
});
