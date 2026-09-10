import { describe, expect, it } from "vitest";
import {
  clampPlanCalendarSplit,
  planCalendarSplitFromPointer,
  PLAN_CALENDAR_SPLIT_DEFAULT,
  PLAN_CALENDAR_SPLIT_MAX,
  PLAN_CALENDAR_SPLIT_MIN,
} from "@/features/planner/planner-calendar-split-model";

describe("plan calendar split", () => {
  it("clamps the calendar fraction", () => {
    expect(clampPlanCalendarSplit(0.72)).toBe(0.72);
    expect(clampPlanCalendarSplit(0)).toBe(PLAN_CALENDAR_SPLIT_MIN);
    expect(clampPlanCalendarSplit(1)).toBe(PLAN_CALENDAR_SPLIT_MAX);
    expect(clampPlanCalendarSplit(Number.NaN)).toBe(PLAN_CALENDAR_SPLIT_DEFAULT);
  });

  it("maps a drag to a new fraction", () => {
    expect(
      planCalendarSplitFromPointer({
        clientX: 600,
        startX: 500,
        startFraction: 0.72,
        totalWidth: 1000,
      })
    ).toBe(0.82);
    expect(
      planCalendarSplitFromPointer({
        clientX: 400,
        startX: 500,
        startFraction: 0.72,
        totalWidth: 1000,
      })
    ).toBeCloseTo(0.62);
  });
});
