import { describe, expect, it } from "vitest";
import type { PlannerEligibilityNotices } from "@/features/planner/planner-eligibility-notices";
import { selectPlannerWarningModel } from "@/features/planner/planner-warning-model";

const emptyEligibility: PlannerEligibilityNotices = {
  hardIneligible: [],
  groupedHardIneligible: [],
};

describe("selectPlannerWarningModel", () => {
  it("does not warn without a lock conflict or eligibility blocker", () => {
    const model = selectPlannerWarningModel({ invalidLockGoalCount: 0, eligibilityNotices: emptyEligibility });
    expect(model.hasPlannerWarnings).toBe(false);
    expect(model.plannerWarningSeverity).toBe("none");
    expect(model.warningSuggestedNextSteps).toEqual([]);
  });

  it("uses adaptive copy when only eligibility is blocked", () => {
    const model = selectPlannerWarningModel({
      invalidLockGoalCount: 0,
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

  it("surfaces lock conflicts separately from missed-session recovery", () => {
    const model = selectPlannerWarningModel({
      invalidLockGoalCount: 1,
      eligibilityNotices: emptyEligibility,
    });

    expect(model.hasPlannerWarnings).toBe(true);
    expect(model.plannerWarningBannerCopy).toBe(
      "1 goal has conflicting locked sessions."
    );
    expect(model.warningSuggestedNextSteps).toEqual([
      "Unlock conflicting locked sessions and regenerate the calendar.",
    ]);
  });
});
