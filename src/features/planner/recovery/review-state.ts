/**
 * Recovery mode state. Nothing here is saved until Save: moves are planner
 * draft commands (so the calendar previews them like any Planning-mode
 * change), and let-gos wait in `letGo`. Everything the panel shows is derived
 * from the saved snapshot plus those two, so a calendar drag and an Accept in
 * the panel read the same way.
 */
import type { RecoveryGoal, RecoverySession, RecoverySnapshot } from "@/lib/planner/recovery/contract";
import {
  goalPlanMoves,
  REBALANCE_FALLBACK,
  type RecoveryMove,
  type RecoveryPlan,
  type RecoverySeed,
  type Shift,
  type Suggestion,
} from "@/lib/planner/recovery/model";

/** A planner draft move: the calendar's `move_item` command. */
export interface DraftMove {
  goalId: string;
  unitKey: string;
  sourceDate: string;
  scheduledDate: string | null;
}

export type DraftKey = Pick<DraftMove, "goalId" | "unitKey">;

/** What turning Auto-rebalance on staged, so turning it off removes exactly that. */
export interface Rebalanced {
  moves: DraftKey[];
  /** Sessions with no day left, staged as let go. */
  letGo: string[];
  /** Goals that had no room to reflow, so only their missed sessions moved. */
  fallbackGoalIds: string[];
}

export interface ReviewState {
  reviewing: boolean;
  /** Goals that had slips when recovery mode opened, in goal order. */
  steps: string[];
  /** Index into `steps`; `steps.length` is the summary. */
  step: number;
  /** Auto-rebalance is on; null when off. */
  rebalanced: Rebalanced | null;
  /** Session ids staged as "Let it go". */
  letGo: string[];
}

export type ReviewAction =
  | { type: "open"; steps: string[] }
  | { type: "close" }
  | { type: "next" }
  | { type: "back" }
  | { type: "goTo"; goalId: string }
  /** On opens the summary of what it staged. */
  | { type: "rebalance"; rebalanced: Rebalanced | null }
  | { type: "letGo"; sessionId: string }
  | { type: "keep"; sessionId: string }
  /** The let-gos are saved; the snapshot no longer has them. */
  | { type: "letGoSaved" };

export function initialReviewState(): ReviewState {
  return { reviewing: false, steps: [], step: 0, rebalanced: null, letGo: [] };
}

export function reviewReducer(state: ReviewState, action: ReviewAction): ReviewState {
  switch (action.type) {
    case "open":
      return { ...initialReviewState(), reviewing: true, steps: action.steps };
    case "close":
      return initialReviewState();
    case "next":
      return { ...state, step: Math.min(state.step + 1, state.steps.length) };
    case "back":
      return { ...state, step: Math.max(state.step - 1, 0) };
    case "goTo": {
      const step = state.steps.indexOf(action.goalId);
      return step === -1 ? state : { ...state, step };
    }
    case "rebalance": {
      const { rebalanced } = action;
      // Its let-gos are open rows, so never ones already let go.
      if (rebalanced) {
        return { ...state, rebalanced, letGo: [...state.letGo, ...rebalanced.letGo], step: state.steps.length };
      }
      const staged = new Set(state.rebalanced?.letGo);
      return { ...state, rebalanced: null, letGo: state.letGo.filter((id) => !staged.has(id)) };
    }
    case "letGo":
      return state.letGo.includes(action.sessionId)
        ? state
        : { ...state, letGo: [...state.letGo, action.sessionId] };
    case "keep":
      return { ...state, letGo: state.letGo.filter((id) => id !== action.sessionId) };
    case "letGoSaved":
      return { ...state, letGo: [] };
  }
}

export function currentGoalId(state: ReviewState): string | null {
  return state.reviewing && state.step < state.steps.length ? (state.steps[state.step] ?? null) : null;
}

