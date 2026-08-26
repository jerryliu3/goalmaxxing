import { countDistinctCompletionDays } from "@/lib/goals/admissible";
import type { ChecklistTemporalContext } from "@/lib/goals/period-domain";
import { cadencePeriodTarget, isPeriodCadenceGoal } from "@/lib/goals/target-basis";
import type { CompletionDateFact, Goal } from "@/lib/goals/types";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";

export interface ChecklistGoalPresentation {
  exactDateCompleted: boolean;
  completionSourceForSelectedDate: CompletionDateFact["source"] | null;
  periodCompletionCount: number | null;
  periodTarget: number | null;
  periodSatisfied: boolean;
  lifetimeCompletionCount: number;
  lifetimeAchieved: boolean;
  isGreen: boolean;
  displayCompletionCount: number;
  shouldHideWhenCompletedFilterOff: boolean;
  shouldSortToBottom: boolean;
}

function getDistinctSortedCompletionDates(completions: CompletionDateFact[]) {
  return Array.from(
    new Set(completions.map((completion) => completion.completed_on))
  ).sort((left, right) => left.localeCompare(right));
}

export function shouldHideTargetAchievedGoal({
  goal,
  progress,
  completions,
  asOfDate,
}: {
  goal: Goal;
  progress?: ProgressContextSummary;
  completions: CompletionDateFact[];
  asOfDate: string;
}): boolean {
  if (isPeriodCadenceGoal(goal)) {
    const distinctSortedDates = getDistinctSortedCompletionDates(completions);
    const target = cadencePeriodTarget(goal);
    if (distinctSortedDates.length < target) {
      return progress?.outcome === "achieved";
    }
    const achievedOn = distinctSortedDates[target - 1] ?? null;
    return achievedOn !== null && achievedOn < asOfDate;
  }

  if (progress?.outcome !== "achieved") {
    return false;
  }
  if (progress.achievementDate !== undefined) {
    return (
      progress.achievementDate !== null && progress.achievementDate < asOfDate
    );
  }
  const lastCompletedOn = getDistinctSortedCompletionDates(completions).at(-1);
  return lastCompletedOn == null || lastCompletedOn < asOfDate;
}

export function projectChecklistGoalPresentation({
  goal,
  completions,
  progress,
  temporal,
}: {
  goal: Goal;
  completions: CompletionDateFact[];
  progress?: ProgressContextSummary;
  temporal: ChecklistTemporalContext;
}): ChecklistGoalPresentation {
  const selectedDate = temporal.selectedDate;
  const periodCadenceGoal = isPeriodCadenceGoal(goal);
  const periodCompletionCount = periodCadenceGoal
    ? countDistinctCompletionDays(
        completions.map((completion) => completion.completed_on)
      )
    : null;
  const periodTarget = periodCadenceGoal ? cadencePeriodTarget(goal) : null;
  const periodSatisfied =
    periodCadenceGoal &&
    periodCompletionCount !== null &&
    periodTarget !== null &&
    periodCompletionCount >= periodTarget;
  const lifetimeCompletionCount =
    progress?.admissibleCompletionCount ?? completions.length;
  const lifetimeAchieved = progress?.outcome === "achieved";
  const exactDateCompleted = completions.some(
    (completion) => completion.completed_on === selectedDate
  );
  const completionOnSelectedDate = completions.find(
    (completion) => completion.completed_on === selectedDate
  );
  const isGreen = Boolean(periodSatisfied || lifetimeAchieved);
  const displayCompletionCount = periodCompletionCount ?? lifetimeCompletionCount;

  return {
    exactDateCompleted,
    completionSourceForSelectedDate:
      completionOnSelectedDate?.source ?? null,
    periodCompletionCount,
    periodTarget,
    periodSatisfied: Boolean(periodSatisfied),
    lifetimeCompletionCount,
    lifetimeAchieved,
    isGreen,
    displayCompletionCount,
    shouldHideWhenCompletedFilterOff: shouldHideTargetAchievedGoal({
      goal,
      progress,
      completions,
      asOfDate: selectedDate,
    }),
    shouldSortToBottom: isGreen,
  };
}

export function projectChecklistPresentationsByGoalId({
  goals,
  completionsByGoal,
  progressByGoal,
  temporal,
}: {
  goals: Goal[];
  completionsByGoal: ReadonlyMap<string, CompletionDateFact[]>;
  progressByGoal: ReadonlyMap<string, ProgressContextSummary | undefined>;
  temporal: ChecklistTemporalContext;
}): Map<string, ChecklistGoalPresentation> {
  const presentations = new Map<string, ChecklistGoalPresentation>();
  for (const goal of goals) {
    presentations.set(
      goal.id,
      projectChecklistGoalPresentation({
        goal,
        completions: completionsByGoal.get(goal.id) ?? [],
        progress: progressByGoal.get(goal.id),
        temporal,
      })
    );
  }
  return presentations;
}
