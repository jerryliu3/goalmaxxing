import type { Goal, GoalTargetBasis } from "@/lib/goals/types";

export function resolveGoalTargetBasis(goal: Goal): GoalTargetBasis {
  if (goal.target_basis) {
    return goal.target_basis;
  }
  if (goal.frequency_type === "fixed_milestones") {
    return "lifetime";
  }
  if (
    goal.frequency_type === "recurring" &&
    typeof goal.target_count === "number" &&
    goal.target_count > 0
  ) {
    return "lifetime";
  }
  return "period";
}

export function isPeriodCadenceGoal(goal: Goal) {
  return (
    goal.frequency_type === "recurring" &&
    resolveGoalTargetBasis(goal) === "period"
  );
}

export function isDeadlineTotalGoal(goal: Goal) {
  return (
    goal.frequency_type === "recurring" &&
    resolveGoalTargetBasis(goal) === "lifetime"
  );
}

export function cadencePeriodTarget(goal: Goal) {
  return goal.target_count ?? 1;
}

export function cadenceUnitKey(periodKey: string, slot: number) {
  return `cadence:${periodKey}:${slot}`;
}

export function parseCadenceUnitKey(unitKey: string) {
  const match = /^cadence:(.+):([1-9][0-9]*)$/.exec(unitKey);
  if (!match) {
    return null;
  }
  return {
    periodKey: match[1],
    slot: Number(match[2]),
  };
}

export function matchesCadenceUnitKey(
  unitKey: string,
  periodKey: string,
  targetCount: number
) {
  const parsed = parseCadenceUnitKey(unitKey);
  if (!parsed || parsed.periodKey !== periodKey) {
    return false;
  }
  return parsed.slot >= 1 && parsed.slot <= targetCount;
}