export function inSummary(state: ReviewState): boolean {
  return state.reviewing && state.step >= state.steps.length;
}

const unitKey = (goalId: string, unit: string) => `${goalId}:${unit}`;

function movesByUnit(moves: readonly DraftMove[]): Map<string, DraftMove> {
  return new Map(moves.map((move) => [unitKey(move.goalId, move.unitKey), move]));
}

/** The staged date of a session, or undefined when it has not moved. */
function stagedDate(session: RecoverySession, moves: Map<string, DraftMove>): string | null | undefined {
  const move = moves.get(unitKey(session.goalId, session.unitKey));
  return move && move.scheduledDate !== session.date ? move.scheduledDate : undefined;
}

/**
 * The snapshot as the model sees it in recovery mode: staged moves land on
 * their new day (pinned, so a rebalance works around them) and let-gos drop
 * out, so the open rows and Auto-rebalance only cover what is still undecided.
 */
export function stagedSeed(
  snapshot: RecoverySnapshot,
  moves: readonly DraftMove[],
  letGo: readonly string[]
): RecoverySeed {
  const byUnit = movesByUnit(moves);
  const dropped = new Set(letGo);
  return {
    ...snapshot,
    sessions: snapshot.sessions.flatMap((session) => {
      if (dropped.has(session.id)) return [];
      const date = stagedDate(session, byUnit);
      if (date === undefined) return [session];
      if (date === null) return [];
      return [
        {
          ...session,
          date,
          status: session.status === "missed" ? ("scheduled" as const) : session.status,
          recoveredFrom: session.date,
        },
      ];
    }),
  };
}

/** A slipped session recovery mode decided: `to` is null when it was let go. */
export interface StagedRow {
  sessionId: string;
  goalId: string;
  label: string;
  from: string;
  to: string | null;
}

export interface GoalChanges {
  rows: StagedRow[];
  /** This goal's other sessions that moved: by Auto-rebalance or a calendar drag. */
  shifts: Shift[];
}

/** Every staged change, by goal. */
export function stagedChanges(
  snapshot: RecoverySnapshot,
  moves: readonly DraftMove[],
  letGo: readonly string[]
): Map<string, GoalChanges> {
  const byUnit = movesByUnit(moves);
  const dropped = new Set(letGo);
  const changes = new Map<string, GoalChanges>();
  const forGoal = (goalId: string) => {
    let entry = changes.get(goalId);
    if (!entry) {
      entry = { rows: [], shifts: [] };
      changes.set(goalId, entry);
    }
    return entry;
  };
  for (const session of snapshot.sessions) {
    const date = stagedDate(session, byUnit);
    if (session.status === "missed") {
      if (dropped.has(session.id)) {
        forGoal(session.goalId).rows.push({ ...rowOf(session), to: null });
      } else if (date) {
        forGoal(session.goalId).rows.push({ ...rowOf(session), to: date });
      }
    } else if (date) {
      forGoal(session.goalId).shifts.push({
        sessionId: session.id,
        label: session.label,
        from: session.date,
        to: date,
      });
    }
  }
  return changes;
}

function rowOf(session: RecoverySession): Omit<StagedRow, "to"> {
  return { sessionId: session.id, goalId: session.goalId, label: session.label, from: session.date };
}

/** Model moves as planner draft moves. Sessions are named by their saved goal and day. */
export function toDraftMoves(snapshot: RecoverySnapshot, moves: readonly RecoveryMove[]): DraftMove[] {
  const sessions = new Map(snapshot.sessions.map((session) => [session.id, session]));
  return moves.flatMap((move) => {
    const session = sessions.get(move.sessionId);
    return session
      ? [{ goalId: session.goalId, unitKey: session.unitKey, sourceDate: session.date, scheduledDate: move.to }]
      : [];
  });
}

/** Auto-rebalance: every goal's proposal, rows and shifts alike. */
export function rebalanceMoves(plan: RecoveryPlan): RecoveryMove[] {
  return plan.goals.flatMap(goalPlanMoves);
}

