import { describe, expect, it } from "vitest";
import {
  applyDecisions,
  findRecoverable,
  NO_DECISIONS,
  REBALANCE_FALLBACK,
  recoveryPrompt,
  suggest,
  type Decisions,
  type RecoveryGoal,
  type RecoverySeed,
  type RecoverySession,
} from "@/features/ux-recovery/model";
import { initialReviewState, planFor, reviewReducer, type ReviewAction } from "@/features/ux-recovery/review-state";
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

function decisions(partial: Partial<Decisions>): Decisions {
  return { ...NO_DECISIONS, ...partial };
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

function reduce(actions: ReviewAction[]) {
  return actions.reduce(reviewReducer, initialReviewState("review"));
}

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
    const ids = suggest(RECOVERY_SEED, TODAY, "squeeze").rows.map((row) => row.sessionId);
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

describe("suggest · just the missed (squeeze)", () => {
  const plan = suggest(RECOVERY_SEED, TODAY, "squeeze");

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
    const row = rowOf(suggest(seed, TODAY, "squeeze"), "walk-mon");
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
    const state = reduce([{ type: "acceptAll" }, { type: "apply" }]);
    for (const count of loadByDay(state.seed).values()) {
      expect(count).toBeLessThanOrEqual(RECOVERY_SEED.dailyCap);
    }
  });
});

