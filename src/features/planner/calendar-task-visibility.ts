export const CALENDAR_SHOW_TASKS_STORAGE_KEY = "planner.calendar.showTasks";

export function readCalendarShowTasksPreference() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(CALENDAR_SHOW_TASKS_STORAGE_KEY) === "true";
}

export function writeCalendarShowTasksPreference(enabled: boolean) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    CALENDAR_SHOW_TASKS_STORAGE_KEY,
    enabled ? "true" : "false"
  );
}
