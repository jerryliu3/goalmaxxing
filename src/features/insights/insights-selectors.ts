import {
  eachDayOfInterval,
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
} from "date-fns";
import {
  filterGoalsByEndMonths,
  sortGoalsByDate,
  type GoalDateSort,
} from "@/lib/goals/list-view";
import type { Goal } from "@/lib/goals/types";

export function unionGoalsById(groups: readonly Goal[][]): Goal[] {
  const seen = new Set<string>();
  const result: Goal[] = [];
  for (const group of groups) {
    for (const goal of group) {
      if (seen.has(goal.id)) {
        continue;
      }
      seen.add(goal.id);
      result.push(goal);
    }
  }
  return result;
}

export function selectSearchedGoals(goals: Goal[], query: string): Goal[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length === 0) {
    return goals;
  }
  return goals.filter((goal) =>
    goal.title.toLowerCase().includes(normalizedQuery)
  );
}

export function selectProgressPeriodWindow(
  monthCursor: Date,
  viewMode: "month" | "year"
): { start: string; end: string } {
  return {
    start: format(
      viewMode === "month" ? startOfMonth(monthCursor) : startOfYear(monthCursor),
      "yyyy-MM-dd"
    ),
    end: format(
      viewMode === "month" ? endOfMonth(monthCursor) : endOfYear(monthCursor),
      "yyyy-MM-dd"
    ),
  };
}

export function selectVisiblePerGoalHeatmaps({
  goals,
  visiblePeriodStart,
  visiblePeriodEnd,
  endMonths,
  sort,
}: {
  goals: Goal[];
  visiblePeriodStart: string;
  visiblePeriodEnd: string;
  endMonths: string[];
  sort: GoalDateSort;
}): Goal[] {
  const overlappingGoals = goals.filter(
    (goal) =>
      goal.start_date <= visiblePeriodEnd &&
      (goal.end_date === null || goal.end_date >= visiblePeriodStart)
  );
  return sortGoalsByDate(filterGoalsByEndMonths(overlappingGoals, endMonths), sort);
}

export function selectOverallCompletionPercent(
  goals: Array<{ id: string }>,
  progressByGoal: Map<string, { percent?: number } | undefined>
): number {
  if (goals.length === 0) {
    return 0;
  }
  return (
    goals.reduce(
      (total, goal) => total + (progressByGoal.get(goal.id)?.percent ?? 0),
      0
    ) / goals.length
  );
}

export function selectYearHeatmapValues(
  monthCursor: Date,
  countsByDate: Record<string, number>
): Array<{ date: string; count: number }> {
  return eachDayOfInterval({
    start: startOfYear(monthCursor),
    end: endOfYear(monthCursor),
  }).map((date) => {
    const key = format(date, "yyyy-MM-dd");
    return {
      date: key,
      count: countsByDate[key] ?? 0,
    };
  });
}
