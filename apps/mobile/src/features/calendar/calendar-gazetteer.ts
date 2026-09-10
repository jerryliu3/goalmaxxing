import { gazetteerFillForGoal } from "@cadence/shared/brand/gazetteer";
import type {
  PlannerContextPayload,
  PlannerWorkUnit,
} from "@cadence/shared/planner/context";

export function resolveMobileSessionFill(
  context: PlannerContextPayload | null | undefined,
  unit: PlannerWorkUnit
) {
  const goal = context?.activePlan?.goals.find(
    (entry) => entry.original_goal_id === unit.originalGoalId
  );
  return gazetteerFillForGoal(goal?.color ?? null, goal?.category ?? null);
}

export function selectMobileRecoverCopy(
  unplaceableGoals: PlannerContextPayload["unplaceableGoals"]
) {
  if (!unplaceableGoals || unplaceableGoals.length === 0) {
    return null;
  }
  const unplacedCount = unplaceableGoals.reduce(
    (total, goal) => total + goal.unplacedCount,
    0
  );
  if (unplacedCount > 0) {
    return `${unplacedCount} goal${
      unplacedCount === 1 ? " still has" : "s still have"
    } sessions to recover.`;
  }
  return "Some sessions still need a home. Recover them when you're ready.";
}
