import { GAZETTEER } from "@cadence/shared/brand/gazetteer";
import { dateRange, weekdayOf, type IsoDate, type Weekday } from "@/features/ux-recovery/dates";
import type { RecoveryGoal, RecoverySeed, RecoverySession } from "@/features/ux-recovery/model";

/** Wednesday. The credit week runs Mon Oct 5 – Sun Oct 11. */
export const TODAY: IsoDate = "2026-10-07";

const SUNDAY: Weekday = 0;

const GOALS: readonly RecoveryGoal[] = [
  {
    id: "run",
    title: "Run 3× a week",
    short: "Run",
    noun: "a run",
    color: GAZETTEER.gain,
    target: "3× a week",
    kind: "cadence",
    interval: "week",
    window: { start: "2026-09-01", end: "2026-12-31" },
    restDays: [SUNDAY],
  },
  {
    id: "reading",
    title: "Read 20 minutes a day",
    short: "Read",
    noun: "reading",
    color: GAZETTEER.mutedDeep,
    target: "Every day",
    kind: "cadence",
    interval: "day",
    window: { start: "2026-09-01", end: null },
    restDays: [],
  },
  {
    id: "guitar",
    title: "Guitar sprint",
    short: "Guitar",
    noun: "guitar",
    color: GAZETTEER.colRust,
    target: "5× a week until Sun",
    kind: "cadence",
    interval: "week",
    window: { start: "2026-09-28", end: "2026-10-11" },
    restDays: [],
  },
  {
    id: "french",
    title: "French lesson 2× a week",
    short: "French",
    noun: "French",
    color: GAZETTEER.sage,
    target: "2× a week",
    kind: "cadence",
    interval: "week",
    window: { start: "2026-09-01", end: null },
    restDays: [SUNDAY],
  },
  {
    id: "portfolio",
    title: "Ship portfolio site",
    short: "Portfolio",
    noun: "portfolio work",
    color: GAZETTEER.stamp,
    target: "8 sessions by Oct 28",
    kind: "lifetime",
    shape: "milestone",
    window: { start: "2026-09-21", end: "2026-10-28" },
    restDays: [SUNDAY],
  },
  {
    id: "books",
    title: "Read 12 books by Dec 31",
    short: "Books",
    noun: "a book session",
    color: "#8a6a3a",
    target: "12 books by Dec 31",
    kind: "lifetime",
    shape: "deadline_total",
    window: { start: "2026-01-01", end: "2026-12-31" },
    restDays: [],
  },
];

function onWeekdays(from: IsoDate, to: IsoDate, weekdays: readonly Weekday[]) {
  return dateRange(from, to).filter((date) => weekdays.includes(weekdayOf(date)));
}

/** Past days default to done, the rest to scheduled; `overrides` flips individual days. */
function series(
  goalId: string,
  dates: IsoDate[],
  label: (index: number) => string,
  overrides: Record<IsoDate, Partial<RecoverySession>> = {}
): RecoverySession[] {
  return dates.map((date, index): RecoverySession => ({
    id: `${goalId}-${date}`,
    goalId,
    date,
    status: date < TODAY ? "done" : "scheduled",
    label: label(index),
    ...overrides[date],
  }));
}

const missed = { status: "missed" } as const;

const PORTFOLIO_DATES = [
  "2026-09-22",
  "2026-09-25",
  "2026-09-29",
  "2026-10-01",
  "2026-10-05",
  "2026-10-13",
  "2026-10-20",
  "2026-10-27",
];

const SESSIONS: readonly RecoverySession[] = [
  // Bug case: missed Mon, Wed (today) and Fri already planned.
  ...series("run", onWeekdays("2026-09-28", "2026-10-30", [1, 3, 5]), () => "Run", {
    "2026-10-05": missed,
  }),
  // Daily cadence: yesterday's miss is a past period — silently excluded.
  ...series("reading", dateRange("2026-09-28", "2026-10-31"), () => "Read 20 min", {
    "2026-10-06": missed,
  }),
  // No room: every day left this week is full or already has guitar.
  ...series(
    "guitar",
    ["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03"],
    () => "Practice"
  ),
  ...series(
    "guitar",
    ["2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-11"],
    () => "Practice",
    { "2026-10-06": missed }
  ),
  // Missed last week's Saturday lesson — past period, excluded.
  ...series("french", onWeekdays("2026-09-29", "2026-10-31", [2, 6]), () => "Lesson", {
    "2026-10-03": missed,
  }),
  // Lifetime milestone: two stranded work sessions, launch day locked.
  ...series(
    "portfolio",
    PORTFOLIO_DATES,
    (index) => (index === PORTFOLIO_DATES.length - 1 ? "Launch" : `Session ${index + 1} of 8`),
    {
      "2026-10-01": missed,
      "2026-10-05": missed,
      "2026-10-27": { locked: true },
    }
  ),
  // Lifetime total by deadline: one stranded Saturday session.
  ...series("books", onWeekdays("2026-09-26", "2026-10-31", [6]), () => "Book session", {
    "2026-10-03": missed,
  }),
];

/** Saturdays and today already hold 3 sessions — the daily cap. */
export const RECOVERY_SEED: RecoverySeed = {
  goals: GOALS,
  sessions: SESSIONS,
  dailyCap: 3,
  horizonEnd: "2026-10-31",
};

export function goalById(seed: RecoverySeed, goalId: string): RecoveryGoal | undefined {
  return seed.goals.find((goal) => goal.id === goalId);
}
