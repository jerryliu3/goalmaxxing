import { compareDateStrings } from "@/lib/goals/periods";
import type { PlannerActiveGoalSnapshot } from "@cadence/shared/planner/context";

export interface PlannerResetGoalOption {
  goalId: string;
  title: string;
}

export function buildPlannerResetGoalOptions(
  goals: PlannerActiveGoalSnapshot[] | undefined,
  asOfDate: string
): PlannerResetGoalOption[] {
  return (goals ?? [])
    .filter(
      (goal) =>
        goal.end_date === undefined ||
        goal.end_date === null ||
        compareDateStrings(goal.end_date, asOfDate) >= 0
    )
    .map((goal) => ({
      goalId: goal.original_goal_id,
      title: goal.title,
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}
