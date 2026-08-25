import type {
  Goal,
  GoalFrequencyType,
  GoalTargetBasis,
  RecurrenceInterval,
} from "@/lib/goals/types";

export const INVALID_GOAL_TARGET_BASIS_MESSAGE =
  "Target basis must be period or lifetime.";

export function getGoalPeriodTargetMax(
  interval: RecurrenceInterval
): number {
  if (interval === "weekly") {
    return 7;
  }
  if (interval === "monthly") {
    return 31;
  }
  return 1;
}

export interface GoalTargetBasisInput {
  frequencyType: GoalFrequencyType;
  recurrenceInterval: RecurrenceInterval | null | undefined;
  targetCount: number | null;
  targetBasis: unknown;
}

export interface GoalTargetBasisResolution {
  basis: GoalTargetBasis;
  error: string | null;
}

export function resolveGoalTargetBasisFromInput({
  frequencyType,
  recurrenceInterval,
  targetCount,
  targetBasis,
}: GoalTargetBasisInput): GoalTargetBasisResolution {
  const normalizedBasis =
    typeof targetBasis === "string" ? targetBasis.trim().toLowerCase() : "";
  const hasInvalidExplicitBasis =
    normalizedBasis.length > 0 &&
    normalizedBasis !== "period" &&
    normalizedBasis !== "lifetime";

  if (frequencyType === "fixed_milestones") {
    return {
      basis: "lifetime",
      error: hasInvalidExplicitBasis ? INVALID_GOAL_TARGET_BASIS_MESSAGE : null,
    };
  }

  if (normalizedBasis === "period" || normalizedBasis === "lifetime") {
    return { basis: normalizedBasis, error: null };
  }

  if (hasInvalidExplicitBasis) {
    return {
      basis: "period",
      error: INVALID_GOAL_TARGET_BASIS_MESSAGE,
    };
  }

  const periodMax = getGoalPeriodTargetMax(recurrenceInterval ?? "daily");
  return {
    basis:
      typeof targetCount === "number" &&
      Number.isFinite(targetCount) &&
      targetCount > periodMax
        ? "lifetime"
        : "period",
    error: null,
  };
}

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
