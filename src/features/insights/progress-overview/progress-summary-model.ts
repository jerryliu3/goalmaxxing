import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type {
  WeekRhythmGoalRow,
  WeekRhythmKnotState,
} from "@/features/insights/week-rhythm-model";
import type { GrowScorePoint } from "@/lib/grow-score";

export interface ProgressScoreSummary {
  score: number;
  /** Change across the trailing week of the series. */
  weekDelta: number;
  /** Score per day, oldest first, for the sparkline. */
  points: number[];
}

export interface ProgressWeekStripDay {
  date: string;
  weekdayLabel: string;
  state: WeekRhythmKnotState;
  isToday: boolean;
}

export interface ProgressWeekStrip {
  days: ProgressWeekStripDay[];
  rangeLabel: string;
}

export interface ProgressHistoryDay {
  date: string;
  dayNumber: number;
  count: number;
  isFuture: boolean;
}

export interface ProgressHistorySummary {
  monthLabel: string;
  days: ProgressHistoryDay[];
  completions: number;
  goalCount: number;
}

export function growScoreSummary(
  series: readonly GrowScorePoint[]
): ProgressScoreSummary | null {
  const latest = series.at(-1);
  if (!latest) {
    return null;
  }
  const weekAgo = series.at(-8) ?? series[0];
  return {
    score: latest.score,
    weekDelta: latest.score - weekAgo.score,
    points: series.map((point) => point.score),
  };
}

function weekdayInitial(date: Date): string {
  return format(date, "EEEEE");
}

function mergeKnotState(
  current: WeekRhythmKnotState,
  next: WeekRhythmKnotState
): WeekRhythmKnotState {
  if (current === "complete" || next === "complete") {
    return "complete";
  }
  if (current === "planned" || next === "planned") {
    return "planned";
  }
  return "empty";
}

/**
 * Collapse the per-goal week rhythm into a single week-at-a-glance strip: a day
 * is complete when any goal was credited, planned when work remains.
 */
export function buildProgressWeekStrip({
  rows,
  asOfDate,
  weekStartsOn,
}: {
  rows: readonly WeekRhythmGoalRow[];
  asOfDate: string;
  weekStartsOn: number;
}): ProgressWeekStrip {
  const anchor = parseISO(`${asOfDate}T12:00:00`);
  const start = startOfWeek(anchor, {
    weekStartsOn: weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6,
  });
  const end = endOfWeek(anchor, {
    weekStartsOn: weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6,
  });
  const states = new Map<string, WeekRhythmKnotState>();
  for (const row of rows) {
    for (const day of row.days) {
      states.set(
        day.date,
        mergeKnotState(states.get(day.date) ?? "empty", day.state)
      );
    }
  }

  const days = eachDayOfInterval({ start, end }).map((day) => {
    const date = format(day, "yyyy-MM-dd");
    return {
      date,
      weekdayLabel: weekdayInitial(day),
      state: states.get(date) ?? "empty",
      isToday: date === asOfDate,
    };
  });

  const rangeLabel = isSameMonth(start, end)
    ? `${format(start, "MMMM d")}–${format(end, "d")}`
    : `${format(start, "MMMM d")} – ${format(end, "MMMM d")}`;

  return { days, rangeLabel };
}

export function historyMonthSummary({
  month,
  completions,
  asOfDate,
}: {
  month: Date;
  completions: ReadonlyArray<{ goal_id: string; completed_on: string }>;
  asOfDate: string;
}): ProgressHistorySummary {
  const monthPrefix = format(month, "yyyy-MM");
  const monthCompletions = completions.filter((fact) =>
    fact.completed_on.startsWith(monthPrefix)
  );
  const counts = new Map<string, number>();
  for (const fact of monthCompletions) {
    counts.set(fact.completed_on, (counts.get(fact.completed_on) ?? 0) + 1);
  }

  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  }).map((day) => {
    const date = format(day, "yyyy-MM-dd");
    return {
      date,
      dayNumber: Number(format(day, "d")),
      count: counts.get(date) ?? 0,
      isFuture: date > asOfDate,
    };
  });

  return {
    monthLabel: format(month, "MMMM yyyy"),
    days,
    completions: monthCompletions.length,
    goalCount: new Set(monthCompletions.map((fact) => fact.goal_id)).size,
  };
}