describe("suggest · rebalance", () => {
  const plan = suggest(RECOVERY_SEED, TODAY, "squeeze", decisions({ strategyByGoal: { portfolio: "rebalance" } }));
  const portfolio = plan.goals.find((goal) => goal.goal.id === "portfolio");

  it("reflows stranded and future unlocked sessions evenly across the window", () => {
    expect(portfolio?.strategy).toBe("rebalance");
    expect(rowOf(plan, PORTFOLIO_A).date).toBe("2026-10-13");
    expect(rowOf(plan, PORTFOLIO_B).date).toBe("2026-10-16");
    expect(portfolio?.shifts).toEqual([
      { sessionId: "portfolio-2026-10-13", label: "Session 6 of 8", from: "2026-10-13", to: "2026-10-21" },
      { sessionId: "portfolio-2026-10-20", label: "Session 7 of 8", from: "2026-10-20", to: "2026-10-26" },
    ]);
    expect(rowOf(plan, PORTFOLIO_A).shifts).toBe(portfolio?.shifts);
  });

  it("keeps locked sessions and other goals where they are", () => {
    const moved = portfolio?.shifts.map((shift) => shift.sessionId) ?? [];
    expect(moved).not.toContain("portfolio-2026-10-27");
    expect(rowOf(plan, RUN).date).toBe("2026-10-08");
    expect(plan.goals.find((goal) => goal.goal.id === "run")?.shifts).toEqual([]);
  });

  it("never lands past the deadline or the plan horizon", () => {
    const all = suggest(RECOVERY_SEED, TODAY, "rebalance");
    for (const goal of all.goals) {
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
    const fallback = suggest(seed, TODAY, "rebalance");
    const essay = fallback.goals.find((goal) => goal.goal.id === "essay");
    expect(essay?.strategy).toBe("squeeze");
    expect(essay?.note).toBe(REBALANCE_FALLBACK);
    expect(rowOf(fallback, "essay-mon").date).toBeNull();
    expect(rowOf(fallback, "essay-mon").reason).toMatch(/^Goal ends Fri Oct 9 — no room\./);
  });

  it("keeps the same plan after Accept all, and the cap holds after apply", () => {
    const before = planFor(reduce([{ type: "strategy", strategy: "rebalance" }]));
    const accepted = reduce([{ type: "strategy", strategy: "rebalance" }, { type: "acceptAll" }]);
    const after = planFor(accepted);
    expect(after.rows.map((row) => row.date)).toEqual(before.rows.map((row) => row.date));
    expect(after.goals.map((goal) => goal.shifts)).toEqual(before.goals.map((goal) => goal.shifts));

    const applied = reviewReducer(accepted, { type: "apply" });
    expect(applied.applied?.summary.shifted).toBeGreaterThan(0);
    for (const count of loadByDay(applied.seed).values()) {
      expect(count).toBeLessThanOrEqual(RECOVERY_SEED.dailyCap);
    }
  });
});

describe("decisions", () => {
  it("dismissing removes a row, frees its day, and stops future prompts", () => {
    const decided = decisions({ rows: { [PORTFOLIO_A]: { kind: "dismiss" } } });
    const plan = suggest(RECOVERY_SEED, TODAY, "squeeze", decided);
    expect(plan.rows.map((row) => row.sessionId)).not.toContain(PORTFOLIO_A);
    expect(plan.dismissedIds).toEqual([PORTFOLIO_A]);
    expect(rowOf(plan, PORTFOLIO_B).date).toBe("2026-10-12");

    const { seed, summary } = applyDecisions(RECOVERY_SEED, TODAY, "squeeze", decided);
    expect(summary.letGo).toBe(1);
    expect(seed.sessions.find((item) => item.id === PORTFOLIO_A)).toMatchObject({ status: "missed", dismissed: true });
    expect(findRecoverable(seed, TODAY).map((item) => item.session.id)).not.toContain(PORTFOLIO_A);
  });

  it("applies only accepted rows and leaves the rest for later", () => {
    const state = reduce([{ type: "accept", sessionId: RUN }, { type: "apply" }]);
    expect(state.stage).toBe("applied");
    expect(state.seed.sessions.find((item) => item.id === RUN)).toMatchObject({ date: "2026-10-08", status: "scheduled" });
    expect(state.applied?.summary).toEqual({ moved: 1, shifted: 0, letGo: 0, leftForLater: 4 });
    expect(findRecoverable(state.seed, TODAY).map((item) => item.session.id)).not.toContain(RUN);
  });

  it("accepts an edit only onto a valid day", () => {
    const invalid = reduce([{ type: "edit", sessionId: PORTFOLIO_A, date: "2026-10-13" }]);
    expect(invalid.decisions).toBe(NO_DECISIONS);

    const edited = reduce([{ type: "edit", sessionId: PORTFOLIO_A, date: "2026-10-15" }]);
    const row = rowOf(planFor(edited), PORTFOLIO_A);
    expect(row).toMatchObject({ date: "2026-10-15", status: "edited", reason: "Your pick." });
  });

  it("undoes decisions one at a time before apply, and undoes apply itself", () => {
    const state = reduce([{ type: "accept", sessionId: RUN }, { type: "dismiss", sessionId: GUITAR }]);
    const once = reviewReducer(state, { type: "undo" });
    expect(Object.keys(once.decisions.rows)).toEqual([RUN]);

    const applied = reviewReducer(state, { type: "apply" });
    const undone = reviewReducer(applied, { type: "undoApply" });
    expect(undone.seed).toBe(RECOVERY_SEED);
    expect(undone.decisions).toEqual(state.decisions);
    expect(undone.stage).toBe("review");
  });

  it("clears a goal's accepts when its strategy changes, and drops overrides that match the default", () => {
    const state = reduce([
      { type: "accept", sessionId: RUN },
      { type: "accept", sessionId: PORTFOLIO_A },
      { type: "strategy", strategy: "rebalance", goalId: "portfolio" },
    ]);
    expect(Object.keys(state.decisions.rows)).toEqual([RUN]);
    expect(state.decisions.strategyByGoal).toEqual({ portfolio: "rebalance" });

    const back = reviewReducer(state, { type: "strategy", strategy: "squeeze", goalId: "portfolio" });
    expect(back.decisions.strategyByGoal).toEqual({});

    const global = reviewReducer(state, { type: "strategy", strategy: "rebalance" });
    expect(global.strategy).toBe("rebalance");
    expect(global.decisions.rows).toEqual({});
    expect(global.decisions.strategyByGoal).toEqual({});
  });
});

describe("purity and prompt copy", () => {
  it("is deterministic and never mutates the seed", () => {
    const snapshot = structuredClone(RECOVERY_SEED);
    const first = suggest(RECOVERY_SEED, TODAY, "rebalance");
    const second = suggest(RECOVERY_SEED, TODAY, "rebalance");
    expect(second).toEqual(first);
    applyDecisions(RECOVERY_SEED, TODAY, "squeeze", decisions({ rows: { [RUN]: { kind: "dismiss" } } }));
    expect(RECOVERY_SEED).toEqual(snapshot);
  });

  it("counts what slipped and says 'this week' only when it is true", () => {
    expect(recoveryPrompt(suggest(RECOVERY_SEED, TODAY, "squeeze"), TODAY)).toEqual({
      count: 5,
      fit: 4,
      text: "5 sessions slipped",
    });
    const thisWeek = suggest(
      RECOVERY_SEED,
      TODAY,
      "squeeze",
      decisions({ rows: { [PORTFOLIO_A]: { kind: "dismiss" }, [BOOKS]: { kind: "dismiss" } } })
    );
    expect(recoveryPrompt(thisWeek, TODAY).text).toBe("3 sessions slipped this week");
  });
});
