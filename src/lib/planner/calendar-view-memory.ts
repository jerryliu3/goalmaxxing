import {
  isValidCalendarViewMode,
  type PlannerCalendarViewMode,
} from "@cadence/shared/planner/calendar-state";

export const DEFAULT_CALENDAR_VIEW_MODE: PlannerCalendarViewMode = "week";
const STORAGE_KEY = "planner-calendar-view-mode";

export function isPlannerCalendarPathname(pathname: string) {
  return pathname === "/calendar" || pathname.endsWith("/calendar");
}

export function readRememberedCalendarViewMode(): PlannerCalendarViewMode | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!isValidCalendarViewMode(raw) || raw === "three_day") {
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

export function rememberCalendarViewMode(viewMode: PlannerCalendarViewMode) {
  if (typeof window === "undefined") {
    return;
  }
  const stored = viewMode === "three_day" ? "week" : viewMode;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, stored);
  } catch {
    // Ignore quota/private-mode failures; the current visit still keeps the view.
  }
}

export function resetRememberedCalendarViewModeForTests() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures in tests.
  }
}
