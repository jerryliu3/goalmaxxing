import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_CALENDAR_VIEW_MODE,
  isPlannerCalendarPathname,
  readRememberedCalendarViewMode,
  rememberCalendarViewMode,
  resetRememberedCalendarViewModeForTests,
} from "@/lib/planner/calendar-view-memory";

describe("calendar view memory", () => {
  afterEach(() => {
    resetRememberedCalendarViewModeForTests();
  });

  it("treats calendar and demo calendar paths as the planner calendar", () => {
    expect(isPlannerCalendarPathname("/calendar")).toBe(true);
    expect(isPlannerCalendarPathname("/demo/calendar")).toBe(true);
    expect(isPlannerCalendarPathname("/goals/new")).toBe(false);
  });

  it("defaults missing views to week", () => {
    expect(DEFAULT_CALENDAR_VIEW_MODE).toBe("week");
    expect(readRememberedCalendarViewMode()).toBeNull();
  });

  it("remembers the last explicit calendar view", () => {
    rememberCalendarViewMode("month");
    expect(readRememberedCalendarViewMode()).toBe("month");
    rememberCalendarViewMode("three_day");
    expect(readRememberedCalendarViewMode()).toBe("week");
  });
});
