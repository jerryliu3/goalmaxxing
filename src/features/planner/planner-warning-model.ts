import type { PlannerEligibilityNotices } from "@/features/planner/planner-eligibility-notices";

export type PlannerWarningSeverity = "none" | "actionable";

export interface PlannerWarningModel {
  warningSuggestedNextSteps: string[];
  hasPlannerWarnings: boolean;
  plannerWarningSeverity: PlannerWarningSeverity;
  plannerWarningBannerCopy: string;
}

interface PlannerWarningModelArgs {
  invalidLockGoalCount: number;
  eligibilityNotices: PlannerEligibilityNotices;
}

export function selectPlannerWarningModel({
  invalidLockGoalCount,
  eligibilityNotices,
}: PlannerWarningModelArgs): PlannerWarningModel {
  const hasPlannerWarnings =
    invalidLockGoalCount > 0 || eligibilityNotices.hardIneligible.length > 0;
  return {
    warningSuggestedNextSteps: invalidLockGoalCount > 0
      ? ["Unlock conflicting locked sessions and regenerate the calendar."]
      : [],
    hasPlannerWarnings,
    plannerWarningSeverity: hasPlannerWarnings ? "actionable" : "none",
    plannerWarningBannerCopy: invalidLockGoalCount > 0
      ? `${invalidLockGoalCount} goal${invalidLockGoalCount === 1 ? " has" : "s have"} conflicting locked sessions.`
      : `${eligibilityNotices.hardIneligible.length} goal${eligibilityNotices.hardIneligible.length === 1 ? " needs" : "s need"} a small update before ${eligibilityNotices.hardIneligible.length === 1 ? "it" : "they"} can be placed.`,
  };
}
