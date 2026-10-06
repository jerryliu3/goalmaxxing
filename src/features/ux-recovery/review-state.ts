/**
 * Pure review reducer shared by both concepts. Review walks the goals that
 * slipped one at a time ("Goal 2 of 4") and ends on a recap of every change.
 * Accept, Edit + Apply and Let it go write the seed at once; the row stays on
 * screen as a confirmation holding its own Undo. Auto-rebalance jumps to the
 * recap as an unsaved proposal for every goal; Apply rebalance saves it.
 */
import type { IsoDate } from "@/features/ux-recovery/dates";
import {
  acceptSuggestions,
  letGo,
  moveSession,
  suggest,
  type RecoveryGoal,
  type RecoveryPlan,
  type RecoverySeed,
  type RecoverySession,
  type Shift,
  type Suggestion,
} from "@/features/ux-recovery/model";
import { RECOVERY_SEED, TODAY } from "@/features/ux-recovery/seed";

/** A slipped session a decision settled: `to` is null when it was let go. */
export interface SettledRow {
  sessionId: string;
  label: string;
  from: IsoDate;
  to: IsoDate | null;
}

/**
 * One saved write, and the unit of Undo. Accept, Edit + Apply and Let it go
 * each make one per row; Apply rebalance makes one per goal (its moved rows
 * and the later sessions it shifted), since a reflow only undoes as a whole.
 */
export interface Decision {
  id: number;
  goalId: string;
  kind: "moved" | "letGo" | "rebalanced";
  rows: SettledRow[];
  shifts: Shift[];
  /** The touched sessions as they were before the write; Undo puts them back. */
  before: RecoverySession[];
}

export interface ReviewState {
  seed: RecoverySeed;
  today: IsoDate;
  /** Suggestions show only after the user asks to review. */
  reviewing: boolean;
  /** Goals that had slips when review opened, in goal order. */
  steps: string[];
  /** Index into `steps`; `steps.length` is the recap. */
  step: number;
  /** Auto-rebalance: the recap proposes new dates for every goal, unsaved. */
  rebalance: boolean;
  /** Writes made in this review, oldest first. */
  decisions: Decision[];
  nextId: number;
}

export type ReviewAction =
  | { type: "open" }
  | { type: "close" }
  /** Next goal: always available; from the last goal it opens the recap. */
  | { type: "next" }
  | { type: "back" }
  | { type: "goTo"; goalId: string }
  | { type: "recap" }
  | { type: "accept"; sessionId: string }
  /** Accept every suggestion of one goal; still one decision (and Undo) per row. */
  | { type: "acceptGoal"; goalId: string }
  /** Edit + Apply: a manual pick, onto a valid day only. */
  | { type: "move"; sessionId: string; date: IsoDate }
  | { type: "letGo"; sessionId: string }
  /** On: open the recap as a proposal. Off: back to one goal at a time. */
  | { type: "rebalance"; on: boolean }
  | { type: "applyRebalance" }
  | { type: "undo"; decisionId: number };

type Draft = Omit<Decision, "id" | "before">;

export function initialReviewState(
  reviewing = false,
  seed: RecoverySeed = RECOVERY_SEED,
  today: IsoDate = TODAY
): ReviewState {
  const closed: ReviewState = {
    seed,
    today,
    reviewing: false,
    steps: [],
    step: 0,
    rebalance: false,
    decisions: [],
    nextId: 1,
  };
  return reviewing ? reviewReducer(closed, { type: "open" }) : closed;
}

/** What the screen previews: just-the-missed, or the Auto-rebalance proposal. */
export function planFor(state: Pick<ReviewState, "seed" | "today" | "rebalance">): RecoveryPlan {
  return suggest(state.seed, state.today, state.rebalance);
}

/** The goal on screen, or null on the recap (and when not reviewing). */
export function currentGoalId(state: ReviewState): string | null {
  return state.reviewing && state.step < state.steps.length ? (state.steps[state.step] ?? null) : null;
}

export function inRecap(state: ReviewState): boolean {
  return state.reviewing && state.step >= state.steps.length;
}

/** Per-row decisions are always made against the just-the-missed plan. */
function findRow(state: ReviewState, sessionId: string): Suggestion | undefined {
  return suggest(state.seed, state.today).rows.find((row) => row.sessionId === sessionId);
}

