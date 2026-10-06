import { describe, expect, it } from "vitest";
import { dateMove } from "@/features/ux-recovery/dates";
import {
  acceptSuggestions,
  findRecoverable,
  letGo,
  REBALANCE_FALLBACK,
  recoveryPrompt,
  suggest,
  type RecoveryGoal,
  type RecoverySeed,
  type RecoverySession,
} from "@/features/ux-recovery/model";
import {
  calendarFocus,
  currentGoalId,
  goalItems,
  initialReviewState,
  inRecap,
  planFor,
  recap,
  recapCounts,
  reviewReducer,
  type ReviewAction,
  type ReviewState,
} from "@/features/ux-recovery/review-state";
import { RECOVERY_SEED, TODAY } from "@/features/ux-recovery/seed";

const RUN = "run-2026-10-05";
const GUITAR = "guitar-2026-10-06";
const PORTFOLIO_A = "portfolio-2026-10-01";
const PORTFOLIO_B = "portfolio-2026-10-05";
const BOOKS = "books-2026-10-03";

function rowOf(plan: ReturnType<typeof suggest>, sessionId: string) {
  const row = plan.rows.find((item) => item.sessionId === sessionId);
  if (!row) throw new Error(`No row for ${sessionId}`);
  return row;
}

/** Sessions per day from today on, counting everything still on the plan. */
function loadByDay(seed: RecoverySeed) {
  const load = new Map<string, number>();
  for (const session of seed.sessions) {
    if (session.date < TODAY || session.status === "missed" || session.dismissed) continue;
    load.set(session.date, (load.get(session.date) ?? 0) + 1);
  }
  return load;
}

function reduce(actions: ReviewAction[], from: ReviewState = initialReviewState(true)) {
  return actions.reduce(reviewReducer, from);
}

const sessionOf = (seed: RecoverySeed, id: string) => seed.sessions.find((item) => item.id === id);

const walkGoal = (overrides: Partial<RecoveryGoal> = {}): RecoveryGoal =>
  ({
    id: "walk",
    title: "Walk",
    short: "Walk",
    noun: "a walk",
    color: "#4a6740",
    target: "3× a week",
    kind: "cadence",
    interval: "week",
    window: { start: "2026-09-01", end: null },
    restDays: [],
    ...overrides,
  }) as RecoveryGoal;

const session = (id: string, date: string, status: RecoverySession["status"], goalId = "walk"): RecoverySession => ({
  id,
  goalId,
  date,
  status,
  label: id,
});

describe("findRecoverable", () => {
  it("returns in-period cadence and lifetime misses, tightest window first", () => {
    expect(findRecoverable(RECOVERY_SEED, TODAY).map((item) => item.session.id)).toEqual([
      RUN,
      GUITAR,
      PORTFOLIO_A,
      PORTFOLIO_B,
      BOOKS,
    ]);
  });

  it("silently excludes past-period cadence misses (daily yesterday, weekly last week)", () => {
    const ids = suggest(RECOVERY_SEED, TODAY).rows.map((row) => row.sessionId);
    expect(ids).not.toContain("reading-2026-10-06");
    expect(ids).not.toContain("french-2026-10-03");
  });

  it("excludes lifetime misses once the goal deadline has passed", () => {
    const seed: RecoverySeed = {
      ...RECOVERY_SEED,
      goals: RECOVERY_SEED.goals.map((goal) =>
        goal.id === "portfolio" ? { ...goal, window: { ...goal.window, end: "2026-10-06" } } : goal
      ),
    };
    const ids = findRecoverable(seed, TODAY).map((item) => item.session.id);
    expect(ids).not.toContain(PORTFOLIO_A);
    expect(ids).not.toContain(PORTFOLIO_B);
  });
});

