import { isPlannerTaskCalendarEntry } from "@/features/planner/calendar-task-entries";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import { selectActiveGoals } from "@/features/today/checklist-selectors";
import { getGoalLifecycle } from "@/lib/goals/lifecycle";
import type { Goal } from "@/lib/goals/types";

export function placedGoalIdsForDay(entries: PlannerDayDetailEntry[]) {
  const ids = new Set<string>();
  for (const entry of entries) {
    if (isPlannerTaskCalendarEntry(entry)) {
      continue;
    }
    ids.add(entry.originalGoalId);
  }
  return ids;
}

export function selectUnplannedGoals({
  goals,
  placedGoalIds,
  viewDate,
}: {
  goals: Goal[];
  placedGoalIds: ReadonlySet<string>;
  viewDate: string;
}): Goal[] {
  const lifecycleByGoalAtViewDate = new Map(
    goals.map((goal) => [goal.id, getGoalLifecycle(goal, { asOfDate: viewDate })])
  );
  return selectActiveGoals({
    completableGoals: goals,
    lifecycleByGoalAtViewDate,
  }).filter((goal) => {
    const lifecycle = lifecycleByGoalAtViewDate.get(goal.id);
    return lifecycle === "active" && !placedGoalIds.has(goal.id);
  });
}
