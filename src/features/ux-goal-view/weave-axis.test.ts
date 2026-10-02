import { describe, expect, it } from "vitest";
import { AXIS_DAYS, AXIS_END, AXIS_OVERSCAN, AXIS_START, axisDate, axisIndex, resizedAxisOffset, visibleAxisWindow } from "./weave-axis";

describe("Time Weave date axis", () => {
  it("provides a continuous three-year axis with exact date round trips across leap day", () => {
    expect(AXIS_DAYS).toBeGreaterThan(1095);
    for (const date of [AXIS_START, "2026-10-02", "2027-01-31", "2028-02-29", AXIS_END]) {
      expect(axisDate(axisIndex(date))).toBe(date);
    }
    expect(axisDate(axisIndex("2028-02-28") + 1)).toBe("2028-02-29");
    expect(axisDate(axisIndex("2028-02-29") + 1)).toBe("2028-03-01");
  });

  it("keeps viewport work bounded by its visible days and overscan, even far from today", () => {
    for (const index of [0, 400, 900, AXIS_DAYS - 1]) {
      const window = visibleAxisWindow(index * 128, 1200, 128, 190);
      expect(window.first).toBeGreaterThanOrEqual(0);
      expect(window.last).toBeLessThan(AXIS_DAYS);
      expect(window.last - window.first + 1).toBeLessThanOrEqual(Math.ceil((1200 - 190) / 128) + AXIS_OVERSCAN * 2 + 1);
      expect(window.firstVisible).toBe(index);
    }
  });

  it("preserves the leading date and partial day when switching density", () => {
    const original = 364 * 128 + 52;
    const resized = resizedAxisOffset(original, 128, 80);
    expect(resized / 80).toBeCloseTo(original / 128);
    expect(visibleAxisWindow(resized, 430, 80, 116).firstVisible).toBe(364);
    expect(resizedAxisOffset(resized, 80, 128)).toBeCloseTo(original);
  });

  it("clamps date jumps and protects the leading edge from negative rubber-band offsets", () => {
    expect(axisIndex("2020-01-01")).toBe(0);
    expect(axisIndex("2030-01-01")).toBe(AXIS_DAYS - 1);
    expect(visibleAxisWindow(-100, 375, 104, 116)).toMatchObject({ first: 0, firstVisible: 0 });
  });
});
