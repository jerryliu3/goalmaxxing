import { describe, expect, it, vi } from "vitest";
import { detectActivePlanReconciliationMismatches } from "@/lib/planner/active-plan-reconciliation";

vi.mock("@/lib/observability/report-error", () => ({
  reportError: vi.fn(),
}));

import { reportError } from "@/lib/observability/report-error";

describe("context loader reconciliation observability", () => {
  it("reports reconciliation_mismatch for divergent snapshot rows", () => {
    const mismatches = detectActivePlanReconciliationMismatches({
      planId: "plan-42",
      items: [
        {
          id: "item-1",
          plan_goal_id: "pg-1",
          unit_key: "cadence:2026-08:1",
          requirement_kind: "cadence",
          scheduled_date: "2026-08-12",
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
          unitKey: "cadence:2026-08:1",
          label: "Run",
          scheduledDate: "2026-08-12",
          classification: "planned",
          creditState: "credited",
        },
      ],
      goalIdByPlanGoalId: new Map([["pg-1", "goal-1"]]),
    });

    for (const mismatch of mismatches) {
      reportError(new Error("reconciliation_mismatch"), {
        code: "reconciliation_mismatch",
        ...mismatch,
      });
    }

    expect(reportError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        code: "reconciliation_mismatch",
        planId: "plan-42",
        entryKey: "goal-1:cadence:2026-08:1",
      })
    );
  });
});
