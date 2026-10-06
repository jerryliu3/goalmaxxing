"use client";

import { useMemo, useReducer, useState } from "react";
import type { IsoDate } from "@/features/ux-recovery/dates";
import { recoveryPrompt } from "@/features/ux-recovery/model";
import {
  calendarFocus,
  currentGoalId,
  initialReviewState,
  inRecap,
  planFor,
  reviewReducer,
} from "@/features/ux-recovery/review-state";

export function useRecoveryReview() {
  const [state, dispatch] = useReducer(reviewReducer, false, initialReviewState);
  // "Show full calendar": view-only, lives with the panel. Off, the calendar
  // shows only the focused goal(s); on, the rest are dimmed.
  const [showAll, setShowAll] = useState(false);
  const { seed, today, rebalance } = state;
  const plan = useMemo(() => planFor({ seed, today, rebalance }), [seed, today, rebalance]);
  const prompt = useMemo(() => recoveryPrompt(plan, today), [plan, today]);
  const focusGoalIds = useMemo(() => calendarFocus(state), [state]);

  const actions = useMemo(
    () => ({
      open: () => dispatch({ type: "open" }),
      close: () => dispatch({ type: "close" }),
      next: () => dispatch({ type: "next" }),
      back: () => dispatch({ type: "back" }),
      goTo: (goalId: string) => dispatch({ type: "goTo", goalId }),
      showRecap: () => dispatch({ type: "recap" }),
      accept: (sessionId: string) => dispatch({ type: "accept", sessionId }),
      acceptGoal: (goalId: string) => dispatch({ type: "acceptGoal", goalId }),
      move: (sessionId: string, date: IsoDate) => dispatch({ type: "move", sessionId, date }),
      letGo: (sessionId: string) => dispatch({ type: "letGo", sessionId }),
      setRebalance: (on: boolean) => dispatch({ type: "rebalance", on }),
      applyRebalance: () => dispatch({ type: "applyRebalance" }),
      undo: (decisionId: number) => dispatch({ type: "undo", decisionId }),
    }),
    []
  );

  return {
    state,
    plan,
    prompt,
    goalId: currentGoalId(state),
    focusGoalIds,
    recapOpen: inRecap(state),
    showAll,
    setShowAll,
    ...actions,
  };
}

export type RecoveryReview = ReturnType<typeof useRecoveryReview>;
