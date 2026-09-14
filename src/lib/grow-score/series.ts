import { addDays, format, parseISO } from "date-fns";
import {
  GROW_CAPS,
  emptyGrowCapState,
  growDifficultyWeight,
  growPaceAlpha,
  nextGrowLaggedSlope,
  rollGrowCalendarDay,
  type GrowCapWindow,
} from "./formula";

export type GrowCompletionFact = {
  goal_id: string;
  completed_on: string;
  source?: string;
};

export type GrowGoalDifficultyRef = {
  id: string;
  difficulty?: string | null;
};

export type GrowScorePoint = {
  date: string;
  score: number;
  pace: number;
  earned: number;
  rawCredits: number;
  mode: "earn" | "hold" | "decay";
};

function localDateFromParts(year: number, monthIndex: number, day: number) {
  return new Date(year, monthIndex, day);
}

function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return localDateFromParts(year, month - 1, day);
}

function formatLocalDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function addLocalDays(dateStr: string, amount: number) {
  return formatLocalDate(addDays(parseLocalDate(dateStr), amount));
}

function dayOfWeek(dateStr: string) {
  return parseLocalDate(dateStr).getDay();
}

function enumerateDates(from: string, to: string): string[] {
  if (from > to) return [];
  const dates: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    dates.push(cursor);
    cursor = addLocalDays(cursor, 1);
  }
  return dates;
}

/**
 * Sum difficulty-weighted credits per calendar day.
 * Cascade completions count at full weight (same as the Grow study).
 */
export function buildDailyGrowCredits({
  completions,
  goals,
  from,
  to,
}: {
  completions: readonly GrowCompletionFact[];
  goals: readonly GrowGoalDifficultyRef[];
  from: string;
  to: string;
}): Map<string, number> {
  const weights = new Map(
    goals.map((goal) => [goal.id, growDifficultyWeight(goal.difficulty)]),
  );
  const daily = new Map<string, number>();
  for (const date of enumerateDates(from, to)) {
    daily.set(date, 0);
  }
  for (const fact of completions) {
    if (fact.completed_on < from || fact.completed_on > to) continue;
    const weight = weights.get(fact.goal_id) ?? growDifficultyWeight("medium");
    daily.set(fact.completed_on, (daily.get(fact.completed_on) ?? 0) + weight);
  }
  return daily;
}

export type BuildGrowScoreSeriesOptions = {
  completions: readonly GrowCompletionFact[];
  goals: readonly GrowGoalDifficultyRef[];
  /** Inclusive end date (usually today in the user timezone). */
  asOfDate: string;
  /** How many trailing days to return for the chart. */
  displayDays?: number;
  /**
   * Extra warm-up days before the display window so EMA/rate are not cold-start.
   * Defaults to 56 (two half-lives of activity memory).
   */
  warmupDays?: number;
  /** Week starts on this JS weekday (0=Sun … 6=Sat). Default Monday. */
  weekStartsOn?: number;
  caps?: GrowCapWindow;
};

/**
 * Simulate Lagged Slope day-by-day and return the trailing display window.
 * Simulation starts `warmupDays` before the display window (clamped by data).
 */
export function buildGrowScoreSeries(
  options: BuildGrowScoreSeriesOptions,
): GrowScorePoint[] {
  const displayDays = options.displayDays ?? 28;
  const warmupDays = options.warmupDays ?? 56;
  const weekStartsOn = options.weekStartsOn ?? 1;
  const caps = options.caps ?? GROW_CAPS;

  const displayEnd = options.asOfDate;
  const displayStart = addLocalDays(displayEnd, -(displayDays - 1));
  const simStart = addLocalDays(displayStart, -warmupDays);

  const dailyCredits = buildDailyGrowCredits({
    completions: options.completions,
    goals: options.goals,
    from: simStart,
    to: displayEnd,
  });

  const paceAlpha = growPaceAlpha();
  let score = 0;
  let pace = 0;
  let ema = 0;
  let capState = emptyGrowCapState();
  const points: GrowScorePoint[] = [];

  for (const date of enumerateDates(simStart, displayEnd)) {
    const resetWeek = dayOfWeek(date) === weekStartsOn;
    capState = rollGrowCalendarDay(capState, resetWeek);
    const rawCredits = dailyCredits.get(date) ?? 0;
    const step = nextGrowLaggedSlope({
      previous: score,
      rawCredits,
      caps,
      capState,
      pace,
      ema,
      paceAlpha,
    });
    score = step.score;
    pace = step.pace;
    ema = step.ema;
    capState = step.capState;
    if (date >= displayStart) {
      points.push({
        date,
        score,
        pace,
        earned: step.earned,
        rawCredits,
        mode: step.mode,
      });
    }
  }

  return points;
}

/** Axis label like the insights charts (`MM-dd`). */
export function growScoreChartLabel(date: string) {
  return date.slice(5);
}

/** Guard for invalid asOf strings in UI. */
export function isIsoDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = parseISO(value);
  return !Number.isNaN(parsed.getTime());
}
