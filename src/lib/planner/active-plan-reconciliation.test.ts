import { describe, expect, it } from "vitest";
import { detectActivePlanReconciliationMismatches } from "@/lib/planner/active-plan-reconciliation";
import type { PlannerWorkUnit } from "@/lib/planner/work-units";

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
          classification: "planned",
          credit_state: "uncredited",
          locked: false,
          revision: 1,
          credited_completion_id: null,
          credited_completion_date: null,
        },
      ],
      workUnits: [
        {
          originalGoalId: "goal-1",
          unitKey: "unit-1",
          label: "Run",
          scheduledDate: "2026-08-01",
          classification: "planned",
          creditState: "uncredited",
        } satisfies PlannerWorkUnit,
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
        {
          originalGoalId: "goal-1",
          unitKey: "unit-1",
          label: "Run",
          scheduledDate: "2026-08-01",
          classification: "planned",
          creditState: "credited",
        } satisfies PlannerWorkUnit,
      ],
      goalIdByPlanGoalId: new Map([["pg-1", "goal-1"]]),
    });

    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]).toMatchObject({
      entryKey: "goal-1:unit-1",
      planId: "plan-1",
      snapshotClassification: "open",
      unitClassification: "planned",
      snapshotCreditState: "uncredited",
      unitCreditState: "credited",
    });
  });
});
