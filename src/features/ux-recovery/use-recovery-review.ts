"use client";

import { useMemo, useReducer } from "react";
import type { IsoDate } from "@/features/ux-recovery/dates";
import { recoveryPrompt, type Strategy } from "@/features/ux-recovery/model";
import {
  initialReviewState,
  planFor,
  reviewCounts,
  reviewReducer,
  type ReviewStage,
} from "@/features/ux-recovery/review-state";

export function useRecoveryReview(initialStage: ReviewStage = "entry") {
  const [state, dispatch] = useReducer(reviewReducer, initialStage, initialReviewState);
  const plan = useMemo(() => planFor(state), [state]);
  const prompt = useMemo(() => recoveryPrompt(plan, state.today), [plan, state.today]);
  const counts = useMemo(() => reviewCounts(state, plan), [state, plan]);

  const actions = useMemo(
    () => ({
      open: () => dispatch({ type: "open" }),
      close: () => dispatch({ type: "close" }),
      accept: (sessionId: string) => dispatch({ type: "accept", sessionId }),
      acceptAll: () => dispatch({ type: "acceptAll" }),
      edit: (sessionId: string, date: IsoDate) => dispatch({ type: "edit", sessionId, date }),
      dismiss: (sessionId: string) => dispatch({ type: "dismiss", sessionId }),
      restore: (sessionId: string) => dispatch({ type: "restore", sessionId }),
      setStrategy: (strategy: Strategy, goalId?: string) =>
        dispatch({ type: "strategy", strategy, goalId }),
      undo: () => dispatch({ type: "undo" }),
      apply: () => dispatch({ type: "apply" }),
      undoApply: () => dispatch({ type: "undoApply" }),
      reset: () => dispatch({ type: "reset" }),
    }),
    []
  );

  return { state, plan, prompt, counts, ...actions };
}

export type RecoveryReview = ReturnType<typeof useRecoveryReview>;
