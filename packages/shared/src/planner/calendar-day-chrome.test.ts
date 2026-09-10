import { describe, expect, it } from "vitest";
import { GAZETTEER, gazetteerLightTheme } from "../brand/gazetteer";
import {
  buildGazetteerMonthDayChromePalette,
  planHiddenItemCountLabel,
  resolveGazetteerMonthDayChromeStyle,
  resolveMonthDayChromeKind,
} from "./calendar-day-chrome";

describe("gazetteer calendar day chrome", () => {
  const palette = buildGazetteerMonthDayChromePalette(gazetteerLightTheme, "light");

  it("fills adjacent-month tiles with the adjacent token", () => {
    expect(
      resolveMonthDayChromeKind({
        inMonth: false,
        isToday: false,
        isSelected: false,
        isPastInMonth: false,
      })
    ).toBe("adjacent");
    const adjacent = resolveGazetteerMonthDayChromeStyle(
      {
        inMonth: false,
        isToday: false,
        isSelected: false,
        isPastInMonth: false,
      },
      palette
    );
    expect(adjacent.backgroundColor).toBe("#d4d4d8");
    expect(adjacent.numberColor).toBe(GAZETTEER.mutedDeep);
  });

  it("fills today with solid today even when selected", () => {
    const today = resolveGazetteerMonthDayChromeStyle(
      {
        inMonth: true,
        isToday: true,
        isSelected: false,
        isPastInMonth: false,
      },
      palette
    );
    const todaySelected = resolveGazetteerMonthDayChromeStyle(
      {
        inMonth: true,
        isToday: true,
        isSelected: true,
        isPastInMonth: false,
      },
      palette
    );
    expect(today.backgroundColor).toBe(palette.todayFill);
    expect(todaySelected.backgroundColor).toBe(palette.todayFill);
    expect(todaySelected.selectedRing).toBe(true);
  });

  it("outlines a user-selected day that is not today", () => {
    const selected = resolveGazetteerMonthDayChromeStyle(
      {
        inMonth: true,
        isToday: false,
        isSelected: true,
        isPastInMonth: false,
      },
      palette
    );
    expect(selected.selectedRing).toBe(true);
    expect(selected.numberColor).toBe(gazetteerLightTheme.primary);
    expect(selected.backgroundColor).toBe(gazetteerLightTheme.page);
  });

  it("hides overflow remainder as +N more", () => {
    expect(planHiddenItemCountLabel(0)).toBeNull();
    expect(planHiddenItemCountLabel(1)).toBe("+1 more");
    expect(planHiddenItemCountLabel(4)).toBe("+4 more");
  });
});
