import { describe, expect, it } from "vitest";
import { GAZETTEER, gazetteerLightTheme } from "@cadence/shared/brand/gazetteer";
import {
  buildGazetteerMonthDayChromePalette,
  resolveGazetteerMonthDayChromeStyle,
} from "@cadence/shared/planner/calendar-day-chrome";

describe("mobile calendar day chrome wiring", () => {
  const palette = buildGazetteerMonthDayChromePalette(gazetteerLightTheme, "light");

  it("uses adjacent zinc for out-of-month cells instead of opacity fade", () => {
    const style = resolveGazetteerMonthDayChromeStyle(
      {
        inMonth: false,
        isToday: false,
        isSelected: false,
        isPastInMonth: false,
      },
      palette
    );
    expect(style.backgroundColor).toBe("#d4d4d8");
    expect(style.numberColor).toBe(GAZETTEER.mutedDeep);
  });

  it("rings selected days with primary and fills today with rust level 1", () => {
    const selected = resolveGazetteerMonthDayChromeStyle(
      {
        inMonth: true,
        isToday: false,
        isSelected: true,
        isPastInMonth: false,
      },
      palette
    );
    const today = resolveGazetteerMonthDayChromeStyle(
      {
        inMonth: true,
        isToday: true,
        isSelected: false,
        isPastInMonth: false,
      },
      palette
    );
    expect(selected.selectedRing).toBe(true);
    expect(selected.numberColor).toBe(gazetteerLightTheme.primary);
    expect(today.backgroundColor).toBe(palette.todayFill);
  });
});
