"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage, getJson, postJson } from "@/lib/api/client";
import { draftCommandEntryKey } from "@/lib/planner/draft-commands";
import type { RecoveryDismissRequest, RecoverySnapshot } from "@/lib/planner/recovery/contract";
import { findRecoverable, suggest, type Suggestion } from "@/lib/planner/recovery/model";
import {
  currentGoalId,
  dismissalsFor,
  draftMovesFor,
  initialReviewState,
  inSummary,
  rebalanceMoves,
  reviewReducer,
  stagedChanges,
  stagedSeed,
  toDraftMoves,
  type DraftMove,
  type GoalChanges,
  type StagedRow,
} from "@/features/planner/recovery/review-state";

const RECOVERY_PATH = "/api/planner/recovery";

type SnapshotResponse = { snapshot: RecoverySnapshot };

export const RECOVERY_BLOCKED_NOTE = "Save or discard your changes to review";

/** What the calendar shows and lets you drag while recovery mode is on. */
export interface RecoveryLens {
  goalIds: string[];
  showFullCalendar: boolean;
  /** Calendar entry keys (`goalId:unitKey`) of the sessions staged as let go. */
  letGoEntryKeys: string[];
}

/**
 * Recovery mode for the planner: Planning mode limited to the goals that
 * slipped. Moves are the planner's own draft commands, so the calendar
 * previews them and one Save persists them; let-gos are staged here and saved
 * with them. Cancel discards both.
 */
