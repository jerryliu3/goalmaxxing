import { describe, expect, it } from "vitest";
import {
  planAgendaDayNumberClass,
  planAgendaDayRowClass,
  planFilledChromeMetaClass,
  planHiddenItemCountLabel,
  planLedgerSubtitleClass,
  planLedgerTitleClass,
  planMonthDayNumberClass,
  planMonthDaySurfaceClass,
  planSelectedWorkRowClass,
} from "./calendar-day-chrome";

describe("plan calendar day chrome", () => {
  it("fills adjacent-month tiles with the adjacent token", () => {
    const adjacent = planMonthDaySurfaceClass({
      inMonth: false,
      isToday: false,
      isSelected: false,
      isPastInMonth: false,
    });
    expect(adjacent).toContain("bg-adjacent");
    expect(adjacent).not.toContain("bg-today");
    expect(adjacent).not.toContain("bg-day-selected");
    expect(planMonthDayNumberClass({ inMonth: false, isToday: false })).toBe(
      "text-adjacent-foreground"
    );
  });

  it("fills today with solid today even in an adjacent month or when selected", () => {
    const today = planMonthDaySurfaceClass({
      inMonth: true,
      isToday: true,
      isSelected: false,
      isPastInMonth: false,
    });
    const todaySelected = planMonthDaySurfaceClass({
      inMonth: true,
      isToday: true,
      isSelected: true,
      isPastInMonth: false,
    });
    const todayAdjacent = planMonthDaySurfaceClass({
      inMonth: false,
      isToday: true,
      isSelected: false,
      isPastInMonth: false,
    });

    expect(today).toContain("bg-today");
    expect(today).not.toContain("bg-today/");
    expect(todaySelected).toContain("bg-today");
    expect(todaySelected).toContain("ring-primary");
    expect(todaySelected).not.toContain("bg-adjacent");
    expect(todayAdjacent).toContain("bg-today");
    expect(todayAdjacent).not.toContain("bg-adjacent");
    expect(
      planMonthDayNumberClass({ inMonth: false, isToday: true, isSelected: false })
    ).toBe("text-today-foreground");
  });

  it("outlines a user-selected day that is not today", () => {
    const selected = planMonthDaySurfaceClass({
      inMonth: true,
      isToday: false,
      isSelected: true,
      isPastInMonth: false,
    });
    expect(selected).toContain("ring-primary");
    expect(selected).not.toContain("bg-day-selected");
    expect(selected).not.toContain("bg-adjacent");
    expect(selected).not.toContain("bg-today");
    expect(
      planMonthDayNumberClass({ inMonth: true, isToday: false, isSelected: true })
    ).toBe("text-primary");
  });

  it("outlines a selected week row that is not today", () => {
    expect(
      planAgendaDayRowClass({ inMonth: true, isToday: false, isSelected: true })
    ).toContain("ring-primary");
    expect(
      planAgendaDayRowClass({ inMonth: true, isToday: false, isSelected: true })
    ).not.toContain("bg-day-selected");
    expect(
      planAgendaDayRowClass({ inMonth: true, isToday: true, isSelected: true })
    ).toContain("bg-today");
    expect(
      planAgendaDayRowClass({ inMonth: true, isToday: true, isSelected: true })
    ).toContain("ring-primary");
    expect(
      planAgendaDayRowClass({ inMonth: false, isToday: false, isSelected: false })
    ).toContain("bg-adjacent");
    expect(
      planAgendaDayNumberClass({ isToday: false, isSelected: true })
    ).toContain("text-primary");
    expect(
      planAgendaDayNumberClass({ isToday: true, isSelected: true })
    ).toContain("text-today");
  });

  it("reserves overflow remainder as +N more, including zero", () => {
    expect(planHiddenItemCountLabel(0)).toBe("+0 more");
    expect(planHiddenItemCountLabel(1)).toBe("+1 more");
    expect(planHiddenItemCountLabel(4)).toBe("+4 more");
  });

  it("washes a selected work row with an inset selection bar", () => {
    expect(planSelectedWorkRowClass(false)).toBe("");
    expect(planSelectedWorkRowClass(true)).toContain("bg-day-selected");
    expect(planSelectedWorkRowClass(true)).toContain("inset_3px_0_0");
    expect(planSelectedWorkRowClass(true)).not.toContain("text-day-selected-foreground");
  });

  it("keeps ledger titles slightly smaller than body text", () => {
    expect(planLedgerTitleClass).toContain("text-sm");
    expect(planLedgerTitleClass).not.toContain("text-base");
    expect(planLedgerSubtitleClass).toContain("text-sm");
    expect(planLedgerSubtitleClass).toContain("font-sans");
    expect(planLedgerSubtitleClass).not.toContain("font-display");
  });

  it("inherits meta color on filled agenda chrome so weekday labels stay visible", () => {
    expect(
      planFilledChromeMetaClass({ inMonth: false, isToday: false, isSelected: false })
    ).toContain("text-current");
    expect(
      planFilledChromeMetaClass({ inMonth: true, isToday: true, isSelected: false })
    ).toContain("text-current");
    expect(
      planFilledChromeMetaClass({ inMonth: true, isToday: false, isSelected: true })
    ).toBe("text-muted-foreground");
    expect(
      planFilledChromeMetaClass({ inMonth: true, isToday: false, isSelected: false })
    ).toBe("text-muted-foreground");
  });
});
