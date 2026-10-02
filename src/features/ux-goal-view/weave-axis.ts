import { differenceInCalendarDays, parseISO } from "date-fns";
import { shiftDate } from "./model";

export const AXIS_START = "2025-09-29";
export const AXIS_END = "2028-10-01";
export const AXIS_DAYS = differenceInCalendarDays(parseISO(AXIS_END), parseISO(AXIS_START)) + 1;
export const AXIS_OVERSCAN = 8;
export const axisDate = (index: number) => shiftDate(AXIS_START, index);
export const axisIndex = (date: string) => Math.min(AXIS_DAYS - 1, Math.max(0, differenceInCalendarDays(parseISO(date), parseISO(AXIS_START))));

export function visibleAxisWindow(scrollLeft: number, width: number, dayWidth: number, labelWidth: number) {
  const firstVisible = Math.min(AXIS_DAYS - 1, Math.max(0, Math.floor(scrollLeft / dayWidth)));
  const visibleDays = Math.max(1, Math.ceil(Math.max(0, width - labelWidth) / dayWidth));
  const first = Math.max(0, firstVisible - AXIS_OVERSCAN);
  const last = Math.min(AXIS_DAYS - 1, firstVisible + visibleDays + AXIS_OVERSCAN);
  return { first, last, firstVisible };
}

/** Keeps the day at the viewport's leading edge when density changes. */
export function resizedAxisOffset(scrollLeft: number, oldDayWidth: number, nextDayWidth: number) {
  return scrollLeft / oldDayWidth * nextDayWidth;
}
