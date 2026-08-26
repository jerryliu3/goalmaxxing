import type { PlannerActiveItemSnapshot } from "@cadence/shared/planner/context";
import type { PlannerWorkUnit } from "@/lib/planner/work-units";

export interface ReconciliationMismatch {
  entryKey: string;
  planId: string | null;
  planGoalId: string;
  unitKey: string;
  snapshotClassification: string;
  unitClassification: string;
  snapshotCreditState: string;
  unitCreditState: string;
}

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

export function detectActivePlanReconciliationMismatches({
  items,
  workUnits,
  goalIdByPlanGoalId,
  planId = null,
}: {
  items: PlannerActiveItemSnapshot[];
  workUnits: PlannerWorkUnit[];
  goalIdByPlanGoalId: ReadonlyMap<string, string>;
  planId?: string | null;
}): ReconciliationMismatch[] {
  const unitByKey = buildWorkUnitIndex(workUnits);
  const mismatches: ReconciliationMismatch[] = [];

  for (const item of items) {
    const originalGoalId =
      goalIdByPlanGoalId.get(item.plan_goal_id) ?? item.plan_goal_id;
    const unit = unitByKey.get(`${originalGoalId}:${item.unit_key}`);
    if (!unit) {
      continue;
    }
    if (
      unit.classification !== item.classification ||
      unit.creditState !== item.credit_state
    ) {
      mismatches.push({
        entryKey: `${originalGoalId}:${item.unit_key}`,
        planId,
        planGoalId: item.plan_goal_id,
        unitKey: item.unit_key,
        snapshotClassification: item.classification,
        unitClassification: unit.classification,
        snapshotCreditState: item.credit_state,
        unitCreditState: unit.creditState,
      });
    }
  }

  return mismatches;
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
