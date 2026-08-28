import type { MobileGoal } from "./checklist-lane-data";

export interface ChecklistVisibilityFilters {
  showEndedGoals: boolean;
  showUpcomingGoals: boolean;
  showArchivedGoals: boolean;
  showTargetAchievedGoals: boolean;
}

export interface ChecklistVisibilityCounts {
  past: number;
  upcoming: number;
  archived: number;
  completed: number;
}

export function filterMobileChecklistGoals({
  goals,
  targetAchievedGoalIds,
  asOfDate,
  filters,
}: {
  goals: MobileGoal[];
  targetAchievedGoalIds: ReadonlySet<string>;
  asOfDate: string;
  filters: ChecklistVisibilityFilters;
}): MobileGoal[] {
  return goals.filter((goal) => {
    if (goal.archived_at) {
      return filters.showArchivedGoals;
    }
    if (goal.start_date > asOfDate) {
      return filters.showUpcomingGoals;
    }
    if (goal.end_date && goal.end_date < asOfDate) {
      return filters.showEndedGoals;
    }
    return !targetAchievedGoalIds.has(goal.id) || filters.showTargetAchievedGoals;
  });
}

export function countMobileChecklistGoalVisibility({
  goals,
  targetAchievedGoalIds,
  asOfDate,
}: {
  goals: MobileGoal[];
  targetAchievedGoalIds: ReadonlySet<string>;
  asOfDate: string;
}): ChecklistVisibilityCounts {
  const counts: ChecklistVisibilityCounts = {
    past: 0,
    upcoming: 0,
    archived: 0,
    completed: 0,
  };
  for (const goal of goals) {
    if (goal.archived_at) {
      counts.archived += 1;
    } else if (goal.start_date > asOfDate) {
      counts.upcoming += 1;
    } else if (goal.end_date && goal.end_date < asOfDate) {
      counts.past += 1;
    } else if (targetAchievedGoalIds.has(goal.id)) {
      counts.completed += 1;
    }
  }
  return counts;
}
