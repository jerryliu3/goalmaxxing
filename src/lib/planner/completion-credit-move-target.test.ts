import { describe, expect, it } from "vitest";
import { pickCreditMoveTarget } from "@/lib/planner/completion-credit-move-target";
import type { CreditMoveCandidateUnit } from "@/lib/planner/completion-credit-move-target";

function unit(
  overrides: Partial<CreditMoveCandidateUnit> &
    Pick<CreditMoveCandidateUnit, "unitKey">
): CreditMoveCandidateUnit {
  return {
    originalGoalId: "goal-a",
    scheduledDate: "2026-08-10",
    creditState: "uncredited",
    classification: "open",
    locked: false,
    creditWindow: { start: "2026-08-01", end: "2026-08-31" },
    ...overrides,
  };
}

describe("pickCreditMoveTarget", () => {
  it("prefers the latest past cadence session over a future one", () => {
    const target = pickCreditMoveTarget({
      goalId: "goal-a",
      completionDate: "2026-08-27",
      workUnits: [
        unit({
          unitKey: "cadence:2026-08-01:3",
          kind: "cadence",
          ordinal: 3,
          scheduledDate: "2026-08-28",
        }),
        unit({
          unitKey: "cadence:2026-08-01:4",
          kind: "cadence",
          ordinal: 4,
          scheduledDate: "2026-08-20",
        }),
      ],
    });
    expect(target).toEqual({
      unitKey: "cadence:2026-08-01:4",
      scheduledDate: "2026-08-20",
    });
  });

  it("uses the nearest future cadence session when nothing sits in the past", () => {
    const target = pickCreditMoveTarget({
      goalId: "goal-a",
      completionDate: "2026-08-05",
      workUnits: [
        unit({
          unitKey: "cadence:2026-08-01:2",
          kind: "cadence",
          ordinal: 2,
          scheduledDate: "2026-08-20",
        }),
        unit({
          unitKey: "cadence:2026-08-01:1",
          kind: "cadence",
          ordinal: 1,
          scheduledDate: "2026-08-10",
        }),
      ],
    });
    expect(target).toEqual({
      unitKey: "cadence:2026-08-01:1",
      scheduledDate: "2026-08-10",
    });
  });

  it("returns null when the credited session is already on the completion date", () => {
    expect(
      pickCreditMoveTarget({
        goalId: "goal-a",
        completionDate: "2026-08-10",
        workUnits: [
          unit({
            unitKey: "cadence:2026-08-01:1",
            kind: "cadence",
            scheduledDate: "2026-08-10",
          }),
        ],
      })
    ).toBeNull();
  });

  it("returns null when only unplaced remainder remains", () => {
    expect(
      pickCreditMoveTarget({
        goalId: "goal-a",
        completionDate: "2026-08-12",
        workUnits: [
          unit({
            unitKey: "total:3",
            kind: "deadline_total",
            ordinal: 3,
            scheduledDate: null,
          }),
        ],
      })
    ).toBeNull();
  });

  it("picks the first uncredited deadline ordinal when completing off-schedule", () => {
    const target = pickCreditMoveTarget({
      goalId: "goal-a",
      completionDate: "2026-08-12",
      workUnits: [
        unit({
          unitKey: "total:2",
          kind: "deadline_total",
          ordinal: 2,
          scheduledDate: "2026-08-20",
        }),
        unit({
          unitKey: "total:1",
          kind: "deadline_total",
          ordinal: 1,
          scheduledDate: "2026-08-18",
        }),
      ],
    });
    expect(target).toEqual({
      unitKey: "total:1",
      scheduledDate: "2026-08-18",
    });
  });

  it("skips locked and already credited sessions", () => {
    const target = pickCreditMoveTarget({
      goalId: "goal-a",
      completionDate: "2026-08-12",
      workUnits: [
        unit({
          unitKey: "total:1",
          kind: "deadline_total",
          ordinal: 1,
          scheduledDate: "2026-08-08",
          creditState: "completed_as_scheduled",
        }),
        unit({
          unitKey: "total:2",
          kind: "deadline_total",
          ordinal: 2,
          scheduledDate: "2026-08-18",
          locked: true,
        }),
        unit({
          unitKey: "total:3",
          kind: "deadline_total",
          ordinal: 3,
          scheduledDate: "2026-08-22",
        }),
      ],
    });
    expect(target).toEqual({
      unitKey: "total:3",
      scheduledDate: "2026-08-22",
    });
  });

  it("returns null when every placed session is already credited", () => {
    expect(
      pickCreditMoveTarget({
        goalId: "goal-a",
        completionDate: "2026-08-12",
        workUnits: [
          unit({
            unitKey: "cadence:2026-08-01:1",
            kind: "cadence",
            creditState: "completed_elsewhere",
            scheduledDate: "2026-08-07",
          }),
        ],
      })
    ).toBeNull();
  });
});
