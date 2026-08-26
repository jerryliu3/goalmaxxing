import type { Completion, Goal } from "@/lib/goals/types";
import type { WeeklyAnchorContext } from "@/lib/goals/periods";
import type { DateWindow } from "@/lib/planner/dates";
import {
  normalizeGoalRequirement,
  type NormalizedGoalRequirement,
} from "@/lib/planner/requirements";
import {
  reconcilePlannerCompletions,
  type ReconciliationResult,
} from "@/lib/planner/reconciliation";
import {
  materializeWorkUnits,
  type PlannerBaseAssignment,
} from "@/lib/planner/work-units";

export function buildArchivedGoalHistoricalWorkUnits({
  goal,
  window,
  asOfDate,
  baseAssignments,
  completions,
  previousCompletionToUnit,
  weeklyAnchor,
}: {
  goal: Goal;
  window: DateWindow;
  asOfDate: string;
  baseAssignments: PlannerBaseAssignment[];
  completions: Completion[];
  previousCompletionToUnit: Record<
    string,
    ReconciliationResult["completionToUnit"][string]
  >;
  weeklyAnchor: WeeklyAnchorContext | null;
}): ReconciliationResult {
  const normalizedRequirement = normalizeGoalRequirement(goal);

  const materialized = materializeWorkUnits({
    goal,
    normalizedRequirement,
    window,
    asOfDate,
    baseAssignments,
    ordinalsForScopeMonth: buildArchivedGoalOrdinalScope(normalizedRequirement),
    weeklyAnchor,
  });

  const reconciled = reconcilePlannerCompletions({
    goal,
    workUnits: materialized,
    completions,
    asOfDate,
    previousCompletionToUnit,
    allowScheduledDateMatching: true,
  });

  const historicalUnits = reconciled.units.filter(
    (unit) => unit.creditedCompletionId !== null
  );
  const creditedUnitKeys = new Set(historicalUnits.map((unit) => unit.unitKey));
  const historicalCompletionToUnit = Object.fromEntries(
    Object.entries(reconciled.completionToUnit).filter(([, identity]) =>
      creditedUnitKeys.has(identity.unitKey)
    )
  );

  return {
    units: historicalUnits,
    completionToUnit: historicalCompletionToUnit,
    driftFacts: [],
  };
}

export function isArchivedGoal(goal: Goal) {
  return goal.archived_at !== null;
}

export function buildArchivedGoalOrdinalScope(
  normalizedRequirement: NormalizedGoalRequirement
) {
  if (normalizedRequirement.requirement.kind === "cadence") {
    return undefined;
  }
  return new Set(
    Array.from(
      { length: normalizedRequirement.requirement.targetCount },
      (_, index) => index + 1
    )
  );
}
