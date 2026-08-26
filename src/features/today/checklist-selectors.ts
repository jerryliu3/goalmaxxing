import { resolveCategoryKey } from "@/lib/goals/category";
import { getGoalLifecycle } from "@/lib/goals/lifecycle";
import {
  filterGoalsByEndMonths,
  sortGoalsByDate,
  type GoalDateSort,
} from "@/lib/goals/list-view";
import { isGoalManuallyArchived } from "@/lib/goals/schedule";
import { cadencePeriodTarget, isPeriodCadenceGoal } from "@/lib/goals/target-basis";
import type { Goal } from "@/lib/goals/types";

export type RecurrenceFilter = "all" | "daily" | "weekly" | "monthly" | "fixed";
export type RecurrenceGroup = "daily" | "weekly" | "monthly" | "fixed";

export const VISIBLE_GOALS_PER_GROUP = 4;
export const INITIAL_GROUP_EXPANDED: Record<RecurrenceGroup, boolean> = {
  daily: false,
  weekly: false,
  monthly: false,
  fixed: false,
};

export const recurrenceGroupOrder: RecurrenceGroup[] = [
  "daily",
  "weekly",
  "monthly",
  "fixed",
];

export const recurrenceGroupLabel: Record<RecurrenceGroup, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  fixed: "Milestones",
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

export function getRecurrenceGroup(goal: Goal): RecurrenceGroup {
  if (goal.frequency_type === "fixed_milestones") {
    return "fixed";
  }
  if (goal.recurrence_interval === "weekly") {
    return "weekly";
  }
  if (goal.recurrence_interval === "monthly") {
    return "monthly";
  }
  return "daily";
}

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

export function selectCompletedTargetGoalIds({
  goals,
  progressByGoal,
  completionsByGoal,
  asOfDate,
}: {
  goals: Goal[];
  progressByGoal: ReadonlyMap<
    string,
    { outcome: string; achievementDate?: string | null } | undefined
  >;
  completionsByGoal: ReadonlyMap<string, Array<{ completed_on: string }>>;
  asOfDate: string;
}): Set<string> {
  const ids = new Set<string>();
  const getDistinctSortedCompletionDates = (goalId: string) =>
    Array.from(
      new Set((completionsByGoal.get(goalId) ?? []).map((completion) => completion.completed_on))
    ).sort((left, right) => left.localeCompare(right));

  for (const goal of goals) {
    if (isPeriodCadenceGoal(goal)) {
      const distinctSortedDates = getDistinctSortedCompletionDates(goal.id);
      const target = cadencePeriodTarget(goal);
      if (distinctSortedDates.length < target) {
        if (progressByGoal.get(goal.id)?.outcome === "achieved") {
          ids.add(goal.id);
        }
        continue;
      }
      const achievedOn = distinctSortedDates[target - 1] ?? null;
      if (achievedOn !== null && achievedOn < asOfDate) {
        ids.add(goal.id);
      }
      continue;
    }

    const progress = progressByGoal.get(goal.id);
    if (progress?.outcome !== "achieved") {
      continue;
    }
    if (progress.achievementDate !== undefined) {
      if (
        progress.achievementDate !== null &&
        progress.achievementDate < asOfDate
      ) {
        ids.add(goal.id);
      }
      continue;
    }
    const lastCompletedOn = getDistinctSortedCompletionDates(goal.id).at(-1);
    // Checklist facts are usually just the viewed day. An achieved goal with
    // no fact on that day was therefore hit on an earlier date.
    if (lastCompletedOn == null || lastCompletedOn < asOfDate) {
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
  completedTargetGoalIds = new Set<string>(),
  showCompletedGoals = true,
}: {
  activeGoals: Goal[];
  todayDate: string;
  categoryFilters: string[];
  recurrenceFilters: RecurrenceGroup[];
  searchQuery: string;
  endMonths: string[];
  completedTargetGoalIds?: ReadonlySet<string>;
  showCompletedGoals?: boolean;
}): Goal[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchingGoals = activeGoals
    .filter((goal) => goal.start_date <= todayDate)
    .filter((goal) => showCompletedGoals || !completedTargetGoalIds.has(goal.id))
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
