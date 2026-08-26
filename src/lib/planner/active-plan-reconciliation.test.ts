import { describe, expect, it } from "vitest";
import {
  hydrateActivePlanItemsFromWorkUnits,
  rebuildCompletionToUnitFromWorkUnits,
} from "@/lib/planner/active-plan-reconciliation";
import type { PlannerWorkUnit } from "@/lib/planner/work-units";

describe("active plan reconciliation hydration", () => {
  it("overlays kernel credit onto persisted planner items", () => {
    const workUnits = [
      {
        originalGoalId: "goal-1",
        unitKey: "cadence:2026-08-10:1",
        requirementFingerprint: "fp-1",
        classification: "satisfied_elsewhere",
        creditState: "completed_elsewhere",
        creditedCompletionId: "completion-1",
        creditedCompletionDate: "2026-08-07",
      },
    ] as PlannerWorkUnit[];

    const [hydrated] = hydrateActivePlanItemsFromWorkUnits(
      [
        {
          id: "item-1",
          plan_goal_id: "plan-goal-1",
          unit_key: "cadence:2026-08-10:1",
          requirement_kind: "cadence",
          scheduled_date: "2026-08-10",
          classification: "open",
          credit_state: "uncredited",
          locked: false,
          revision: 0,
          credited_completion_id: null,
          credited_completion_date: null,
        },
      ],
      workUnits,
      new Map([["plan-goal-1", "goal-1"]])
    );

    expect(hydrated.classification).toBe("satisfied_elsewhere");
    expect(hydrated.credit_state).toBe("completed_elsewhere");
    expect(hydrated.credited_completion_id).toBe("completion-1");
    expect(rebuildCompletionToUnitFromWorkUnits(workUnits)).toEqual({
      "completion-1": {
        goalId: "goal-1",
        requirementFingerprint: "fp-1",
        unitKey: "cadence:2026-08-10:1",
        completedOn: "2026-08-07",
      },
    });
  });
});
