import { gazetteerFillForGoal } from "@cadence/shared/brand/gazetteer";
import type {
  ProgressContextFact,
  ProgressContextSummary,
} from "@cadence/shared/goals/progress-context";
import { countInsightsFactsByDay } from "./insights-lane-data";
import type { MobileGoal } from "../checklist/checklist-lane-data";

export interface InsightsLedgerGoal {
  id: string;
  title: string;
  color: string;
  rateLabel: string;
}

export function filterInsightsFactsByGoalIds(
  facts: ProgressContextFact[],
  goalIds: readonly string[]
) {
  if (goalIds.length === 0) {
    return [];
  }
  const allowed = new Set(goalIds);
  return facts.filter((fact) => allowed.has(fact.goal_id));
}

export function countFilteredInsightsFactsByDay(
  facts: ProgressContextFact[],
  goalIds: readonly string[]
) {
  return countInsightsFactsByDay(filterInsightsFactsByGoalIds(facts, goalIds));
}

export function insightsLedgerDayLabel(date: string, count: number) {
  return `${date}: ${count} completion${count === 1 ? "" : "s"}`;
}

export function insightsLedgerRateLabel({
  completionCount,
  summary,
}: {
  completionCount: number;
  summary: ProgressContextSummary | undefined;
}) {
  if (summary?.currentPeriodTarget && summary.currentPeriodTarget > 1) {
    return `${summary.currentPeriodCompletionCount}/${summary.currentPeriodTarget} this period · ${completionCount} total`;
  }
  return `${completionCount} completion${completionCount === 1 ? "" : "s"}`;
}

export function buildInsightsLedgerGoals({
  goals,
  facts,
  summaries,
}: {
  goals: MobileGoal[];
  facts: ProgressContextFact[];
  summaries: ProgressContextSummary[];
}): InsightsLedgerGoal[] {
  const summaryByGoal = new Map(summaries.map((row) => [row.goalId, row]));
  const counts = new Map<string, number>();
  for (const fact of facts) {
    counts.set(fact.goal_id, (counts.get(fact.goal_id) ?? 0) + 1);
  }

  return goals
    .filter((goal) => !goal.is_deleted)
    .map((goal) => {
      const completionCount = counts.get(goal.id) ?? 0;
      return {
        id: goal.id,
        title: goal.title,
        color: gazetteerFillForGoal(goal.color ?? null, goal.category),
        rateLabel: insightsLedgerRateLabel({
          completionCount,
          summary: summaryByGoal.get(goal.id),
        }),
      };
    });
}
