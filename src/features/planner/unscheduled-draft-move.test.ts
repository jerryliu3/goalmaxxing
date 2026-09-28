import { describe, expect, it } from "vitest";
import { buildPlannerWorkUnit } from "@/features/planner/test-fixtures";
import { selectUnscheduledDraftMove } from "@/features/planner/unscheduled-draft-move";

describe("selectUnscheduledDraftMove", () => {
  it("moves the earliest incomplete ordinal into a current or future empty day", () => {
    const workUnits = [
      buildPlannerWorkUnit({
        unitKey: "milestone:2",
        kind: "milestone_sequence",
        scheduledDate: "2026-09-20",
        creditWindow: { start: "2026-09-01", end: "2026-09-30" },
        draftMoveWindow: { start: "2026-09-01", end: "2026-09-30" },
      }),
      buildPlannerWorkUnit({
        unitKey: "milestone:1",
        kind: "milestone_sequence",
        scheduledDate: "2026-09-18",
        creditWindow: { start: "2026-09-01", end: "2026-09-30" },
        draftMoveWindow: { start: "2026-09-01", end: "2026-09-30" },
      }),
    ];

    expect(
      selectUnscheduledDraftMove({
        goalId: "goal-1",
        targetDate: "2026-09-12",
        workUnits,
      })
    ).toEqual({
      goalId: "goal-1",
      unitKey: "milestone:1",
      sourceDate: "2026-09-18",
      scheduledDate: "2026-09-12",
    });
  });

  it("does not offer completed, locked, or already-earlier sessions", () => {
    const moveWindow = { start: "2026-09-01", end: "2026-09-30" };
    const creditWindow = moveWindow;
    expect(
      selectUnscheduledDraftMove({
        goalId: "goal-1",
        targetDate: "2026-09-12",
        workUnits: [
          buildPlannerWorkUnit({
            kind: "milestone_sequence",
            scheduledDate: "2026-09-10",
            creditWindow,
            draftMoveWindow: moveWindow,
          }),
          buildPlannerWorkUnit({
            unitKey: "milestone:2",
            kind: "milestone_sequence",
            scheduledDate: "2026-09-20",
            creditWindow,
            draftMoveWindow: moveWindow,
            creditState: "completed_elsewhere",
          }),
          buildPlannerWorkUnit({
            unitKey: "milestone:3",
            kind: "milestone_sequence",
            scheduledDate: "2026-09-22",
            creditWindow,
            draftMoveWindow: moveWindow,
            locked: true,
          }),
        ],
      })
    ).toBeNull();
  });
});
