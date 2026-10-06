/** Pure review reducer shared by every concept: decisions, undo, apply. */
import type { IsoDate } from "@/features/ux-recovery/dates";
import {
  applyDecisions,
  NO_DECISIONS,
  suggest,
  type ApplySummary,
  type Decisions,
  type RecoveryPlan,
  type RecoverySeed,
  type RowDecision,
  type Strategy,
} from "@/features/ux-recovery/model";
import { RECOVERY_SEED, TODAY } from "@/features/ux-recovery/seed";

export type ReviewStage = "entry" | "review" | "applied";

interface Snapshot {
  strategy: Strategy;
  decisions: Decisions;
}

export interface ReviewState extends Snapshot {
  seed: RecoverySeed;
  today: IsoDate;
  stage: ReviewStage;
  history: Snapshot[];
  applied: { before: ReviewState; summary: ApplySummary } | null;
}

export type ReviewAction =
  | { type: "open" }
  | { type: "close" }
  | { type: "accept"; sessionId: string }
  | { type: "acceptAll" }
  | { type: "edit"; sessionId: string; date: IsoDate }
  | { type: "dismiss"; sessionId: string }
  | { type: "restore"; sessionId: string }
  | { type: "strategy"; strategy: Strategy; goalId?: string }
  | { type: "undo" }
  | { type: "apply" }
  | { type: "undoApply" }
  | { type: "reset" };

export function initialReviewState(
  stage: ReviewStage = "entry",
  seed: RecoverySeed = RECOVERY_SEED,
  today: IsoDate = TODAY
): ReviewState {
  return {
    seed,
    today,
    stage,
    strategy: "squeeze",
    decisions: NO_DECISIONS,
    history: [],
    applied: null,
  };
}

export function planFor(state: Pick<ReviewState, "seed" | "today" | "strategy" | "decisions">): RecoveryPlan {
  return suggest(state.seed, state.today, state.strategy, state.decisions);
}

function commit(state: ReviewState, next: Partial<Snapshot>): ReviewState {
  return {
    ...state,
    history: [...state.history, { strategy: state.strategy, decisions: state.decisions }],
    strategy: next.strategy ?? state.strategy,
    decisions: next.decisions ?? state.decisions,
  };
}

function withRows(
  decisions: Decisions,
  update: (rows: Record<string, RowDecision>) => void
): Decisions {
  const rows = { ...decisions.rows };
  update(rows);
  return { ...decisions, rows };
}

/** Accepts are tied to a strategy; changing strategy clears them (dismissals stay). */
function clearAccepts(decisions: Decisions, goalOf: (id: string) => string | undefined, goalId?: string) {
  return withRows(decisions, (rows) => {
    for (const [id, decision] of Object.entries(rows)) {
      if (decision.kind === "accept" && (!goalId || goalOf(id) === goalId)) delete rows[id];
    }
  });
}

export function reviewReducer(state: ReviewState, action: ReviewAction): ReviewState {
  switch (action.type) {
    case "open":
      return { ...state, stage: "review" };
    case "close":
      return { ...state, stage: "entry" };
    case "accept": {
      const row = planFor(state).rows.find((item) => item.sessionId === action.sessionId);
      if (!row?.date || row.status !== "pending") return state;
      const decision: RowDecision = { kind: "accept", date: row.date, edited: false, reason: row.reason };
      return commit(state, {
        decisions: withRows(state.decisions, (rows) => {
          rows[row.sessionId] = decision;
        }),
      });
    }
    case "acceptAll": {
      const pending = planFor(state).rows.filter((row) => row.status === "pending" && row.date);
      if (!pending.length) return state;
      return commit(state, {
        decisions: withRows(state.decisions, (rows) => {
          for (const row of pending) {
            rows[row.sessionId] = { kind: "accept", date: row.date as IsoDate, edited: false, reason: row.reason };
          }
        }),
      });
    }
    case "edit": {
      const row = planFor(state).rows.find((item) => item.sessionId === action.sessionId);
      const option = row?.options.find((item) => item.date === action.date);
      if (!row || !option?.available) return state;
      return commit(state, {
        decisions: withRows(state.decisions, (rows) => {
          rows[row.sessionId] = { kind: "accept", date: action.date, edited: true };
        }),
      });
    }
    case "dismiss":
      return commit(state, {
        decisions: withRows(state.decisions, (rows) => {
          rows[action.sessionId] = { kind: "dismiss" };
        }),
      });
    case "restore":
      if (!state.decisions.rows[action.sessionId]) return state;
      return commit(state, {
        decisions: withRows(state.decisions, (rows) => {
          delete rows[action.sessionId];
        }),
      });
    case "strategy": {
      const goalOf = (id: string) => state.seed.sessions.find((session) => session.id === id)?.goalId;
      if (!action.goalId) {
        if (action.strategy === state.strategy && !Object.keys(state.decisions.strategyByGoal).length) {
          return state;
        }
        return commit(state, {
          strategy: action.strategy,
          decisions: { ...clearAccepts(state.decisions, goalOf), strategyByGoal: {} },
        });
      }
      const goalId = action.goalId;
      const current = state.decisions.strategyByGoal[goalId] ?? state.strategy;
      if (current === action.strategy) return state;
      const strategyByGoal = { ...state.decisions.strategyByGoal };
      if (action.strategy === state.strategy) delete strategyByGoal[goalId];
      else strategyByGoal[goalId] = action.strategy;
      return commit(state, {
        decisions: { ...clearAccepts(state.decisions, goalOf, goalId), strategyByGoal },
      });
    }
    case "undo": {
      const previous = state.history[state.history.length - 1];
      if (!previous) return state;
      return { ...state, ...previous, history: state.history.slice(0, -1) };
    }
    case "apply": {
      if (!Object.keys(state.decisions.rows).length) return state;
      const result = applyDecisions(state.seed, state.today, state.strategy, state.decisions);
      return {
        ...state,
        seed: result.seed,
        decisions: { rows: {}, strategyByGoal: state.decisions.strategyByGoal },
        history: [],
        stage: "applied",
        applied: { before: { ...state, applied: null }, summary: result.summary },
      };
    }
    case "undoApply":
      return state.applied ? { ...state.applied.before, stage: "review" } : state;
    case "reset":
      return initialReviewState("entry", state.applied?.before.seed ?? state.seed, state.today);
  }
}

export interface ReviewCounts {
  /** Rows that Accept all would accept. */
  acceptable: number;
  /** Rows with any decision (accept/edit/dismiss) — what Apply writes. */
  decided: number;
  accepted: number;
  dismissed: number;
}

export function reviewCounts(state: ReviewState, plan: RecoveryPlan): ReviewCounts {
  const decisions = Object.values(state.decisions.rows);
  return {
    acceptable: plan.rows.filter((row) => row.status === "pending" && row.date).length,
    decided: decisions.length,
    accepted: decisions.filter((decision) => decision.kind === "accept").length,
    dismissed: decisions.filter((decision) => decision.kind === "dismiss").length,
  };
}