describe("suggest · just the missed (default)", () => {
  const plan = suggest(RECOVERY_SEED, TODAY);

  it("places the missed run after the goal's next scheduled run when that is the first open day", () => {
    const row = rowOf(plan, RUN);
    expect(row.date).toBe("2026-10-08");
    expect(row.date && row.date > "2026-10-07").toBe(true);
    expect(row.reason).toContain("today is full");
    expect(row.shifts).toEqual([]);
  });

  it("never suggests a day before today", () => {
    for (const row of plan.rows) {
      if (row.date) expect(row.date >= TODAY).toBe(true);
    }
  });

  it("says honestly when a week has no open day left", () => {
    const row = rowOf(plan, GUITAR);
    expect(row.date).toBeNull();
    expect(row.reason).toMatch(/^This week has no open day left\./);
    expect(row.options.every((option) => !option.available)).toBe(true);
  });

  it("skips a rest day with room in favour of the next ordinary day", () => {
    const row = rowOf(plan, PORTFOLIO_A);
    expect(row.date).toBe("2026-10-12");
    expect(row.reason).toContain("Sun is a rest day");
    expect(row.rest).toBe(false);
  });

  it("falls back to a rest day when nothing else is open", () => {
    const seed: RecoverySeed = {
      goals: [walkGoal({ restDays: [4, 5, 6, 0] })],
      sessions: [session("walk-mon", "2026-10-05", "missed"), session("walk-wed", "2026-10-07", "scheduled")],
      dailyCap: 3,
      horizonEnd: "2026-10-31",
    };
    const row = rowOf(suggest(seed, TODAY), "walk-mon");
    expect(row.date).toBe("2026-10-08");
    expect(row.rest).toBe(true);
    expect(row.reason).toMatch(/^Only rest days are open/);
  });

  it("never puts two sessions of a goal on one day", () => {
    const a = rowOf(plan, PORTFOLIO_A).date;
    const b = rowOf(plan, PORTFOLIO_B).date;
    expect(a).not.toBe(b);
    expect(b).not.toBe("2026-10-13");
  });

  it("respects the daily cap across goals, including today", () => {
    for (const row of plan.rows) expect(row.date).not.toBe(TODAY);
    const { seed } = acceptSuggestions(RECOVERY_SEED, TODAY, false);
    for (const count of loadByDay(seed).values()) {
      expect(count).toBeLessThanOrEqual(RECOVERY_SEED.dailyCap);
    }
  });
});

