"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { captureViewportRect } from "@/lib/xp/events";
import { resolveUserTimezone } from "@/lib/dates/timezone";
import type { CompletionDateFact, Goal } from "@/lib/goals/types";
import { resolveChecklistCompletionIntent } from "@/lib/planner/completion-intent";
import {
  pruneOptimisticCompletionFacts,
  withOptimisticCompletionFact,
  withoutOptimisticCompletionFact,
  type OptimisticCompletionFacts,
} from "@/lib/planner/optimistic-completion-facts";
import { useCompletionMutation } from "@/features/planner/use-completion-mutation";
import { reportDuoTelemetry } from "@/lib/social/duo/telemetry";

interface UseChecklistCompletionActionsOptions {
  readOnly: boolean;
  viewDate: string;
  todayLocalDate: string;
  timezone?: string | null;
  completionsByGoal: ReadonlyMap<string, CompletionDateFact[]>;
}

export function useChecklistCompletionActions({
  readOnly,
  viewDate,
  todayLocalDate,
  timezone,
  completionsByGoal,
}: UseChecklistCompletionActionsOptions) {
  const [savingGoalId, setSavingGoalId] = useState<string | null>(null);
  const [optimisticFacts, setOptimisticFacts] = useState<OptimisticCompletionFacts>(
    () => new Map()
  );
  const [recentlyCompletedGoalId, setRecentlyCompletedGoalId] = useState<string | null>(
    null
  );
  const recentlyCompletedTimerRef = useRef<number | null>(null);
  const runCompletionMutation = useCompletionMutation();

  const pinRecentlyCompletedGoal = useCallback((goalId: string) => {
    setRecentlyCompletedGoalId(goalId);
    if (recentlyCompletedTimerRef.current !== null) {
      window.clearTimeout(recentlyCompletedTimerRef.current);
    }
    recentlyCompletedTimerRef.current = window.setTimeout(() => {
      setRecentlyCompletedGoalId((current) =>
        current === goalId ? null : current
      );
      recentlyCompletedTimerRef.current = null;
    }, 1200);
  }, []);

  useEffect(
    () => () => {
      if (recentlyCompletedTimerRef.current !== null) {
        window.clearTimeout(recentlyCompletedTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    setOptimisticFacts((overlay) =>
      pruneOptimisticCompletionFacts(overlay, (goalId, date) =>
        (completionsByGoal.get(goalId) ?? []).some((fact) => fact.completed_on === date)
      )
    );
  }, [completionsByGoal]);

  const toggleCompletion = useCallback(
    async (goal: Goal, sourceElement: HTMLButtonElement) => {
      if (readOnly) {
        return;
      }
      const sourceRect = captureViewportRect(sourceElement);
      const completions = completionsByGoal.get(goal.id) ?? [];
      const intent = resolveChecklistCompletionIntent({
        goal,
        completions,
        temporal: {
          selectedDate: viewDate,
          asOfDate: todayLocalDate,
        },
      });

      const { decision, mutation } = intent;
      const routeDesiredFactState = mutation.desiredFactState;
      const dispatchDate = mutation.date;

      setSavingGoalId(goal.id);
      setOptimisticFacts((overlay) =>
        withOptimisticCompletionFact(
          overlay,
          goal.id,
          dispatchDate,
          routeDesiredFactState === "present"
        )
      );
      const result = await runCompletionMutation({
        decision,
        desiredFactState: routeDesiredFactState,
        goalId: mutation.goalId,
        date: dispatchDate,
        timezone: resolveUserTimezone(timezone),
        sourceRect,
        blockedMessage:
          decision.reason === "future_creation"
            ? "You can only complete goals for today or past dates."
            : "This completion cannot be changed from this date.",
        fallbackErrorMessage: "The completion could not be updated.",
      });

      if (!result.ok) {
        toast.error(result.message ?? "The completion could not be updated.");
        setOptimisticFacts((overlay) =>
          withoutOptimisticCompletionFact(overlay, goal.id, dispatchDate)
        );
        setSavingGoalId(null);
        return;
      }

      if (routeDesiredFactState === "present") {
        reportDuoTelemetry("viewer_lane_completion", { surface: "checklist" });
        toast.success(`Great work. Goal completed for ${viewDate}.`);
        pinRecentlyCompletedGoal(goal.id);
      } else {
        toast.success(`Marked as incomplete for ${dispatchDate}.`);
      }

      setSavingGoalId(null);
    },
    [
      completionsByGoal,
      readOnly,
      runCompletionMutation,
      pinRecentlyCompletedGoal,
      timezone,
      todayLocalDate,
      viewDate,
    ]
  );

  return {
    savingGoalId,
    recentlyCompletedGoalId,
    toggleCompletion,
    optimisticFacts,
  };
}