function settled(row: Suggestion, to: IsoDate | null): SettledRow {
  return { sessionId: row.sessionId, label: row.label, from: row.missedDate, to };
}

function record(state: ReviewState, seed: RecoverySeed, drafts: Draft[]): ReviewState {
  let nextId = state.nextId;
  const decisions = drafts.map((draft): Decision => {
    const ids = new Set([...draft.rows, ...draft.shifts].map((item) => item.sessionId));
    return { ...draft, id: nextId++, before: state.seed.sessions.filter((session) => ids.has(session.id)) };
  });
  return { ...state, seed, decisions: [...state.decisions, ...decisions], nextId };
}

function firstOpenStep(state: ReviewState): number {
  const open = new Set(suggest(state.seed, state.today).rows.map((row) => row.goalId));
  const index = state.steps.findIndex((goalId) => open.has(goalId));
  return index === -1 ? 0 : index;
}

/** Apply rebalance: the whole proposal in one write, recorded per goal. */
function applyRebalance(state: ReviewState): ReviewState {
  const plan = suggest(state.seed, state.today, true);
  const drafts = plan.goals.flatMap((goalPlan): Draft[] => {
    const rows = goalPlan.rows.filter((row) => row.date);
    if (!rows.length) return [];
    const shifts = goalPlan.strategy === "rebalance" ? goalPlan.shifts : [];
    return [
      {
        goalId: goalPlan.goal.id,
        kind: rows.length === 1 && !shifts.length ? "moved" : "rebalanced",
        rows: rows.map((row) => settled(row, row.date)),
        shifts,
      },
    ];
  });
  const written = record(state, acceptSuggestions(state.seed, state.today, true).seed, drafts);
  return { ...written, rebalance: false };
}

export function reviewReducer(state: ReviewState, action: ReviewAction): ReviewState {
  switch (action.type) {
    case "open":
      return {
        ...state,
        reviewing: true,
        steps: suggest(state.seed, state.today).goals.map((goal) => goal.goal.id),
        step: 0,
        rebalance: false,
        decisions: [],
      };
    case "close":
      return { ...state, reviewing: false, rebalance: false };
    case "next":
      return { ...state, step: Math.min(state.step + 1, state.steps.length) };
    case "back":
      return { ...state, rebalance: false, step: Math.max(state.step - 1, 0) };
    case "goTo": {
      const step = state.steps.indexOf(action.goalId);
      return step === -1 ? state : { ...state, rebalance: false, step };
    }
    case "recap":
      return { ...state, step: state.steps.length };
    case "rebalance":
      if (action.on === state.rebalance) return state;
      return action.on
        ? { ...state, rebalance: true, step: state.steps.length }
        : { ...state, rebalance: false, step: firstOpenStep(state) };
    case "applyRebalance":
      return state.rebalance ? applyRebalance(state) : state;
    case "accept": {
      const row = findRow(state, action.sessionId);
      if (!row?.date) return state;
      const { seed } = acceptSuggestions(state.seed, state.today, false, new Set([row.sessionId]));
      return record(state, seed, [{ goalId: row.goalId, kind: "moved", rows: [settled(row, row.date)], shifts: [] }]);
    }
    case "acceptGoal": {
      const rows = suggest(state.seed, state.today).rows.filter(
        (row) => row.date && row.goalId === action.goalId
      );
      if (!rows.length) return state;
      const ids = new Set(rows.map((row) => row.sessionId));
      const { seed } = acceptSuggestions(state.seed, state.today, false, ids);
      return record(
        state,
        seed,
        rows.map((row): Draft => ({ goalId: row.goalId, kind: "moved", rows: [settled(row, row.date)], shifts: [] }))
      );
    }
    case "move": {
      const row = findRow(state, action.sessionId);
      const option = row?.options.find((item) => item.date === action.date);
      if (!row || !option?.available) return state;
      return record(state, moveSession(state.seed, row.sessionId, action.date), [
        { goalId: row.goalId, kind: "moved", rows: [settled(row, action.date)], shifts: [] },
      ]);
    }
    case "letGo": {
      const row = findRow(state, action.sessionId);
      if (!row) return state;
      return record(state, letGo(state.seed, row.sessionId), [
        { goalId: row.goalId, kind: "letGo", rows: [settled(row, null)], shifts: [] },
      ]);
    }
    case "undo": {
      const decision = state.decisions.find((item) => item.id === action.decisionId);
      if (!decision) return state;
      const before = new Map(decision.before.map((session) => [session.id, session]));
      return {
        ...state,
        seed: {
          ...state.seed,
          sessions: state.seed.sessions.map((session) => before.get(session.id) ?? session),
        },
        decisions: state.decisions.filter((item) => item !== decision),
      };
    }
  }
}

