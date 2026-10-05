import { describe, expect, it } from "vitest";
import { addDaysToDateString } from "@/lib/goals/periods";
import { extendTimelineSpan, initialTimelineSpan, timelineIndex, visibleTimelineRange } from "./timeline-axis";

describe("continuous scheduling axis", () => {
  it("starts the current week at the leading edge while retaining earlier dates", () => {
    const span = initialTimelineSpan("2026-09-28");
    const range = visibleTimelineRange(timelineIndex("2026-09-28", span.start) * 120, 480, 120, 116, span.days);
    expect(addDaysToDateString(span.start, range.firstVisible)).toBe("2026-09-28");
    expect(span.start < "2026-09-28").toBe(true);
    expect(range.last - range.first).toBeLessThan(20);
  });
  it("keeps the same civil date under the cursor when prepending earlier dates", () => {
    const span = initialTimelineSpan("2026-09-28");
    const date = addDaysToDateString(span.start, 6);
    const next = extendTimelineSpan(span, 1, 10);
    const restoredOffset = (6 + timelineIndex(span.start, next.start)) * 120;
    const visible = visibleTimelineRange(restoredOffset, 480, 120, 116, next.days);
    expect(addDaysToDateString(next.start, visible.firstVisible)).toBe(date);
  });
  it("continues beyond the original date span without increasing rendered columns", () => {
    let span = initialTimelineSpan("2026-09-28");
    for (let page = 0; page < 20; page++) span = extendTimelineSpan(span, span.days - 20, span.days - 1);
    expect(span.days).toBeGreaterThan(7300);
    const range = visibleTimelineRange((span.days - 40) * 120, 800, 120, 116, span.days);
    expect(range.last - range.first).toBeLessThan(20);
  });
});
