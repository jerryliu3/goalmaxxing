import { isEntryCredited } from "@/features/planner/calendar-format";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import type { PlanDayChecklistModel } from "@/features/planner/use-plan-day-checklist-model";
import type { Goal } from "@/lib/goals/types";
import {
  overlayCurrentlyCredited,
  type OptimisticCompletionFacts,
} from "@/lib/planner/optimistic-completion-facts";

export interface PlanDayCompletionPartition<TRow> {
  open: TRow[];
  completed: TRow[];
}

function partition<TRow>(
  rows: TRow[],
  isCompleted: (row: TRow) => boolean
): PlanDayCompletionPartition<TRow> {
  const open: TRow[] = [];
  const completed: TRow[] = [];
  for (const row of rows) {
    (isCompleted(row) ? completed : open).push(row);
  }
  return { open, completed };
}

/**
 * Splits a day's scheduled sessions into work that is still open and work the
 * Completed section owns. Draft moves stay open regardless of credit so a
 * pending change never gets folded away before it is confirmed.
 */
export function partitionDayEntriesByCompletion({
  entries,
  day,
  optimisticCompletionFacts,
}: {
  entries: PlannerDayDetailEntry[];
  day: string;
  optimisticCompletionFacts?: OptimisticCompletionFacts;
}): PlanDayCompletionPartition<PlannerDayDetailEntry> {
  return partition(entries, (entry) => {
    if (entry.draftDiffKind) {
      return false;
    }
    return overlayCurrentlyCredited(
      isEntryCredited(entry),
      optimisticCompletionFacts,
      entry.originalGoalId,
      day
    );
  });
}

/**
 * Splits unscheduled goals by whether they were credited on the viewed day.
 */
export function partitionUnplannedGoalsByCompletion({
  goals,
  presentationByGoalId,
}: {
  goals: Goal[];
  presentationByGoalId: PlanDayChecklistModel["listModel"]["presentationByGoalId"];
}): PlanDayCompletionPartition<Goal> {
  return partition(goals, (goal) =>
    Boolean(presentationByGoalId.get(goal.id)?.exactDateCompleted)
  );
}