/** A goal's rows in missed-date order: saved ones as confirmations, the rest open. */
export type GoalItem = { type: "decided"; decision: Decision } | { type: "open"; row: Suggestion };

function itemDate(item: GoalItem): IsoDate {
  return item.type === "open"
    ? item.row.missedDate
    : item.decision.rows.reduce((min, row) => (row.from < min ? row.from : min), item.decision.rows[0]?.from ?? "");
}

export function goalItems(state: ReviewState, plan: RecoveryPlan, goalId: string): GoalItem[] {
  const items: GoalItem[] = [
    ...state.decisions
      .filter((decision) => decision.goalId === goalId)
      .map((decision): GoalItem => ({ type: "decided", decision })),
    ...plan.rows.filter((row) => row.goalId === goalId).map((row): GoalItem => ({ type: "open", row })),
  ];
  return items.sort((a, b) => (itemDate(a) < itemDate(b) ? -1 : itemDate(a) > itemDate(b) ? 1 : 0));
}

export interface RecapGroup {
  goal: RecoveryGoal;
  /** Saved decisions, plus what is still open: left for later, or proposed under Auto-rebalance. */
  items: GoalItem[];
  /** Proposal only: this goal's later sessions Apply rebalance would shift. */
  shifts: Shift[];
  /** Proposal only: why Auto-rebalance fell back to just the missed sessions. */
  note: string | null;
}

/** Every goal this review touched (the goals that slipped), in goal order. */
export function reviewedGoalIds(state: ReviewState): string[] {
  const ids = new Set([...state.steps, ...state.decisions.map((decision) => decision.goalId)]);
  return state.seed.goals.filter((goal) => ids.has(goal.id)).map((goal) => goal.id);
}

/**
 * Goals the calendar focuses while reviewing: the current goal on a step,
 * every reviewed goal on the recap. Null before review (the plain calendar).
 * "Show full calendar" keeps the rest visible, dimmed.
 */
export function calendarFocus(state: ReviewState): string[] | null {
  if (!state.reviewing) return null;
  const goalId = currentGoalId(state);
  return goalId ? [goalId] : reviewedGoalIds(state);
}

/** Every goal this review touched, in goal order. */
export function recap(state: ReviewState, plan: RecoveryPlan): RecapGroup[] {
  const ids = new Set(reviewedGoalIds(state));
  return state.seed.goals
    .filter((goal) => ids.has(goal.id))
    .map((goal) => {
      const goalPlan = state.rebalance ? plan.goals.find((item) => item.goal.id === goal.id) : undefined;
      return {
        goal,
        items: goalItems(state, plan, goal.id),
        shifts: goalPlan?.strategy === "rebalance" ? goalPlan.shifts : [],
        note: goalPlan?.note ?? null,
      };
    });
}

export interface RecapCounts {
  moved: number;
  shifted: number;
  letGo: number;
  /** Open rows that stay slipped: everything open, or under a proposal only the rows with no day. */
  left: number;
  /** Auto-rebalance only: what Apply rebalance would write. */
  proposedMoves: number;
  proposedShifts: number;
}

export function recapCounts(state: ReviewState, plan: RecoveryPlan): RecapCounts {
  const rows = state.decisions.flatMap((decision) => decision.rows);
  const proposed = state.rebalance ? plan.rows.filter((row) => row.date).length : 0;
  return {
    moved: rows.filter((row) => row.to).length,
    shifted: state.decisions.reduce((sum, decision) => sum + decision.shifts.length, 0),
    letGo: rows.filter((row) => !row.to).length,
    left: plan.rows.length - proposed,
    proposedMoves: proposed,
    proposedShifts: state.rebalance
      ? plan.goals.reduce((sum, goal) => sum + (goal.strategy === "rebalance" ? goal.shifts.length : 0), 0)
      : 0,
  };
}
