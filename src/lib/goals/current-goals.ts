import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import type { Goal } from "@/lib/goals/types";

export function selectCurrentGoals(
  goals: Goal[],
  summaries: ProgressContextSummary[],
  userId: string,
  options?: { publicOnly?: boolean }
) {
  const byId = new Map(summaries.map((summary) => [summary.goalId, summary]));
  return goals
    .flatMap((goal) => {
      const progress = byId.get(goal.id);
      if (goal.owner_id !== userId || goal.is_deleted || !progress || progress.placementTerminal) {
        return [];
      }
      if (options?.publicOnly && goal.is_private) {
        return [];
      }
      return [{ goal, progress }];
    })
    .sort(
      (a, b) =>
        Number(a.progress.lifecycle === "upcoming") - Number(b.progress.lifecycle === "upcoming") ||
        a.goal.start_date.localeCompare(b.goal.start_date) ||
        a.goal.id.localeCompare(b.goal.id)
    );
}
