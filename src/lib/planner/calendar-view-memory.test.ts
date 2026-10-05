import { describe, expect, it } from "vitest";
import { DEFAULT_CALENDAR_VIEW_MODE, isPlannerCalendarPathname } from "./calendar-view-memory";
describe("Agenda defaults", () => {
  it("always defaults to Today", () => { expect(DEFAULT_CALENDAR_VIEW_MODE).toBe("day"); });
  it("recognizes production and demo Agenda routes", () => {
    expect(isPlannerCalendarPathname("/calendar")).toBe(true);
    expect(isPlannerCalendarPathname("/demo/calendar")).toBe(true);
    expect(isPlannerCalendarPathname("/goals/new")).toBe(false);
  });
});
