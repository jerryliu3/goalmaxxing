import { differenceInCalendarDays, parseISO } from "date-fns";
import { addDaysToDateString } from "@/lib/goals/periods";

export const TIMELINE_PAGE_DAYS = 365;
export const TIMELINE_OVERSCAN_DAYS = 5;
export type TimelineSpan = { start: string; days: number };
export function timelineIndex(date: string, start: string) {
  return differenceInCalendarDays(parseISO(date), parseISO(start));
}
export function initialTimelineSpan(date: string): TimelineSpan {
  return { start: addDaysToDateString(date, -TIMELINE_PAGE_DAYS), days: TIMELINE_PAGE_DAYS * 2 + 1 };
}
export function visibleTimelineRange(offset: number, width: number, dayWidth: number, labelWidth: number, days: number) {
  const firstVisible = Math.max(0, Math.min(days - 1, Math.floor(offset / dayWidth)));
  const count = Math.max(1, Math.ceil(Math.max(0, width - labelWidth) / dayWidth));
  return {
    firstVisible,
    first: Math.max(0, firstVisible - TIMELINE_OVERSCAN_DAYS),
    last: Math.min(days - 1, firstVisible + count + TIMELINE_OVERSCAN_DAYS),
  };
}
export function extendTimelineSpan(span: TimelineSpan, first: number, last: number) {
  if (first < 28) return { start: addDaysToDateString(span.start, -TIMELINE_PAGE_DAYS), days: span.days + TIMELINE_PAGE_DAYS };
  if (last > span.days - 28) return { ...span, days: span.days + TIMELINE_PAGE_DAYS };
  return span;
}