describe("suggest · auto-rebalance", () => {
  const plan = suggest(RECOVERY_SEED, TODAY, true);
  const portfolio = plan.goals.find((goal) => goal.goal.id === "portfolio");
  const PORTFOLIO_SHIFTS = [
    { sessionId: "portfolio-2026-10-13", label: "Session 6 of 8", from: "2026-10-13", to: "2026-10-21" },
    { sessionId: "portfolio-2026-10-20", label: "Session 7 of 8", from: "2026-10-20", to: "2026-10-26" },
  ];

  it("reflows stranded and future unlocked sessions evenly across the window", () => {
    expect(portfolio?.strategy).toBe("rebalance");
    expect(rowOf(plan, PORTFOLIO_A).date).toBe("2026-10-13");
    expect(rowOf(plan, PORTFOLIO_B).date).toBe("2026-10-16");
    expect(portfolio?.shifts).toEqual(PORTFOLIO_SHIFTS);
    expect(rowOf(plan, PORTFOLIO_A).shifts).toBe(portfolio?.shifts);
  });

  it("applies to every goal from one switch, with no per-goal override", () => {
    expect(plan.goals.every((goal) => goal.strategy === "rebalance" || goal.note === REBALANCE_FALLBACK)).toBe(true);
    const squeezed = suggest(RECOVERY_SEED, TODAY);
    expect(squeezed.goals.every((goal) => goal.strategy === "squeeze" && goal.shifts.length === 0)).toBe(true);
    expect(rowOf(squeezed, PORTFOLIO_A).date).toBe("2026-10-12");
  });

  it("reflows every goal that has slips, not just one", () => {
    expect(plan.goals.find((goal) => goal.goal.id === "books")?.shifts).toEqual([
      { sessionId: "books-2026-10-10", label: "Book session", from: "2026-10-10", to: "2026-10-17" },
      { sessionId: "books-2026-10-17", label: "Book session", from: "2026-10-17", to: "2026-10-20" },
      { sessionId: "books-2026-10-31", label: "Book session", from: "2026-10-31", to: "2026-10-30" },
    ]);
    expect(rowOf(plan, BOOKS).date).toBe("2026-10-11");
  });

  it("keeps locked sessions where they are, and goals with nothing to reflow unchanged", () => {
    const moved = portfolio?.shifts.map((shift) => shift.sessionId) ?? [];
    expect(moved).not.toContain("portfolio-2026-10-27");
    expect(rowOf(plan, RUN).date).toBe("2026-10-08");
    expect(plan.goals.find((goal) => goal.goal.id === "run")?.shifts).toEqual([]);
  });

  it("never lands past the deadline or the plan horizon", () => {
    for (const goal of plan.goals) {
      for (const row of goal.rows) if (row.date) expect(row.date <= row.windowEnd).toBe(true);
      for (const shift of goal.shifts) expect(shift.to <= goal.windowEnd).toBe(true);
    }
  });

  it("falls back to just the missed session when the window cannot hold a rebalance", () => {
    const seed: RecoverySeed = {
      goals: [
        walkGoal({ id: "essay", kind: "lifetime", shape: "milestone", window: { start: "2026-09-01", end: "2026-10-09" } } as Partial<RecoveryGoal>),
        walkGoal(),
      ],
      sessions: [
        session("essay-mon", "2026-10-05", "missed", "essay"),
        session("essay-thu", "2026-10-08", "scheduled", "essay"),
        session("essay-fri", "2026-10-09", "scheduled", "essay"),
        session("walk-wed", "2026-10-07", "scheduled"),
      ],
      dailyCap: 1,
      horizonEnd: "2026-10-31",
    };
    const fallback = suggest(seed, TODAY, true);
    const essay = fallback.goals.find((goal) => goal.goal.id === "essay");
    expect(essay?.strategy).toBe("squeeze");
    expect(essay?.note).toBe(REBALANCE_FALLBACK);
    expect(rowOf(fallback, "essay-mon").date).toBeNull();
    expect(rowOf(fallback, "essay-mon").reason).toMatch(/^Goal ends Fri Oct 9 — no room\./);
  });

  it("accepting one row writes its goal's shifts; recovered sessions are pinned after that", () => {
    const { seed, moved, shifted } = acceptSuggestions(RECOVERY_SEED, TODAY, true, new Set([PORTFOLIO_A]));
    expect({ moved, shifted }).toEqual({ moved: 1, shifted: 2 });
    expect(sessionOf(seed, PORTFOLIO_A)?.date).toBe("2026-10-13");
    expect(sessionOf(seed, "portfolio-2026-10-13")).toMatchObject({ date: "2026-10-21", recoveredFrom: "2026-10-13" });
    expect(sessionOf(seed, "portfolio-2026-10-20")?.date).toBe("2026-10-26");
    expect(sessionOf(seed, PORTFOLIO_B)?.status).toBe("missed");
    // The sibling keeps the slot it was previewed with; recovered sessions don't move again.
    const sibling = rowOf(suggest(seed, TODAY, true), PORTFOLIO_B);
    expect(sibling.date).toBe("2026-10-16");
    expect(sibling.shifts).toEqual([]);
  });
});

const STEPS = ["run", "guitar", "portfolio", "books"];

