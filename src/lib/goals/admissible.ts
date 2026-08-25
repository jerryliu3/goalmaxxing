import {
  compareDateStrings,
  getAnchoredPeriod,
  getAnchoredPeriodStart,
  type WeeklyAnchorContext,
} from "@/lib/goals/periods";
import type { Completion, Goal } from "@/lib/goals/types";
import { getGoalRequirement } from "@/lib/planner/requirements";

export interface GoalProgressContext {
  asOfDate: string;
  weeklyAnchor?: WeeklyAnchorContext | null;
}

function getCreditEndDate(goal: Goal, asOfDate: string) {
  if (
    goal.end_date &&
    compareDateStrings(goal.end_date, asOfDate) < 0
  ) {
    return goal.end_date;
  }
  return asOfDate;
}

export function isCompletionAdmissible(
  goal: Goal,
  completedOn: string,
  { asOfDate }: GoalProgressContext
) {
  if (compareDateStrings(completedOn, goal.start_date) < 0) {
    return false;
  }
  if (compareDateStrings(completedOn, asOfDate) > 0) {
    return false;
  }
  if (
    goal.end_date &&
    compareDateStrings(completedOn, goal.end_date) > 0
  ) {
    return false;
  }
  return true;
}

export function getAdmissibleCompletions(
  goal: Goal,
  completions: Completion[],
  context: GoalProgressContext
) {
  return completions
    .filter((completion) =>
      isCompletionAdmissible(goal, completion.completed_on, context)
    )
    .sort((left, right) =>
      left.completed_on.localeCompare(right.completed_on)
    );
}

export function getExpectedCadencePeriodCount(
  goal: Goal,
  { asOfDate, weeklyAnchor }: GoalProgressContext
) {
  if (
    goal.frequency_type !== "recurring" ||
    getGoalRequirement(goal).kind !== "cadence" ||
    compareDateStrings(asOfDate, goal.start_date) < 0
  ) {
    return 0;
  }

  const interval = goal.recurrence_interval ?? "daily";
  const creditEnd = getCreditEndDate(goal, asOfDate);
  return (
    getAnchoredPeriod(goal.start_date, interval, creditEnd, weeklyAnchor ?? null)
      .index + 1
  );
}

function groupAdmissibleByPeriodKey(
  goal: Goal,
  admissible: Completion[],
  weeklyAnchor: WeeklyAnchorContext | null
) {
  const requirement = getGoalRequirement(goal);
  if (requirement.kind !== "cadence") {
    return new Map<string, string[]>();
  }

  const grouped = new Map<string, string[]>();
  for (const completion of admissible) {
    const periodKey = getAnchoredPeriod(
      goal.start_date,
      requirement.interval,
      completion.completed_on,
      weeklyAnchor
    ).periodKey;
    const existing = grouped.get(periodKey) ?? [];
    existing.push(completion.completed_on);
    grouped.set(periodKey, existing);
  }
  return grouped;
}

export function countDistinctCompletionDays(dates: string[]) {
  return new Set(dates).size;
}

export function isCadencePeriodSatisfied(
  goal: Goal,
  completions: Completion[],
  periodKey: string,
  context: GoalProgressContext
) {
  const requirement = getGoalRequirement(goal);
  if (requirement.kind !== "cadence") {
    return false;
  }
  const admissible = getAdmissibleCompletions(goal, completions, context);
  const grouped = groupAdmissibleByPeriodKey(
    goal,
    admissible,
    context.weeklyAnchor ?? null
  );
  const dates = grouped.get(periodKey) ?? [];
  return countDistinctCompletionDays(dates) >= requirement.targetCount;
}

export function getCurrentCadencePeriodKey(
  goal: Goal,
  context: GoalProgressContext
) {
  const requirement = getGoalRequirement(goal);
  if (requirement.kind !== "cadence") {
    return null;
  }
  return getAnchoredPeriod(
    goal.start_date,
    requirement.interval,
    context.asOfDate,
    context.weeklyAnchor ?? null
  ).periodKey;
}

export function getClosedCadencePeriodKeys(
  goal: Goal,
  context: GoalProgressContext
) {
  const requirement = getGoalRequirement(goal);
  if (requirement.kind !== "cadence") {
    return [];
  }

  const creditEnd = getCreditEndDate(goal, context.asOfDate);
  const currentIndex = getAnchoredPeriod(
    goal.start_date,
    requirement.interval,
    creditEnd,
    context.weeklyAnchor ?? null
  ).index;
  const keys: string[] = [];

  for (let index = 0; index < currentIndex; index += 1) {
    const periodStart = getAnchoredPeriodStart(
      goal.start_date,
      requirement.interval,
      index,
      context.weeklyAnchor ?? null
    );
    const period = getAnchoredPeriod(
      goal.start_date,
      requirement.interval,
      periodStart,
      context.weeklyAnchor ?? null
    );
    keys.push(period.periodKey);
  }

  return keys;
}

export function getCadenceHitRatePercent(
  goal: Goal,
  completions: Completion[],
  context: GoalProgressContext
) {
  const closedKeys = getClosedCadencePeriodKeys(goal, context);
  if (closedKeys.length === 0) {
    return null;
  }
  const satisfied = closedKeys.filter((periodKey) =>
    isCadencePeriodSatisfied(goal, completions, periodKey, context)
  ).length;
  return Math.min(100, (satisfied / closedKeys.length) * 100);
}

export function getCurrentPeriodCompletionCount(
  goal: Goal,
  completions: Completion[],
  context: GoalProgressContext
) {
  const requirement = getGoalRequirement(goal);
  if (requirement.kind !== "cadence") {
    return 0;
  }
  const periodKey = getCurrentCadencePeriodKey(goal, context);
  if (!periodKey) {
    return 0;
  }
  const admissible = getAdmissibleCompletions(goal, completions, context);
  const grouped = groupAdmissibleByPeriodKey(
    goal,
    admissible,
    context.weeklyAnchor ?? null
  );
  return countDistinctCompletionDays(grouped.get(periodKey) ?? []);
}

export function isCadencePeriodSatisfiedForCurrentPeriod(
  goal: Goal,
  completions: Completion[],
  context: GoalProgressContext
) {
  const requirement = getGoalRequirement(goal);
  if (requirement.kind !== "cadence") {
    return false;
  }
  const periodKey = getCurrentCadencePeriodKey(goal, context);
  if (!periodKey) {
    return false;
  }
  return isCadencePeriodSatisfied(goal, completions, periodKey, context);
}

export function getCreditedUnitCount(
  goal: Goal,
  completions: Completion[],
  context: GoalProgressContext
) {
  const admissible = getAdmissibleCompletions(goal, completions, context);
  const requirement = getGoalRequirement(goal);

  if (requirement.kind !== "cadence") {
    return Math.min(admissible.length, requirement.targetCount);
  }

  const grouped = groupAdmissibleByPeriodKey(
    goal,
    admissible,
    context.weeklyAnchor ?? null
  );
  let satisfiedPeriods = 0;
  for (const dates of grouped.values()) {
    if (countDistinctCompletionDays(dates) >= requirement.targetCount) {
      satisfiedPeriods += 1;
    }
  }
  return satisfiedPeriods;
}
