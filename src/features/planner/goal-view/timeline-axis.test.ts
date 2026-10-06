import { describe, expect, it } from "vitest";
import { addDaysToDateString, differenceInDateStrings } from "@/lib/goals/periods";
import {
  extendTimelineSpan,
  initialTimelineSpan,
  isInsideTimelineSpan,
  TIMELINE_PAGE_DAYS,
} from "./timeline-axis";

describe("continuous scheduling axis", () => {
  it("starts a year either side of the date in view", () => {
    const span = initialTimelineSpan("2026-09-28");
    expect(differenceInDateStrings("2026-09-28", span.start)).toBe(TIMELINE_PAGE_DAYS);
    expect(span.days).toBe(TIMELINE_PAGE_DAYS * 2 + 1);
  });

  it("prepends a page near the start without moving any date's civil day", () => {
    const span = initialTimelineSpan("2026-09-28");
    const date = addDaysToDateString(span.start, 6);
    const next = extendTimelineSpan(span, 1, 10);
    expect(next.days).toBe(span.days + TIMELINE_PAGE_DAYS);
    expect(addDaysToDateString(next.start, 6 + TIMELINE_PAGE_DAYS)).toBe(date);
  });

  it("appends near the end and leaves the middle alone", () => {
    let span = initialTimelineSpan("2026-09-28");
    for (let page = 0; page < 20; page++) span = extendTimelineSpan(span, span.days - 20, span.days - 1);
    expect(span.days).toBeGreaterThan(7300);
    expect(extendTimelineSpan(span, 400, 410)).toBe(span);
    expect(isInsideTimelineSpan(span, 400)).toBe(true);
    expect(isInsideTimelineSpan(span, 3)).toBe(false);
  });
});
