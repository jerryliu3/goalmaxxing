import { describe, expect, it } from "vitest";
import type { RecoverySnapshot } from "@/lib/planner/recovery/contract";
import { findRecoverable, REBALANCE_FALLBACK, suggest } from "@/lib/planner/recovery/model";
import {
  currentGoalId,
  dismissalsFor,
  draftMovesFor,
  goalItems,
  initialReviewState,
  inSummary,
  rebalanceMoves,
  reviewReducer,
  stagedChanges,
  stagedSeed,
  summaryCounts,
  summaryGroups,
  summaryHeading,
  summaryLine,
  toDraftMoves,
  type DraftMove,
  type ReviewState,
} from "@/features/planner/recovery/review-state";

const RUN = "11111111-1111-4111-8111-111111111111";
const READ = "22222222-2222-4222-8222-222222222222";

function snapshot(overrides: Partial<RecoverySnapshot> = {}): RecoverySnapshot {
  return {
    today: "2026-10-07",
    horizonEnd: "2026-11-17",
    blackoutRanges: [],
    goals: [
      {
        id: READ,
        title: "Reading",
        kind: "deadline_total",
        interval: null,
        endDate: "2026-10-20",
        restDays: [],
        completedDates: [],
      },
      {
        id: RUN,
        title: "Running",
        kind: "cadence",
        interval: "weekly",
        endDate: null,
        restDays: [],
        completedDates: [],
      },
    ],
    sessions: [
      {
        id: `${RUN}:2026-10-05`,
        goalId: RUN,
        unitKey: "run-1",
        date: "2026-10-05",
        label: "Session 1 of 2",
        status: "missed",
        locked: false,
        windowEnd: "2026-10-11",
      },
      {
        id: `${RUN}:2026-10-09`,
        goalId: RUN,
        unitKey: "run-2",
        date: "2026-10-09",
        label: "Session 2 of 2",
        status: "scheduled",
        locked: false,
        windowEnd: null,
      },
      {
        id: `${READ}:2026-10-06`,
        goalId: READ,
        unitKey: "read-1",
        date: "2026-10-06",
        label: "Session 1 of 3",
        status: "missed",
        locked: false,
        windowEnd: "2026-10-20",
      },
    ],
    ...overrides,
  };
}

const saved = snapshot();
const runMissedId = `${RUN}:2026-10-05`;
const readMissedId = `${READ}:2026-10-06`;
const acceptRun: DraftMove = { goalId: RUN, unitKey: "run-1", sourceDate: "2026-10-05", scheduledDate: "2026-10-08" };
const shiftRun: DraftMove = { goalId: RUN, unitKey: "run-2", sourceDate: "2026-10-09", scheduledDate: "2026-10-10" };

function reviewing(steps = [READ, RUN]): ReviewState {
  return reviewReducer(initialReviewState(), { type: "open", steps });
}

describe("reviewReducer", () => {
  it("walks goal by goal into the summary and back", () => {
    let state = reviewing();
    expect(currentGoalId(state)).toBe(READ);
    state = reviewReducer(state, { type: "next" });
    expect(currentGoalId(state)).toBe(RUN);
    state = reviewReducer(state, { type: "next" });
    expect(inSummary(state)).toBe(true);
    state = reviewReducer(state, { type: "goTo", goalId: READ });
    expect(currentGoalId(state)).toBe(READ);
    state = reviewReducer(state, { type: "back" });
    expect(state.step).toBe(0);
  });

  it("opens the summary when Auto-rebalance turns on and stays there when it turns off", () => {
    const rebalanced = { moves: [{ goalId: RUN, unitKey: "run-1" }], letGo: [], fallbackGoalIds: [] };
    let state = reviewReducer(reviewing(), { type: "rebalance", rebalanced });
    expect(state).toMatchObject({ rebalanced, step: 2 });
    state = reviewReducer(state, { type: "goTo", goalId: RUN });
    expect(state).toMatchObject({ rebalanced, step: 1 });
    state = reviewReducer(state, { type: "rebalance", rebalanced: null });
    expect(state).toMatchObject({ rebalanced: null, step: 1 });
  });

  it("lets go of the sessions Auto-rebalance found no day for, and only those come back when it turns off", () => {
    let state = reviewReducer(reviewing(), { type: "letGo", sessionId: runMissedId });
    state = reviewReducer(state, {
      type: "rebalance",
      rebalanced: { moves: [], letGo: [readMissedId], fallbackGoalIds: [READ] },
    });
    expect(state.letGo).toEqual([runMissedId, readMissedId]);
    state = reviewReducer(state, { type: "rebalance", rebalanced: null });
    expect(state.letGo).toEqual([runMissedId]);
  });

  it("stages and un-stages let-gos, and Cancel drops them", () => {
    let state = reviewReducer(reviewing(), { type: "letGo", sessionId: runMissedId });
    state = reviewReducer(state, { type: "letGo", sessionId: runMissedId });
    expect(state.letGo).toEqual([runMissedId]);
    expect(reviewReducer(state, { type: "keep", sessionId: runMissedId }).letGo).toEqual([]);
    expect(reviewReducer(state, { type: "letGoSaved" }).letGo).toEqual([]);
    expect(reviewReducer(state, { type: "close" })).toEqual(initialReviewState());
  });
});

