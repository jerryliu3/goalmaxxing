import { addDaysToDateString } from "@/lib/goals/periods";

/**
 * The calendar's civil-date axis. It starts a year either side of the date in
 * view and grows by a year whenever scrolling comes within four weeks of an
 * end, so it reads as continuous while only nearby columns render.
 */
export const TIMELINE_PAGE_DAYS = 365;
const TIMELINE_EDGE_DAYS = 28;

export type TimelineSpan = { start: string; days: number };

export function initialTimelineSpan(date: string): TimelineSpan {
  return { start: addDaysToDateString(date, -TIMELINE_PAGE_DAYS), days: TIMELINE_PAGE_DAYS * 2 + 1 };
}

/** The same span, or one extended by a page at whichever end `first`/`last` approach. */
export function extendTimelineSpan(span: TimelineSpan, first: number, last: number) {
  if (first < TIMELINE_EDGE_DAYS) {
    return { start: addDaysToDateString(span.start, -TIMELINE_PAGE_DAYS), days: span.days + TIMELINE_PAGE_DAYS };
  }
  if (last > span.days - TIMELINE_EDGE_DAYS) return { ...span, days: span.days + TIMELINE_PAGE_DAYS };
  return span;
}

/** Whether `index` is far enough from both ends to scroll to without growing the span. */
export function isInsideTimelineSpan(span: TimelineSpan, index: number) {
  return index >= TIMELINE_EDGE_DAYS && index < span.days - TIMELINE_EDGE_DAYS;
}
