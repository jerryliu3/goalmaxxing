import { useMemo } from "react";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import {
  projectChecklistPresentationsByGoalId,
} from "@/lib/goals/checklist-presentation";
import { createChecklistTemporalContext } from "@/lib/goals/period-domain";
import type { CompletionDateFact, Goal } from "@/lib/goals/types";
import type { WeeklyAnchorContext } from "@/lib/goals/periods";

export function useChecklistProjection({
  goals,
  completionsByGoal,
  progressByGoal,
  selectedDate,
  asOfDate,
  weeklyAnchor,
}: {
  goals: Goal[];
  completionsByGoal: ReadonlyMap<string, CompletionDateFact[]>;
  progressByGoal: ReadonlyMap<string, ProgressContextSummary | undefined>;
  selectedDate: string;
  asOfDate: string;
  weeklyAnchor: WeeklyAnchorContext;
}) {
  const temporal = useMemo(
    () =>
      createChecklistTemporalContext({
        selectedDate,
        asOfDate,
        weeklyAnchor,
      }),
    [asOfDate, selectedDate, weeklyAnchor]
  );

  const presentationByGoalId = useMemo(
    () =>
      projectChecklistPresentationsByGoalId({
        goals,
        completionsByGoal,
        progressByGoal,
        temporal,
      }),
    [completionsByGoal, goals, progressByGoal, temporal]
  );

  const greenGoalIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [goalId, presentation] of presentationByGoalId) {
      if (presentation.isGreen) {
        ids.add(goalId);
      }
    }
    return ids;
  }, [presentationByGoalId]);

  return {
    presentationByGoalId,
    greenGoalIds,
  };
}
