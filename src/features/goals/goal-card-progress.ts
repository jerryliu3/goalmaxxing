import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import type { Goal } from "@/lib/goals/types";
import { isDeadlineTotalGoal } from "@/lib/goals/target-basis";
import { getRewardProgress } from "./card-material/reassembly-progress";

/** Never interpret a cadence hit rate or a selected day's count as goal achievement. */
export function goalCardProgress(goal: Goal, progress: ProgressContextSummary) {
  const targeted = goal.frequency_type === "fixed_milestones" || isDeadlineTotalGoal(goal);
  if (targeted) {
    const { credited, required } = getRewardProgress(progress.creditedUnitCount, progress.expectedUnitCount);
    return {
      assembly: { completed: credited, target: required },
      label: `${credited} / ${required} ${goal.frequency_type === "fixed_milestones" ? "milestones" : "completions"}`,
      achieved: progress.outcome === "achieved",
    };
  }
  const period = goal.recurrence_interval === "weekly" ? "week" : goal.recurrence_interval === "monthly" ? "month" : "day";
  return {
    assembly: undefined,
    label: `${progress.currentPeriodCompletionCount} / ${progress.currentPeriodTarget ?? 1} this ${period}`,
    achieved: progress.outcome === "achieved",
  };
}
