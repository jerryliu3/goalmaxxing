import { describe, expect, it } from "vitest";
import { detectActivePlanReconciliationMismatches } from "@/lib/planner/active-plan-reconciliation";
import type { PlannerWorkUnit } from "@/lib/planner/work-units";

function workUnit(
  overrides: Partial<PlannerWorkUnit> &
    Pick<PlannerWorkUnit, "originalGoalId" | "unitKey" | "classification" | "creditState">
): PlannerWorkUnit {
  return {
    requirementSchemaVersion: "1",
    requirementFingerprint: "fp-1",
    kind: "deadline_total",
    ordinal: 1,
    periodKey: null,
    label: "Run",
    creditWindow: { start: "2026-08-01", end: "2026-08-31" },
    placementWindow: { start: "2026-08-01", end: "2026-08-31" },
    draftMoveWindow: null,
    missPolicy: "roll_forward",
    restEligible: true,
    maxPerDay: 1,
    creditedCompletionId: null,
    creditedCompletionDate: null,
    scheduledDate: "2026-08-01",
    locked: false,
    ...overrides,
  };
}

const identityItem = {
  id: "item-1",
  plan_goal_id: "pg-1",
  unit_key: "unit-1",
  requirement_kind: "deadline_total" as const,
  scheduled_date: "2026-08-01",
  locked: false,
  revision: 1,
};

describe("detectActivePlanReconciliationMismatches", () => {
  it("returns empty when every snapshot item has a matching work unit", () => {
    const mismatches = detectActivePlanReconciliationMismatches({
      planId: "plan-1",
      items: [identityItem],
      workUnits: [
        workUnit({
          originalGoalId: "goal-1",
          unitKey: "unit-1",
          classification: "fulfilled",
          creditState: "completed_as_scheduled",
        }),
      ],
      goalIdByPlanGoalId: new Map([["pg-1", "goal-1"]]),
    });

    expect(mismatches).toEqual([]);
  });

  it("does not treat credited work units without a snapshot item as mismatches", () => {
    const mismatches = detectActivePlanReconciliationMismatches({
      planId: "plan-1",
      items: [],
      workUnits: [
        workUnit({
          originalGoalId: "goal-1",
          unitKey: "unit-1",
          classification: "fulfilled",
          creditState: "completed_as_scheduled",
          creditedCompletionId: "completion-1",
          creditedCompletionDate: "2026-07-15",
        }),
      ],
      goalIdByPlanGoalId: new Map([["pg-1", "goal-1"]]),
    });

    expect(mismatches).toEqual([]);
  });

  it("detects snapshot items with no matching work unit", () => {
    const mismatches = detectActivePlanReconciliationMismatches({
      planId: "plan-1",
      items: [identityItem],
      workUnits: [],
      goalIdByPlanGoalId: new Map([["pg-1", "goal-1"]]),
    });

    expect(mismatches).toEqual([
      {
        entryKey: "goal-1:unit-1",
        planId: "plan-1",
        planGoalId: "pg-1",
        unitKey: "unit-1",
        reason: "missing_work_unit",
      },
    ]);
  });
});