describe("stagedSeed", () => {
  it("lands staged moves on their new day, pinned, and drops let-gos", () => {
    const seed = stagedSeed(saved, [acceptRun], [readMissedId]);

    expect(seed.sessions).toEqual([
      expect.objectContaining({
        id: runMissedId,
        date: "2026-10-08",
        status: "scheduled",
        recoveredFrom: "2026-10-05",
      }),
      saved.sessions[1],
    ]);
    expect(findRecoverable(seed)).toEqual([]);
  });

  it("ignores a move back onto the saved day", () => {
    const seed = stagedSeed(saved, [{ ...acceptRun, scheduledDate: "2026-10-05" }], []);
    expect(findRecoverable(seed)).toHaveLength(2);
  });

  it("keeps a decided session out of the next suggestions and of Auto-rebalance", () => {
    const plan = suggest(stagedSeed(saved, [acceptRun], []), true);
    expect(plan.rows.map((row) => row.sessionId)).toEqual([readMissedId]);
    expect(rebalanceMoves(plan).map((move) => move.sessionId)).not.toContain(runMissedId);
  });
});

describe("stagedChanges", () => {
  it("lists decided rows and shifted sessions by goal", () => {
    const changes = stagedChanges(saved, [acceptRun, shiftRun], [readMissedId]);

    expect(changes.get(RUN)).toEqual({
      rows: [{ sessionId: runMissedId, goalId: RUN, label: "Session 1 of 2", from: "2026-10-05", to: "2026-10-08" }],
      shifts: [{ sessionId: `${RUN}:2026-10-09`, label: "Session 2 of 2", from: "2026-10-09", to: "2026-10-10" }],
    });
    expect(changes.get(READ)?.rows).toEqual([
      { sessionId: readMissedId, goalId: READ, label: "Session 1 of 3", from: "2026-10-06", to: null },
    ]);
  });

  it("orders a goal's decided and open rows by missed date", () => {
    const changes = stagedChanges(saved, [acceptRun], []);
    const plan = suggest(stagedSeed(saved, [acceptRun], []));

    expect(goalItems(changes, plan, RUN).map((item) => item.type)).toEqual(["decided"]);
    expect(goalItems(changes, plan, READ).map((item) => item.type)).toEqual(["open"]);
  });
});

describe("writes", () => {
  it("turns Auto-rebalance into planner draft moves from the saved days", () => {
    const moves = toDraftMoves(saved, rebalanceMoves(suggest(saved, true)));

    expect(moves).toEqual([
      { goalId: READ, unitKey: "read-1", sourceDate: "2026-10-06", scheduledDate: "2026-10-14" },
      { goalId: RUN, unitKey: "run-1", sourceDate: "2026-10-05", scheduledDate: "2026-10-08" },
      { goalId: RUN, unitKey: "run-2", sourceDate: "2026-10-09", scheduledDate: "2026-10-10" },
    ]);
  });

  it("names Undo targets and let-gos by their saved session", () => {
    expect(draftMovesFor(saved, [runMissedId])).toEqual([{ goalId: RUN, unitKey: "run-1" }]);
    expect(dismissalsFor(saved, [readMissedId])).toEqual([{ goalId: READ, date: "2026-10-06" }]);
  });
});

describe("summary copy", () => {
  it("says what is staged and what is left", () => {
    const state = reviewReducer(reviewing(), { type: "letGo", sessionId: readMissedId });
    const changes = stagedChanges(saved, [acceptRun, shiftRun], state.letGo);
    const plan = suggest(stagedSeed(saved, [acceptRun, shiftRun], state.letGo));
    const counts = summaryCounts(changes, plan);

    expect(counts).toEqual({ moved: 1, shifted: 1, letGo: 1, left: 0 });
    expect(summaryHeading(counts).title).toBe("Your plan is back on track.");
    expect(summaryLine(counts)).toBe("Not saved yet: 1 moved · 1 later session shifted · 1 let go.");
  });

  it("counts open rows as left for later", () => {
    const counts = summaryCounts(new Map(), suggest(saved));

    expect(summaryHeading(counts).title).toBe("The rest can wait.");
    expect(summaryLine(counts)).toBe("Nothing changed yet. 2 left for later.");
  });

  it("notes the goals Auto-rebalance could not reflow", () => {
    const state = reviewReducer(reviewing(), {
      type: "rebalance",
      rebalanced: { moves: [], letGo: [], fallbackGoalIds: [READ] },
    });
    const groups = summaryGroups(state, new Map(), suggest(saved), saved.goals);

    expect(groups.find((group) => group.goal.id === READ)?.note).toBe(REBALANCE_FALLBACK);
    expect(groups.find((group) => group.goal.id === RUN)?.note).toBeNull();
  });
});
