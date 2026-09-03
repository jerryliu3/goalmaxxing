import { describe, expect, it } from "vitest";
import {
  CALENDAR_SHOW_TASKS_STORAGE_KEY,
  readCalendarShowTasksPreference,
  writeCalendarShowTasksPreference,
} from "@/features/planner/calendar-task-visibility";

describe("calendar task visibility preference", () => {
  it("defaults off and persists an explicit opt-in", () => {
    window.localStorage.clear();
    expect(readCalendarShowTasksPreference()).toBe(false);

    writeCalendarShowTasksPreference(true);
    expect(window.localStorage.getItem(CALENDAR_SHOW_TASKS_STORAGE_KEY)).toBe(
      "true"
    );
    expect(readCalendarShowTasksPreference()).toBe(true);

    writeCalendarShowTasksPreference(false);
    expect(readCalendarShowTasksPreference()).toBe(false);
  });
});
