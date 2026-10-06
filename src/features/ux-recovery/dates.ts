/** Calendar-day helpers for the recovery study. Dates are ISO `YYYY-MM-DD` strings in UTC. */

export type IsoDate = string;
/** 0 = Sunday … 6 = Saturday (matches `Date#getUTCDay`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DAY_MS = 86_400_000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function toUtc(date: IsoDate): number {
  return Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10))
  );
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return new Date(toUtc(date) + days * DAY_MS).toISOString().slice(0, 10);
}

export function diffDays(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

export function weekdayOf(date: IsoDate): Weekday {
  return new Date(toUtc(date)).getUTCDay() as Weekday;
}

/** Weeks start on Monday, matching the planner's default credit week. */
export function startOfWeek(date: IsoDate): IsoDate {
  return addDays(date, -((weekdayOf(date) + 6) % 7));
}

/** Inclusive range; empty when `end < start`. */
export function dateRange(start: IsoDate, end: IsoDate): IsoDate[] {
  const days: IsoDate[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) days.push(day);
  return days;
}

export function earliest(dates: readonly IsoDate[]): IsoDate {
  return dates.reduce((min, date) => (date < min ? date : min));
}

export function weekdayShort(date: IsoDate): string {
  return WEEKDAYS[weekdayOf(date)];
}

export function dayOfMonth(date: IsoDate): number {
  return Number(date.slice(8, 10));
}

export function monthShort(date: IsoDate): string {
  return MONTHS[Number(date.slice(5, 7)) - 1] ?? "";
}

/** "Thu Oct 8" */
export function formatDay(date: IsoDate): string {
  return `${weekdayShort(date)} ${monthShort(date)} ${dayOfMonth(date)}`;
}

/** "Oct 8" */
export function formatShort(date: IsoDate): string {
  return `${monthShort(date)} ${dayOfMonth(date)}`;
}

/** "Oct 13 → Oct 21": full dates on both sides, never a relative name. */
export function dateMove(from: IsoDate, to: IsoDate): string {
  return `${formatShort(from)} → ${formatShort(to)}`;
}

/** Lower-case name for running copy: "today", "tomorrow", "Fri", or "Oct 13". */
export function dayName(date: IsoDate, today: IsoDate): string {
  const diff = diffDays(today, date);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff > 1 && diff < 7) return weekdayShort(date);
  return formatShort(date);
}

/** Title-case label for pills: "Today", "Tomorrow", "Fri", "Oct 13". */
export function dayLabel(date: IsoDate, today: IsoDate): string {
  const name = dayName(date, today);
  return name.charAt(0).toUpperCase() + name.slice(1);
}
