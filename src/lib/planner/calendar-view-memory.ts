import type { PlannerCalendarViewMode } from "@cadence/shared/planner/calendar-state";
export const DEFAULT_CALENDAR_VIEW_MODE: PlannerCalendarViewMode = "day";
export function isPlannerCalendarPathname(pathname: string) {
  return pathname === "/calendar" || pathname.endsWith("/calendar");
}