export function useRecoveryReview({
  enabled,
  refreshKey,
  plannerDraftPending,
  draftMoves,
  requested,
  onRequestHandled,
  onLensChange,
  onSaved,
  stageMoves,
  unstageMoves,
  savePlannerDraft,
  discardPlannerDraft,
}: {
  enabled: boolean;
  /** Changes whenever the planner may have changed what slipped. */
  refreshKey: string;
  /** The planner has unsaved draft changes. */
  plannerDraftPending: boolean;
  /** The planner draft's moves. */
  draftMoves: readonly DraftMove[];
  /** A deep link asked for recovery mode to open. */
  requested: boolean;
  onRequestHandled: () => void;
  onLensChange: (lens: RecoveryLens | null) => void;
  /** Let-gos were saved. */
  onSaved: () => void;
  stageMoves: (moves: DraftMove[]) => void;
  unstageMoves: (entries: Array<{ goalId: string; unitKey: string }>) => void;
  savePlannerDraft: () => Promise<boolean>;
  discardPlannerDraft: () => void;
}) {
  const [snapshot, setSnapshot] = useState<RecoverySnapshot | null>(null);
  const [state, dispatch] = useReducer(reviewReducer, undefined, initialReviewState);
  const [saving, setSaving] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  // Loads and the Save response race (the planner reloads after a save); only
  // the newest response may replace the snapshot.
  const requestSeq = useRef(0);
  const appliedSeq = useRef(0);
  const accept = useCallback((seq: number, next: RecoverySnapshot) => {
    if (seq < appliedSeq.current) return;
    appliedSeq.current = seq;
    setSnapshot(next);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const seq = ++requestSeq.current;
    void (async () => {
      try {
        const response = await getJson<SnapshotResponse>(RECOVERY_PATH);
        if (response?.snapshot) accept(seq, response.snapshot);
      } catch {
        // The entry stays hidden; the planner itself reports load failures.
      }
    })();
  }, [accept, enabled, refreshKey]);

  const { reviewing } = state;
  // Outside recovery mode a planner draft is someone else's change: count the saved plan.
  const moves = useMemo(() => (reviewing ? draftMoves : []), [draftMoves, reviewing]);
  const seed = useMemo(
    () => (snapshot ? stagedSeed(snapshot, moves, state.letGo) : null),
    [moves, snapshot, state.letGo]
  );
  const changes = useMemo(
    () => (snapshot ? stagedChanges(snapshot, moves, state.letGo) : new Map<string, GoalChanges>()),
    [moves, snapshot, state.letGo]
  );
  const count = useMemo(() => (seed ? findRecoverable(seed).length : 0), [seed]);
  const plan = useMemo(() => (seed ? suggest(seed) : { goals: [], rows: [] }), [seed]);
  const goals = useMemo(() => snapshot?.goals ?? [], [snapshot]);
  const blocked = plannerDraftPending && !reviewing;
  const hasChanges = changes.size > 0 || (reviewing && plannerDraftPending);

  const open = useCallback(() => {
    if (!seed || blocked) return;
    setSuggestionsOpen(true);
    setShowFullCalendar(false);
    dispatch({ type: "open", steps: suggest(seed).goals.map((goal) => goal.goal.id) });
  }, [blocked, seed]);

  // The URL param clears asynchronously; open once per request.
  const requestHandled = useRef(false);
  useEffect(() => {
    if (!requested) {
      requestHandled.current = false;
      return;
    }
    if (!seed || requestHandled.current) return;
    requestHandled.current = true;
    if (!blocked) open();
    onRequestHandled();
  }, [blocked, onRequestHandled, open, requested, seed]);

  const lensKey = useMemo(() => {
    if (!reviewing) return null;
    const lens: RecoveryLens = {
      goalIds: state.steps,
      showFullCalendar,
      letGoEntryKeys: snapshot ? draftMovesFor(snapshot, state.letGo).map(draftCommandEntryKey) : [],
    };
    return JSON.stringify(lens);
  }, [reviewing, showFullCalendar, snapshot, state.letGo, state.steps]);
  useEffect(() => {
    onLensChange(lensKey === null ? null : (JSON.parse(lensKey) as RecoveryLens));
  }, [lensKey, onLensChange]);
  useEffect(() => () => onLensChange(null), [onLensChange]);

  const cancel = useCallback(() => {
    discardPlannerDraft();
    dispatch({ type: "close" });
  }, [discardPlannerDraft]);

  /**
   * Let-gos first: they never conflict, and the planner reload after the
   * planner save then reads them. If the planner save fails, recovery mode
   * stays open with only the moves left to save.
   */
  const save = useCallback(async () => {
    if (saving || !snapshot) return;
    setSaving(true);
    try {
      const dismissals = dismissalsFor(snapshot, state.letGo);
      if (dismissals.length) {
        const seq = ++requestSeq.current;
        try {
          const response = await postJson<SnapshotResponse, RecoveryDismissRequest>(RECOVERY_PATH, {
            dismissals,
          });
          accept(seq, response.snapshot);
          dispatch({ type: "letGoSaved" });
          onSaved();
        } catch (error) {
          toast.error(getApiErrorMessage(error, "Your changes could not be saved."));
          return;
        }
      }
      if (plannerDraftPending) {
        if (!(await savePlannerDraft())) return;
      } else if (dismissals.length) {
        toast.success("Plan saved.");
      }
      dispatch({ type: "close" });
    } finally {
      setSaving(false);
    }
  }, [accept, onSaved, plannerDraftPending, savePlannerDraft, saving, snapshot, state.letGo]);

  const findRow = useCallback(
    (sessionId: string): Suggestion | undefined => plan.rows.find((row) => row.sessionId === sessionId),
    [plan]
  );
  const stage = useCallback(
    (staged: Array<{ sessionId: string; to: string }>) => {
      if (snapshot && staged.length) stageMoves(toDraftMoves(snapshot, staged));
    },
    [snapshot, stageMoves]
  );
  /**
   * On stages every goal's reflow at once and lets go of the sessions with no
   * day left; off removes exactly what it staged.
   */
  const setRebalance = useCallback(
    (on: boolean) => {
      if (!on) {
        if (state.rebalanced) unstageMoves(state.rebalanced.moves);
        dispatch({ type: "rebalance", rebalanced: null });
        return;
      }
      if (!snapshot || !seed || state.rebalanced) return;
      const proposal = suggest(seed, true);
      const moves = toDraftMoves(snapshot, rebalanceMoves(proposal));
      stageMoves(moves);
      dispatch({
        type: "rebalance",
        rebalanced: {
          moves: moves.map(({ goalId, unitKey }) => ({ goalId, unitKey })),
          letGo: proposal.rows.flatMap((row) => (row.date ? [] : [row.sessionId])),
          fallbackGoalIds: proposal.goals.flatMap((goal) => (goal.note ? [goal.goal.id] : [])),
        },
      });
    },
    [seed, snapshot, stageMoves, state.rebalanced, unstageMoves]
  );

  const actions = useMemo(
    () => ({
      open,
      cancel,
      save,
      next: () => dispatch({ type: "next" }),
      back: () => dispatch({ type: "back" }),
      goTo: (goalId: string) => {
        setSuggestionsOpen(true);
        dispatch({ type: "goTo", goalId });
      },
      setRebalance,
      accept: (sessionId: string) => {
        const row = findRow(sessionId);
        if (row?.date) stage([{ sessionId, to: row.date }]);
      },
      acceptGoal: (goalId: string) =>
        stage(
          plan.rows.flatMap((row) =>
            row.goalId === goalId && row.date ? [{ sessionId: row.sessionId, to: row.date }] : []
          )
        ),
      move: (sessionId: string, date: string) => {
        const option = findRow(sessionId)?.options.find((item) => item.date === date);
        if (option?.available) stage([{ sessionId, to: date }]);
      },
      letGo: (sessionId: string) => {
        if (findRow(sessionId)) dispatch({ type: "letGo", sessionId });
      },
      undo: (row: StagedRow) => {
        if (row.to === null) dispatch({ type: "keep", sessionId: row.sessionId });
        else if (snapshot) unstageMoves(draftMovesFor(snapshot, [row.sessionId]));
      },
      undoShifts: (goalId: string) => {
        const shifts = changes.get(goalId)?.shifts ?? [];
        if (snapshot && shifts.length) {
          unstageMoves(draftMovesFor(snapshot, shifts.map((shift) => shift.sessionId)));
        }
      },
    }),
    [cancel, changes, findRow, open, plan, save, setRebalance, snapshot, stage, unstageMoves]
  );

  return {
    state,
    goals,
    today: snapshot?.today ?? null,
    count,
    plan,
    changes,
    goalId: currentGoalId(state),
    summaryOpen: inSummary(state),
    saving,
    blocked,
    hasChanges,
    suggestionsOpen,
    setSuggestionsOpen,
    showFullCalendar,
    setShowFullCalendar,
    ...actions,
  };
}

export type RecoveryReview = ReturnType<typeof useRecoveryReview>;
