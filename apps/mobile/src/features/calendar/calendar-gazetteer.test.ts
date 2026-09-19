import { describe, expect, it } from "vitest";
import { CATEGORY_COLORS } from "@cadence/shared/brand";
import type { PlannerContextPayload, PlannerWorkUnit } from "@cadence/shared/planner/context";
import {
  resolveMobileMonthPillStyle,
  resolveMobileSessionFill,
  selectMobileMonthPills,
  selectMobileRecoverCopy,
} from "./calendar-gazetteer";

function unit(goalId: string): PlannerWorkUnit {
  return {
    originalGoalId: goalId,
    unitKey: "u1",
    label: "Run",
    scheduledDate: "2026-09-06",
    classification: "open",
    creditState: "uncredited",
  };
}

describe("mobile Plan Gazetteer helpers", () => {
  it("fills sessions from goal color, then category", () => {
    const context = {
      activePlan: {
        plan: { id: "p", version: 1, status: "active" as const },
        goals: [
          {
            id: "pg1",
            goal_id: "g1",
            original_goal_id: "g1",
            requirement_fingerprint: "fp",
            title: "Lift",
            category: "Career",
            color: "#10b981",
          },
        ],
        items: [],
      },
    } as Pick<PlannerContextPayload, "activePlan">;

    expect(resolveMobileSessionFill(context as PlannerContextPayload, unit("g1"))).toBe(
      CATEGORY_COLORS.health
    );
    expect(resolveMobileSessionFill(context as PlannerContextPayload, unit("missing"))).toBe(
      CATEGORY_COLORS.other
    );
  });

  it("clips month pills and uses opaque Gazetteer work-pill fills", () => {
    expect(selectMobileMonthPills(["a", "b", "c"]).overflowCount).toBe(1);
    expect(selectMobileMonthPills(["a", "b", "c"]).visible).toEqual(["a", "b"]);
    const credited = resolveMobileMonthPillStyle(CATEGORY_COLORS.health, true);
    const uncredited = resolveMobileMonthPillStyle(CATEGORY_COLORS.health, false);
    expect(credited.backgroundColor).toBe(credited.borderColor);
    expect(uncredited.backgroundColor).not.toBe(credited.backgroundColor);
  });

  it("uses Recover copy for unplaced and lock/capacity leftovers", () => {
    expect(selectMobileRecoverCopy(undefined)).toBeNull();
    expect(
      selectMobileRecoverCopy([
        {
          goalId: "g1",
          requirementFingerprint: "fp",
          policyFingerprint: "pol",
          policyRevision: 1,
          lockSignature: "lock",
          effectiveSpanEnd: "2026-09-30",
          unplacedCount: 2,
          reason: "capacity",
        },
      ])
    ).toBe("2 goals still have sessions to recover.");
    expect(
      selectMobileRecoverCopy([
        {
          goalId: "g1",
          requirementFingerprint: "fp",
          policyFingerprint: "pol",
          policyRevision: 1,
          lockSignature: "lock",
          effectiveSpanEnd: "2026-09-30",
          unplacedCount: 0,
          reason: "invalid_lock",
        },
      ])
    ).toBe("Some sessions still need a home. Recover them when you're ready.");
  });
});
