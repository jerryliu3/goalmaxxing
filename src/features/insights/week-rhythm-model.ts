import {
  eachDayOfInterval,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import type { Goal } from "@/lib/goals/types";
import type { PlannerWorkUnit } from "@cadence/shared/planner/context";

export type WeekRhythmKnotState = "empty" | "planned" | "complete";

export interface WeekRhythmDay {
  date: string;
  weekdayLabel: string;
  state: WeekRhythmKnotState;
}

export interface WeekRhythmGoalRow {
  goalId: string;
  title: string;
  color: string | null;
  days: WeekRhythmDay[];
}

export function buildWeekRhythmRows({
  goals,
  workUnits,
  creditedGoalDates,
  asOfDate,
  weekStartsOn,
  visibleGoalIds,
}: {
  goals: Goal[];
  workUnits: PlannerWorkUnit[];
  creditedGoalDates: ReadonlySet<string>;
  asOfDate: string;
  weekStartsOn: number;
  visibleGoalIds: ReadonlySet<string> | null;
}): WeekRhythmGoalRow[] {
  const anchor = parseISO(`${asOfDate}T12:00:00`);
  const weekStart = startOfWeek(anchor, {
    weekStartsOn: weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6,
  });
  const weekEnd = endOfWeek(anchor, {
    weekStartsOn: weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6,
  });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const filteredGoals = goals.filter((goal) =>
    visibleGoalIds ? visibleGoalIds.has(goal.id) : true
  );

  return filteredGoals
    .map((goal) => {
      const goalUnits = workUnits.filter(
        (unit) => unit.originalGoalId === goal.id && unit.scheduledDate
      );
      const days = weekDays.map((day) => {
        const date = format(day, "yyyy-MM-dd");
        const sessions = goalUnits.filter((unit) => unit.scheduledDate === date);
        const credited =
          creditedGoalDates.has(`${goal.id}:${date}`) ||
          sessions.some((unit) => unit.creditState !== "uncredited");
        let state: WeekRhythmKnotState = "empty";
        if (credited) {
          state = "complete";
        } else if (sessions.length > 0) {
          state = "planned";
        }
        return {
          date,
          weekdayLabel: format(day, "EEE"),
          state,
        };
      });
      return {
        goalId: goal.id,
        title: goal.title,
        color: goal.color,
        days,
      };
    })
    .filter((row) => row.days.some((day) => day.state !== "empty"));
}

export function buildCreditedGoalDateKeys(
  completions: Array<{ goal_id: string; completed_on: string }>
): Set<string> {
  const keys = new Set<string>();
  for (const fact of completions) {
    keys.add(`${fact.goal_id}:${fact.completed_on}`);
  }
  return keys;
}
