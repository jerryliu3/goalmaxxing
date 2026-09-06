import type { PlannerEligibilityNotices } from "@/features/planner/planner-eligibility-notices";

export type PlannerWarningSeverity = "none" | "actionable";

export interface PlannerWarningModel {
  warningSuggestedNextSteps: string[];
  hasPlannerWarnings: boolean;
  plannerWarningSeverity: PlannerWarningSeverity;
  plannerWarningBannerCopy: string;
}

interface PlannerWarningModelArgs {
  unplaceableGoalCount: number;
  invalidLockGoalCount: number;
  capacityWarningGoalCount: number;
  eligibilityNotices: PlannerEligibilityNotices;
}

export function selectPlannerWarningModel({
  unplaceableGoalCount,
  invalidLockGoalCount,
  capacityWarningGoalCount,
  eligibilityNotices,
}: PlannerWarningModelArgs): PlannerWarningModel {
  const warningSuggestedNextSteps: string[] = [];
  if (invalidLockGoalCount > 0) {
    warningSuggestedNextSteps.push(
      "Unlock conflicting locked sessions and regenerate the calendar."
    );
  }
  if (capacityWarningGoalCount > 0) {
    warningSuggestedNextSteps.push(
      "Open planner settings to adjust targets, deadlines, or rest-day constraints."
    );
  }

  const hasPlannerWarnings =
    unplaceableGoalCount > 0 ||
    eligibilityNotices.hardIneligible.length > 0 ||
    invalidLockGoalCount > 0 ||
    capacityWarningGoalCount > 0;
  const plannerWarningSeverity: PlannerWarningSeverity = !hasPlannerWarnings
    ? "none"
    : "actionable";
  const plannerWarningBannerCopy =
    unplaceableGoalCount > 0
      ? `${unplaceableGoalCount} goal${
          unplaceableGoalCount === 1 ? " still has" : "s still have"
        } sessions to recover.`
      : eligibilityNotices.hardIneligible.length > 0
        ? `${eligibilityNotices.hardIneligible.length} goal${
            eligibilityNotices.hardIneligible.length === 1 ? " needs" : "s need"
          } a small update before ${
            eligibilityNotices.hardIneligible.length === 1 ? "it" : "they"
          } can be placed.`
        : "Some sessions still need a home. Recover them when you're ready.";

  return {
    warningSuggestedNextSteps,
    hasPlannerWarnings,
    plannerWarningSeverity,
    plannerWarningBannerCopy,
  };
}
