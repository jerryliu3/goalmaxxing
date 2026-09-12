import { describe, expect, it } from "vitest";
import { nextViewModeAfterPinch } from "@/features/planner/use-plan-pinch-view-change";

describe("nextViewModeAfterPinch", () => {
  it("steps inward from day to week to month", () => {
    expect(nextViewModeAfterPinch("day", "in")).toBe("week");
    expect(nextViewModeAfterPinch("week", "in")).toBe("month");
    expect(nextViewModeAfterPinch("month", "in")).toBeNull();
  });

  it("steps outward from month to week to day", () => {
    expect(nextViewModeAfterPinch("month", "out")).toBe("week");
    expect(nextViewModeAfterPinch("week", "out")).toBe("day");
    expect(nextViewModeAfterPinch("day", "out")).toBeNull();
  });
});
