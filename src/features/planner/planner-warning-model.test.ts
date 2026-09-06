import { describe, expect, it } from "vitest";
import type { PlannerEligibilityNotices } from "@/features/planner/planner-eligibility-notices";
import { selectPlannerWarningModel } from "@/features/planner/planner-warning-model";

const emptyEligibility: PlannerEligibilityNotices = {
  hardIneligible: [],
  groupedHardIneligible: [],
  linkedTargetCount: 0,
  linkedTargetDetails: [],
};

describe("selectPlannerWarningModel", () => {
  it("uses Recover copy for unplaced sessions", () => {
    const model = selectPlannerWarningModel({
      unplaceableGoalCount: 2,
      invalidLockGoalCount: 0,
      capacityWarningGoalCount: 2,
      eligibilityNotices: emptyEligibility,
    });

    expect(model.hasPlannerWarnings).toBe(true);
    expect(model.plannerWarningBannerCopy).toBe(
      "2 goals still have sessions to recover."
    );
  });

  it("uses adaptive copy when only eligibility is blocked", () => {
    const model = selectPlannerWarningModel({
      unplaceableGoalCount: 0,
      invalidLockGoalCount: 0,
      capacityWarningGoalCount: 0,
      eligibilityNotices: {
        ...emptyEligibility,
        hardIneligible: [
          {
            goalId: "goal-a",
            goalTitle: "Goal A",
            reason: "invalid_date_range",
            reasonCopy: "The goal dates are invalid (start is after end).",
          },
        ],
      },
    });

    expect(model.plannerWarningBannerCopy).toBe(
      "1 goal needs a small update before it can be placed."
    );
  });

  it("surfaces lock and capacity issues under Recover", () => {
    const model = selectPlannerWarningModel({
      unplaceableGoalCount: 0,
      invalidLockGoalCount: 1,
      capacityWarningGoalCount: 1,
      eligibilityNotices: emptyEligibility,
    });

    expect(model.hasPlannerWarnings).toBe(true);
    expect(model.plannerWarningBannerCopy).toBe(
      "Some sessions still need a home. Recover them when you're ready."
    );
    expect(model.warningSuggestedNextSteps).toEqual([
      "Unlock conflicting locked sessions and regenerate the calendar.",
      "Open planner settings to adjust targets, deadlines, or rest-day constraints.",
    ]);
  });
});