describe("review · goal by goal", () => {
  it("shows nothing until review is opened, then walks the goals that slipped", () => {
    const closed = initialReviewState();
    expect(closed.reviewing).toBe(false);
    expect(currentGoalId(closed)).toBeNull();
    const opened = reviewReducer(closed, { type: "open" });
    expect(opened).toMatchObject({ reviewing: true, steps: STEPS, step: 0, rebalance: false, decisions: [] });
    expect(currentGoalId(opened)).toBe("run");
  });

  it("Next goal is always available — even with rows open — and ends on the recap", () => {
    const second = reduce([{ type: "next" }]);
    expect(currentGoalId(second)).toBe("guitar");
    expect(planFor(second).rows.map((row) => row.sessionId)).toContain(RUN);

    const end = reduce([{ type: "next" }, { type: "next" }, { type: "next" }, { type: "next" }]);
    expect(inRecap(end)).toBe(true);
    expect(currentGoalId(end)).toBeNull();
    expect(reviewReducer(end, { type: "next" }).step).toBe(STEPS.length);

    const back = reviewReducer(end, { type: "back" });
    expect(currentGoalId(back)).toBe("books");
    expect(reviewReducer(back, { type: "back" }).step).toBe(2);
    expect(currentGoalId(reviewReducer(back, { type: "goTo", goalId: "portfolio" }))).toBe("portfolio");
    // Goals without slips are not steps.
    expect(reviewReducer(back, { type: "goTo", goalId: "reading" })).toBe(back);
    expect(reduce([{ type: "back" }]).step).toBe(0);
  });

  it("Accept saves at once and the row stays as an accepted confirmation", () => {
    const state = reduce([{ type: "accept", sessionId: RUN }]);
    expect(sessionOf(state.seed, RUN)).toMatchObject({
      date: "2026-10-08",
      status: "scheduled",
      recoveredFrom: "2026-10-05",
    });
    expect(planFor(state).rows.map((row) => row.sessionId)).not.toContain(RUN);
    expect(findRecoverable(state.seed, TODAY).map((item) => item.session.id)).not.toContain(RUN);
    expect(state.decisions).toEqual([
      {
        id: 1,
        goalId: "run",
        kind: "moved",
        rows: [{ sessionId: RUN, label: "Run", from: "2026-10-05", to: "2026-10-08" }],
        shifts: [],
        before: [sessionOf(RECOVERY_SEED, RUN)],
      },
    ]);
    const items = goalItems(state, planFor(state), "run");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ type: "decided", decision: { id: 1 } });
    // Accepting doesn't advance: the goal stays on screen with its confirmation.
    expect(currentGoalId(state)).toBe("run");
    expect(RECOVERY_SEED.sessions.find((item) => item.id === RUN)?.date).toBe("2026-10-05");
  });

  it("per-row Undo restores only that row, in any order", () => {
    const three = reduce([
      { type: "accept", sessionId: RUN },
      { type: "letGo", sessionId: BOOKS },
      { type: "accept", sessionId: PORTFOLIO_A },
    ]);
    const undone = reviewReducer(three, { type: "undo", decisionId: 1 });
    expect(sessionOf(undone.seed, RUN)).toEqual(sessionOf(RECOVERY_SEED, RUN));
    expect(sessionOf(undone.seed, BOOKS)?.dismissed).toBe(true);
    expect(sessionOf(undone.seed, PORTFOLIO_A)?.date).toBe("2026-10-12");
    expect(undone.decisions.map((decision) => decision.id)).toEqual([2, 3]);
    expect(rowOf(planFor(undone), RUN).date).toBe("2026-10-08");
    expect(goalItems(undone, planFor(undone), "run")).toMatchObject([{ type: "open", row: { sessionId: RUN } }]);
    expect(reviewReducer(undone, { type: "undo", decisionId: 1 })).toBe(undone);
  });

  it("Let it go saves at once, shows a let-go confirmation, and Undo brings the row back", () => {
    const state = reduce([{ type: "letGo", sessionId: PORTFOLIO_A }]);
    expect(sessionOf(state.seed, PORTFOLIO_A)).toMatchObject({ status: "missed", dismissed: true });
    const plan = planFor(state);
    expect(plan.rows.map((row) => row.sessionId)).not.toContain(PORTFOLIO_A);
    expect(rowOf(plan, PORTFOLIO_B).date).toBe("2026-10-12");
    expect(recoveryPrompt(plan, TODAY).count).toBe(4);
    expect(goalItems(state, plan, "portfolio")).toMatchObject([
      { type: "decided", decision: { kind: "letGo", rows: [{ sessionId: PORTFOLIO_A, from: "2026-10-01", to: null }] } },
      { type: "open", row: { sessionId: PORTFOLIO_B } },
    ]);

    const undone = reviewReducer(state, { type: "undo", decisionId: 1 });
    expect(sessionOf(undone.seed, PORTFOLIO_A)?.dismissed).toBeUndefined();
    expect(goalItems(undone, planFor(undone), "portfolio").map((item) => item.type)).toEqual(["open", "open"]);
  });

  it("Edit + Apply writes only onto a valid day, as a moved confirmation", () => {
    const invalid = reduce([{ type: "move", sessionId: PORTFOLIO_A, date: "2026-10-13" }]);
    expect(invalid.seed).toBe(RECOVERY_SEED);
    expect(invalid.decisions).toEqual([]);

    const moved = reduce([{ type: "move", sessionId: PORTFOLIO_A, date: "2026-10-15" }]);
    expect(sessionOf(moved.seed, PORTFOLIO_A)).toMatchObject({ date: "2026-10-15", status: "scheduled" });
    expect(planFor(moved).rows.map((row) => row.sessionId)).not.toContain(PORTFOLIO_A);
    expect(moved.decisions[0]).toMatchObject({ kind: "moved", rows: [{ from: "2026-10-01", to: "2026-10-15" }] });
  });

  it("checks a manual pick against the saved plan, not other rows' suggestions", () => {
    // The default suggests Oct 12 for portfolio A; B may still pick it.
    const row = rowOf(suggest(RECOVERY_SEED, TODAY), PORTFOLIO_B);
    expect(row.options.find((option) => option.date === "2026-10-12")?.available).toBe(true);
    const state = reduce([{ type: "move", sessionId: PORTFOLIO_B, date: "2026-10-12" }]);
    expect(sessionOf(state.seed, PORTFOLIO_B)?.date).toBe("2026-10-12");
    expect(rowOf(planFor(state), PORTFOLIO_A).date).not.toBe("2026-10-12");
  });

  it("Accept N for one goal saves its rows with one confirmation (and Undo) each", () => {
    const state = reduce([{ type: "acceptGoal", goalId: "portfolio" }]);
    expect(planFor(state).rows.map((row) => row.sessionId)).toEqual([RUN, GUITAR, BOOKS]);
    expect(state.decisions.map((decision) => [decision.kind, decision.rows[0]?.to])).toEqual([
      ["moved", "2026-10-12"],
      ["moved", "2026-10-14"],
    ]);
    const undone = reviewReducer(state, { type: "undo", decisionId: 2 });
    expect(sessionOf(undone.seed, PORTFOLIO_B)?.status).toBe("missed");
    expect(sessionOf(undone.seed, PORTFOLIO_A)?.date).toBe("2026-10-12");
  });

  it("Edit + Apply with Auto-rebalance on still moves only the picked session", () => {
    const state = reduce([
      { type: "rebalance", on: true },
      { type: "move", sessionId: PORTFOLIO_A, date: "2026-10-15" },
    ]);
    expect(sessionOf(state.seed, "portfolio-2026-10-13")?.date).toBe("2026-10-13");
    expect(sessionOf(state.seed, "portfolio-2026-10-20")?.date).toBe("2026-10-20");
  });
});

