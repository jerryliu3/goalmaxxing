import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import type { Goal } from "@/lib/goals/types";
import {
  isDeadlineTotalGoal,
  isPeriodCadenceGoal,
} from "@/lib/goals/target-basis";
import { artificialCadenceAssemblyTarget } from "./card-material/cadence-assembly-target";
import { getRewardProgress } from "./card-material/reassembly-progress";

/**
 * Card presentation only. Never treat a cadence hit rate or the selected day's
 * count as domain achievement — `achieved` still comes from progress.outcome.
 */
export function goalCardProgress(goal: Goal, progress: ProgressContextSummary) {
  const targeted =
    goal.frequency_type === "fixed_milestones" || isDeadlineTotalGoal(goal);
  if (targeted) {
    const { credited, required } = getRewardProgress(
      progress.creditedUnitCount,
      progress.expectedUnitCount
    );
    return {
      assembly: { completed: credited, target: required },
      label: `${credited} / ${required} ${goal.frequency_type === "fixed_milestones" ? "milestones" : "completions"}`,
      achieved: progress.outcome === "achieved",
    };
  }

  const period =
    goal.recurrence_interval === "weekly"
      ? "week"
      : goal.recurrence_interval === "monthly"
        ? "month"
        : "day";
  const periodLabel = `${progress.currentPeriodCompletionCount} / ${progress.currentPeriodTarget ?? 1} this ${period}`;

  if (isPeriodCadenceGoal(goal)) {
    const artificial = goal.plaque_target ?? artificialCadenceAssemblyTarget(goal);
    if (artificial !== null) {
      const { credited, required } = getRewardProgress(
        progress.creditedUnitCount,
        artificial
      );
      return {
        assembly: { completed: credited, target: required },
        label: periodLabel,
        achieved: progress.outcome === "achieved",
      };
    }
  }

  return {
    assembly: undefined,
    label: periodLabel,
    achieved: progress.outcome === "achieved",
  };
}
