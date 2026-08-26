import { resolveCategoryKey } from "@/lib/goals/category";
import { getGoalLifecycle } from "@/lib/goals/lifecycle";
import {
  filterGoalsByEndMonths,
  sortGoalsByDate,
  type GoalDateSort,
} from "@/lib/goals/list-view";
import { isGoalManuallyArchived } from "@/lib/goals/schedule";
import { shouldHideTargetAchievedGoal } from "@/lib/goals/checklist-presentation";
import {
  getRecurrenceGroup,
  recurrenceGroupLabel,
  recurrenceGroupOrder,
  type RecurrenceGroup,
} from "@/lib/goals/recurrence-labels";
import type { CompletionDateFact, Goal } from "@/lib/goals/types";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";

export type { RecurrenceGroup };
export { recurrenceGroupLabel, recurrenceGroupOrder, getRecurrenceGroup };

export type RecurrenceFilter = "all" | "daily" | "weekly" | "monthly" | "fixed";

export const VISIBLE_GOALS_PER_GROUP = 4;
export const INITIAL_GROUP_EXPANDED: Record<RecurrenceGroup, boolean> = {
  daily: false,
  weekly: false,
  monthly: false,
  fixed: false,
};

export const recurrenceFilterOptions: Array<{
  value: RecurrenceFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "fixed", label: "Milestones" },
];

export function matchesTodayFacetFilters({
  goal,
  categoryFilters,
  recurrenceFilters,
}: {
  goal: Goal;
  categoryFilters: string[];
  recurrenceFilters: RecurrenceGroup[];
}): boolean {
  if (categoryFilters.length > 0) {
    const allowedCategoryKeys = new Set(
      categoryFilters.map((categoryFilter) => resolveCategoryKey(categoryFilter))
    );
    const goalCategoryKey = resolveCategoryKey(goal.category_key ?? goal.category);
    if (!allowedCategoryKeys.has(goalCategoryKey)) {
      return false;
    }
  }

  if (recurrenceFilters.length > 0) {
    const recurrenceGroup = getRecurrenceGroup(goal);
    if (!recurrenceFilters.includes(recurrenceGroup)) {
      return false;
    }
  }

  return true;
}

export function selectActiveGoals({
  completableGoals,
  lifecycleByGoalAtViewDate,
}: {
  completableGoals: Goal[];
  lifecycleByGoalAtViewDate: Map<string, ReturnType<typeof getGoalLifecycle>>;
}): Goal[] {
  return completableGoals.filter((goal) => {
    const lifecycle = lifecycleByGoalAtViewDate.get(goal.id);
    return (
      lifecycle !== "ended" &&
      lifecycle !== "archived" &&
      !isGoalManuallyArchived(goal)
    );
  });
}

export function selectTargetAchievedGoalIds({
  goals,
  progressByGoal,
  completionsByGoal,
  asOfDate,
}: {
  goals: Goal[];
  progressByGoal: ReadonlyMap<
    string,
    Pick<ProgressContextSummary, "outcome" | "achievementDate"> | undefined
  >;
  completionsByGoal: ReadonlyMap<
    string,
    Array<Pick<CompletionDateFact, "completed_on">>
  >;
  asOfDate: string;
}): Set<string> {
  const ids = new Set<string>();
  for (const goal of goals) {
    if (
      shouldHideTargetAchievedGoal({
        goal,
        progress: progressByGoal.get(goal.id),
        completions: completionsByGoal.get(goal.id) ?? [],
        asOfDate,
      })
    ) {
      ids.add(goal.id);
    }
  }
  return ids;
}

export function selectFilteredTodayGoals({
  activeGoals,
  todayDate,
  categoryFilters,
  recurrenceFilters,
  searchQuery,
  endMonths,
  targetAchievedGoalIds = new Set<string>(),
  showTargetAchievedGoals = true,
}: {
  activeGoals: Goal[];
  todayDate: string;
  categoryFilters: string[];
  recurrenceFilters: RecurrenceGroup[];
  searchQuery: string;
  endMonths: string[];
  targetAchievedGoalIds?: ReadonlySet<string>;
  showTargetAchievedGoals?: boolean;
}): Goal[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchingGoals = activeGoals
    .filter((goal) => goal.start_date <= todayDate)
    .filter((goal) => showTargetAchievedGoals || !targetAchievedGoalIds.has(goal.id))
    .filter((goal) =>
      matchesTodayFacetFilters({
        goal,
        categoryFilters,
        recurrenceFilters,
      })
    )
    .filter((goal) =>
      normalizedQuery.length === 0
        ? true
        : goal.title.toLowerCase().includes(normalizedQuery)
    );

  return filterGoalsByEndMonths(matchingGoals, endMonths);
}

export function groupGoalsByRecurrence(
  goals: Goal[],
  sort: GoalDateSort
): Array<{ key: RecurrenceGroup; label: string; goals: Goal[] }> {
  const grouped: Record<RecurrenceGroup, Goal[]> = {
    daily: [],
    weekly: [],
    monthly: [],
    fixed: [],
  };

  goals.forEach((goal) => {
    grouped[getRecurrenceGroup(goal)].push(goal);
  });

  return recurrenceGroupOrder
    .map((group) => ({
      key: group,
      label: recurrenceGroupLabel[group],
      goals: sortGoalsByDate(grouped[group], sort),
    }))
    .filter((group) => group.goals.length > 0);
}

export function selectEndedGoals({
  completableGoals,
  lifecycleByGoalAtViewDate,
}: {
  completableGoals: Goal[];
  lifecycleByGoalAtViewDate: Map<string, ReturnType<typeof getGoalLifecycle>>;
}): Goal[] {
  return completableGoals.filter((goal) => {
    if (isGoalManuallyArchived(goal)) {
      return false;
    }
    return lifecycleByGoalAtViewDate.get(goal.id) === "ended";
  });
}

export function selectArchivedGoals(completableGoals: Goal[]): Goal[] {
  return completableGoals.filter((goal) => isGoalManuallyArchived(goal));
}

export function selectUpcomingGoals(activeGoals: Goal[], todayDate: string): Goal[] {
  return activeGoals.filter((goal) => goal.start_date > todayDate);
}
