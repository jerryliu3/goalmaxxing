import type { PlannerActiveItemSnapshot } from "@cadence/shared/planner/context";
import type { PlannerWorkUnit } from "@/lib/planner/work-units";

function buildWorkUnitIndex(workUnits: PlannerWorkUnit[]) {
  return new Map(
    workUnits.map((unit) => [
      `${unit.originalGoalId}:${unit.unitKey}`,
      unit,
    ])
  );
}

export function hydrateActivePlanItemsFromWorkUnits(
  items: PlannerActiveItemSnapshot[],
  workUnits: PlannerWorkUnit[],
  goalIdByPlanGoalId: ReadonlyMap<string, string>
): PlannerActiveItemSnapshot[] {
  const unitByKey = buildWorkUnitIndex(workUnits);

  return items.map((item) => {
    const originalGoalId =
      goalIdByPlanGoalId.get(item.plan_goal_id) ?? item.plan_goal_id;
    const unit = unitByKey.get(`${originalGoalId}:${item.unit_key}`);
    if (!unit) {
      return {
        ...item,
        classification: "open",
        credit_state: "uncredited",
        credited_completion_id: null,
        credited_completion_date: null,
      };
    }

    return {
      ...item,
      classification: unit.classification,
      credit_state: unit.creditState,
      credited_completion_id: unit.creditedCompletionId,
      credited_completion_date: unit.creditedCompletionDate,
    };
  });
}

export function rebuildCompletionToUnitFromWorkUnits(
  workUnits: PlannerWorkUnit[]
) {
  const completionToUnit: Record<
    string,
    {
      goalId: string;
      requirementFingerprint: string;
      unitKey: string;
      completedOn: string;
    }
  > = {};

  for (const unit of workUnits) {
    if (!unit.creditedCompletionId || !unit.creditedCompletionDate) {
      continue;
    }
    completionToUnit[unit.creditedCompletionId] = {
      goalId: unit.originalGoalId,
      requirementFingerprint: unit.requirementFingerprint,
      unitKey: unit.unitKey,
      completedOn: unit.creditedCompletionDate,
    };
  }

  return completionToUnit;
}