/** The draft moves an Undo removes. */
export function draftMovesFor(snapshot: RecoverySnapshot, sessionIds: readonly string[]): DraftKey[] {
  const ids = new Set(sessionIds);
  return snapshot.sessions
    .filter((session) => ids.has(session.id))
    .map((session) => ({ goalId: session.goalId, unitKey: session.unitKey }));
}

/** Let-gos as the Save request names them. */
export function dismissalsFor(snapshot: RecoverySnapshot, letGo: readonly string[]) {
  const ids = new Set(letGo);
  return snapshot.sessions
    .filter((session) => ids.has(session.id))
    .map((session) => ({ goalId: session.goalId, date: session.date }));
}

/** A goal's rows in missed-date order: decided ones with Undo, the rest open. */
export type GoalItem = { type: "decided"; row: StagedRow } | { type: "open"; row: Suggestion };

function itemDate(item: GoalItem): string {
  return item.type === "open" ? item.row.missedDate : item.row.from;
}

export function goalItems(
  changes: Map<string, GoalChanges>,
  plan: RecoveryPlan,
  goalId: string
): GoalItem[] {
  const items: GoalItem[] = [
    ...(changes.get(goalId)?.rows ?? []).map((row): GoalItem => ({ type: "decided", row })),
    ...plan.rows.filter((row) => row.goalId === goalId).map((row): GoalItem => ({ type: "open", row })),
  ];
  return items.sort((a, b) => itemDate(a).localeCompare(itemDate(b)));
}

export interface SummaryGroup {
  goal: RecoveryGoal;
  items: GoalItem[];
  /** Staged shifts of this goal's later sessions. */
  shifts: Shift[];
  /** Why Auto-rebalance fell back to just the missed sessions. */
  note: string | null;
}

export function summaryGroups(
  state: ReviewState,
  changes: Map<string, GoalChanges>,
  plan: RecoveryPlan,
  goals: readonly RecoveryGoal[]
): SummaryGroup[] {
  const ids = new Set([...state.steps, ...changes.keys()]);
  const fallbacks = new Set(state.rebalanced?.fallbackGoalIds);
  return goals
    .filter((goal) => ids.has(goal.id))
    .map((goal) => ({
      goal,
      items: goalItems(changes, plan, goal.id),
      shifts: changes.get(goal.id)?.shifts ?? [],
      note: fallbacks.has(goal.id) ? REBALANCE_FALLBACK : null,
    }));
}

export interface SummaryCounts {
  moved: number;
  shifted: number;
  letGo: number;
  /** Open rows that stay slipped. */
  left: number;
}

export function summaryCounts(changes: Map<string, GoalChanges>, plan: RecoveryPlan): SummaryCounts {
  const staged = [...changes.values()];
  const rows = staged.flatMap((goal) => goal.rows);
  return {
    moved: rows.filter((row) => row.to).length,
    shifted: staged.reduce((sum, goal) => sum + goal.shifts.length, 0),
    letGo: rows.filter((row) => !row.to).length,
    left: plan.rows.length,
  };
}

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

export function summaryHeading(counts: SummaryCounts): { eyebrow: string; title: string } {
  return { eyebrow: "Summary", title: counts.left ? "The rest can wait." : "Your plan is back on track." };
}

export function summaryLine(counts: SummaryCounts): string {
  const staged = [
    counts.moved ? `${counts.moved} moved` : null,
    counts.shifted ? `${plural(counts.shifted, "later session")} shifted` : null,
    counts.letGo ? `${counts.letGo} let go` : null,
  ].filter(Boolean);
  return [
    staged.length ? `Not saved yet: ${staged.join(" · ")}.` : "Nothing changed yet.",
    counts.left ? `${counts.left} left for later.` : null,
  ]
    .filter(Boolean)
    .join(" ");
}
