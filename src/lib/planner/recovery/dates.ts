import { addDaysToDateString, differenceInDateStrings } from "@/lib/goals/periods";
import { getUtcWeekday } from "@/lib/planner/dates";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export function weekdayShort(date: string): string {
  return WEEKDAYS[getUtcWeekday(date)] ?? "";
}

/** "Oct 8" */
export function formatShort(date: string): string {
  return `${MONTHS[Number(date.slice(5, 7)) - 1] ?? ""} ${Number(date.slice(8, 10))}`;
}

/** "Thu Oct 8" */
export function formatDay(date: string): string {
  return `${weekdayShort(date)} ${formatShort(date)}`;
}

/** "Oct 13 → Oct 21": full dates on both sides, never a relative name. */
export function dateMove(from: string, to: string): string {
  return `${formatShort(from)} → ${formatShort(to)}`;
}

/** Lower-case name for running copy: "today", "tomorrow", "Fri", or "Oct 13". */
export function dayName(date: string, today: string): string {
  const diff = differenceInDateStrings(date, today);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff > 1 && diff < 7) return weekdayShort(date);
  return formatShort(date);
}

/** Title-case label for pills: "Today", "Tomorrow", "Fri", "Oct 13". */
export function dayLabel(date: string, today: string): string {
  const name = dayName(date, today);
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Inclusive range; empty when `end < start`. */
export function dateRange(start: string, end: string): string[] {
  const days: string[] = [];
  for (let day = start; day <= end; day = addDaysToDateString(day, 1)) days.push(day);
  return days;
}
