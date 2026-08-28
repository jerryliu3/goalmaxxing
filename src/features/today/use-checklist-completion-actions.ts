"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { captureViewportRect } from "@/lib/xp/events";
import { resolveUserTimezone } from "@/lib/dates/timezone";
import {
  isProgressContextAuthenticationError,
} from "@/lib/goals/progress-context";
import type { CompletionDateFact, Goal } from "@/lib/goals/types";
import { resolveChecklistCompletionIntent } from "@/lib/planner/completion-intent";
import { useCompletionMutation } from "@/features/planner/use-completion-mutation";
import { reportDuoTelemetry } from "@/lib/social/duo/telemetry";

interface UseChecklistCompletionActionsOptions {
  readOnly: boolean;
  viewDate: string;
  todayLocalDate: string;
  completionsByGoal: ReadonlyMap<string, CompletionDateFact[]>;
  loadData: (options: {
    showLoading: boolean;
    forceRefresh: boolean;
    completionOnly: boolean;
  }) => Promise<unknown>;
  redirectToLogin: () => void;
}

export function useChecklistCompletionActions({
  readOnly,
  viewDate,
  todayLocalDate,
  completionsByGoal,
  loadData,
  redirectToLogin,
}: UseChecklistCompletionActionsOptions) {
  const [savingGoalId, setSavingGoalId] = useState<string | null>(null);
  const [recentlyCompletedGoalId, setRecentlyCompletedGoalId] = useState<string | null>(
    null
  );
  const recentlyCompletedTimerRef = useRef<number | null>(null);
  const runCompletionMutation = useCompletionMutation();

  const refreshChecklistInBackground = useCallback(
    (scrollY: number) => {
      void loadData({ showLoading: false, forceRefresh: true, completionOnly: true })
        .then(() => {
          requestAnimationFrame(() => {
            window.scrollTo({ top: scrollY, behavior: "auto" });
          });
        })
        .catch((error) => {
          if (isProgressContextAuthenticationError(error)) {
            redirectToLogin();
            return;
          }
          const timeoutLike =
            error instanceof Error &&
            error.message.toLowerCase().includes("timed out");
          toast.error(
            timeoutLike
              ? "Completion updated, but calendar refresh timed out. Please refresh the page."
              : "Completion updated, but calendar refresh failed. Please refresh the page."
          );
        });
    },
    [loadData, redirectToLogin]
  );

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

      setSavingGoalId(goal.id);
      const currentScrollY = window.scrollY;
      const { decision, mutation } = intent;
      const routeDesiredFactState = mutation.desiredFactState;
      const dispatchDate = mutation.date;

      const result = await runCompletionMutation({
        decision,
        desiredFactState: routeDesiredFactState,
        goalId: mutation.goalId,
        date: dispatchDate,
        timezone: resolveUserTimezone(),
        sourceRect,
        blockedMessage:
          decision.reason === "future_creation"
            ? "You can only complete goals for today or past dates."
            : "This completion cannot be changed from this date.",
        fallbackErrorMessage: "The completion could not be updated.",
      });

      if (!result.ok) {
        toast.error(result.message ?? "The completion could not be updated.");
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
      refreshChecklistInBackground(currentScrollY);
    },
    [
      completionsByGoal,
      readOnly,
      refreshChecklistInBackground,
      runCompletionMutation,
      pinRecentlyCompletedGoal,
      todayLocalDate,
      viewDate,
    ]
  );

  return {
    savingGoalId,
    recentlyCompletedGoalId,
    toggleCompletion,
  };
}
