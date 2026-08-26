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

describe("detectActivePlanReconciliationMismatches", () => {
  it("returns empty when snapshot matches work units", () => {
    const mismatches = detectActivePlanReconciliationMismatches({
      planId: "plan-1",
      items: [
        {
          id: "item-1",
          plan_goal_id: "pg-1",
          unit_key: "unit-1",
          requirement_kind: "deadline_total",
          scheduled_date: "2026-08-01",
          classification: "open",
          credit_state: "uncredited",
          locked: false,
          revision: 1,
          credited_completion_id: null,
          credited_completion_date: null,
        },
      ],
      workUnits: [
        workUnit({
          originalGoalId: "goal-1",
          unitKey: "unit-1",
          classification: "open",
          creditState: "uncredited",
        }),
      ],
      goalIdByPlanGoalId: new Map([["pg-1", "goal-1"]]),
    });

    expect(mismatches).toEqual([]);
  });

  it("detects classification and credit mismatches", () => {
    const mismatches = detectActivePlanReconciliationMismatches({
      planId: "plan-1",
      items: [
        {
          id: "item-1",
          plan_goal_id: "pg-1",
          unit_key: "unit-1",
          requirement_kind: "deadline_total",
          scheduled_date: "2026-08-01",
          classification: "open",
          credit_state: "uncredited",
          locked: false,
          revision: 1,
          credited_completion_id: null,
          credited_completion_date: null,
        },
      ],
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

    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]).toMatchObject({
      entryKey: "goal-1:unit-1",
      planId: "plan-1",
      snapshotClassification: "open",
      unitClassification: "fulfilled",
      snapshotCreditState: "uncredited",
      unitCreditState: "completed_as_scheduled",
    });
  });
});