describe("review · recap and Auto-rebalance", () => {
  const PORTFOLIO_SHIFTS = [
    { sessionId: "portfolio-2026-10-13", label: "Session 6 of 8", from: "2026-10-13", to: "2026-10-21" },
    { sessionId: "portfolio-2026-10-20", label: "Session 7 of 8", from: "2026-10-20", to: "2026-10-26" },
  ];

  it("focuses the calendar on the current goal, then on every reviewed goal in the recap", () => {
    expect(calendarFocus(initialReviewState())).toBeNull();
    expect(calendarFocus(reduce([]))).toEqual(["run"]);
    expect(calendarFocus(reduce([{ type: "next" }]))).toEqual(["guitar"]);

    // Recap and the Auto-rebalance proposal: only the goals that slipped, not reading or french.
    expect(calendarFocus(reduce([{ type: "recap" }]))).toEqual(STEPS);
    expect(calendarFocus(reduce([{ type: "rebalance", on: true }]))).toEqual(STEPS);
    // Settled goals stay in focus even once nothing is left open for them.
    expect(
      calendarFocus(reduce([{ type: "rebalance", on: true }, { type: "applyRebalance" }]))
    ).toEqual(STEPS);
  });

  it("groups every change by goal with old → new, and what is left for later", () => {
    const state = reduce([
      { type: "accept", sessionId: RUN },
      { type: "letGo", sessionId: PORTFOLIO_A },
      { type: "recap" },
    ]);
    expect(inRecap(state)).toBe(true);
    const groups = recap(state, planFor(state));
    expect(groups.map((group) => group.goal.id)).toEqual(STEPS);
    const [run, guitar, portfolio, books] = groups;
    expect(run?.items).toMatchObject([
      { type: "decided", decision: { kind: "moved", rows: [{ from: "2026-10-05", to: "2026-10-08" }] } },
    ]);
    expect(guitar?.items).toMatchObject([{ type: "open", row: { sessionId: GUITAR, date: null } }]);
    expect(portfolio?.items).toMatchObject([
      { type: "decided", decision: { kind: "letGo", rows: [{ from: "2026-10-01", to: null }] } },
      { type: "open", row: { sessionId: PORTFOLIO_B } },
    ]);
    expect(books?.items).toMatchObject([{ type: "open", row: { sessionId: BOOKS } }]);
    expect(groups.every((group) => group.shifts.length === 0 && group.note === null)).toBe(true);
    expect(recapCounts(state, planFor(state))).toEqual({
      moved: 1,
      shifted: 0,
      letGo: 1,
      left: 3,
      proposedMoves: 0,
      proposedShifts: 0,
    });
  });

  it("turning Auto-rebalance on opens the recap with every goal's proposed dates, unsaved", () => {
    const on = reduce([{ type: "rebalance", on: true }]);
    expect(inRecap(on)).toBe(true);
    expect(on.seed).toBe(RECOVERY_SEED);
    expect(on.decisions).toEqual([]);
    const groups = recap(on, planFor(on));
    expect(groups.map((group) => group.goal.id)).toEqual(STEPS);
    const portfolio = groups.find((group) => group.goal.id === "portfolio");
    expect(portfolio?.items).toMatchObject([
      { type: "open", row: { sessionId: PORTFOLIO_A, missedDate: "2026-10-01", date: "2026-10-13" } },
      { type: "open", row: { sessionId: PORTFOLIO_B, missedDate: "2026-10-05", date: "2026-10-16" } },
    ]);
    expect(portfolio?.shifts).toEqual(PORTFOLIO_SHIFTS);
    expect(groups.find((group) => group.goal.id === "guitar")?.note).toBe(REBALANCE_FALLBACK);
    expect(recapCounts(on, planFor(on))).toMatchObject({ moved: 0, left: 1, proposedMoves: 4, proposedShifts: 5 });

    // Off again: back to one goal at a time, at the first goal with open rows.
    const off = reviewReducer(reduce([{ type: "accept", sessionId: RUN }, { type: "rebalance", on: true }]), {
      type: "rebalance",
      on: false,
    });
    expect(off.rebalance).toBe(false);
    expect(currentGoalId(off)).toBe("guitar");
  });

  it("Apply rebalance saves the whole proposal in one action, with one Undo per goal", () => {
    const proposal = suggest(RECOVERY_SEED, TODAY, true);
    const state = reduce([{ type: "rebalance", on: true }, { type: "applyRebalance" }]);
    for (const row of proposal.rows) {
      if (row.date) expect(sessionOf(state.seed, row.sessionId)).toMatchObject({ date: row.date, status: "scheduled" });
    }
    for (const shift of PORTFOLIO_SHIFTS) expect(sessionOf(state.seed, shift.sessionId)?.date).toBe(shift.to);
    for (const count of loadByDay(state.seed).values()) {
      expect(count).toBeLessThanOrEqual(RECOVERY_SEED.dailyCap);
    }
    expect(state.rebalance).toBe(false);
    expect(inRecap(state)).toBe(true);
    expect(state.decisions.map((decision) => [decision.goalId, decision.kind, decision.rows.length, decision.shifts.length])).toEqual([
      ["run", "moved", 1, 0],
      ["portfolio", "rebalanced", 2, 2],
      ["books", "rebalanced", 1, 3],
    ]);
    expect(recapCounts(state, planFor(state))).toEqual({
      moved: 4,
      shifted: 5,
      letGo: 0,
      left: 1,
      proposedMoves: 0,
      proposedShifts: 0,
    });

    const portfolioId = state.decisions.find((decision) => decision.goalId === "portfolio")?.id ?? -1;
    const undone = reviewReducer(state, { type: "undo", decisionId: portfolioId });
    for (const id of [PORTFOLIO_A, PORTFOLIO_B, "portfolio-2026-10-13", "portfolio-2026-10-20"]) {
      expect(sessionOf(undone.seed, id)).toEqual(sessionOf(RECOVERY_SEED, id));
    }
    expect(sessionOf(undone.seed, BOOKS)?.date).toBe("2026-10-11");
  });

  it("Apply rebalance does nothing unless the proposal is showing", () => {
    const state = initialReviewState(true);
    expect(reviewReducer(state, { type: "applyRebalance" })).toBe(state);
  });

  it("shift labels use full dates on both sides", () => {
    expect(dateMove("2026-10-13", "2026-10-21")).toBe("Oct 13 → Oct 21");
    for (const shift of PORTFOLIO_SHIFTS) {
      expect(dateMove(shift.from, shift.to)).toMatch(/^[A-Z][a-z]{2} \d{1,2} → [A-Z][a-z]{2} \d{1,2}$/);
    }
  });

  it("acceptSuggestions writes nothing for rows outside the given ids", () => {
    const { seed, moved, shifted } = acceptSuggestions(RECOVERY_SEED, TODAY, false, new Set([BOOKS]));
    expect({ moved, shifted }).toEqual({ moved: 1, shifted: 0 });
    expect(sessionOf(seed, BOOKS)?.date).toBe("2026-10-11");
    expect(sessionOf(seed, RUN)?.date).toBe("2026-10-05");
  });
});

describe("purity and prompt copy", () => {
  it("is deterministic and never mutates the seed", () => {
    const snapshot = structuredClone(RECOVERY_SEED);
    const first = suggest(RECOVERY_SEED, TODAY, true);
    const second = suggest(RECOVERY_SEED, TODAY, true);
    expect(second).toEqual(first);
    acceptSuggestions(RECOVERY_SEED, TODAY, true);
    letGo(RECOVERY_SEED, RUN);
    expect(RECOVERY_SEED).toEqual(snapshot);
  });

  it("counts what slipped and says 'this week' only when it is true", () => {
    expect(recoveryPrompt(suggest(RECOVERY_SEED, TODAY), TODAY)).toEqual({
      count: 5,
      fit: 4,
      text: "5 sessions slipped",
    });
    const thisWeek = suggest(letGo(letGo(RECOVERY_SEED, PORTFOLIO_A), BOOKS), TODAY);
    expect(recoveryPrompt(thisWeek, TODAY).text).toBe("3 sessions slipped this week");
  });
});
