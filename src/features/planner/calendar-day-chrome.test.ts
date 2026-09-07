import { describe, expect, it } from "vitest";
import {
  planAgendaDayNumberClass,
  planAgendaDayRowClass,
  planMonthDayNumberClass,
  planMonthDaySurfaceClass,
} from "./calendar-day-chrome";

describe("plan calendar day chrome", () => {
  it("fills adjacent-month tiles with high-contrast secondary", () => {
    const adjacent = planMonthDaySurfaceClass({
      inMonth: false,
      isToday: false,
      isSelected: false,
      isPastInMonth: false,
    });
    expect(adjacent).toContain("bg-selection");
    expect(adjacent).not.toContain("bg-primary");
    expect(adjacent).not.toContain("bg-muted");
    expect(planMonthDayNumberClass({ inMonth: false, isToday: false })).toBe(
      "text-selection-foreground"
    );
  });

  it("fills today with solid identity even in an adjacent month or when selected", () => {
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

    expect(today).toContain("bg-primary");
    expect(today).not.toContain("bg-primary/");
    expect(todaySelected).toContain("bg-primary");
    expect(todaySelected).not.toContain("bg-selection");
    expect(todayAdjacent).toContain("bg-primary");
    expect(todayAdjacent).not.toContain("bg-selection");
    expect(
      planMonthDayNumberClass({ inMonth: false, isToday: true, isSelected: false })
    ).toBe("text-primary-foreground");
  });

  it("fills a user-selected day that is not today with low-contrast muted", () => {
    const selected = planMonthDaySurfaceClass({
      inMonth: true,
      isToday: false,
      isSelected: true,
      isPastInMonth: false,
    });
    expect(selected).toContain("bg-muted");
    expect(selected).not.toContain("bg-selection");
    expect(selected).not.toContain("bg-primary");
    expect(
      planMonthDayNumberClass({ inMonth: true, isToday: false, isSelected: true })
    ).toBe("text-foreground");
  });

  it("uses muted selection for a selected week row that is not today", () => {
    expect(
      planAgendaDayRowClass({ inMonth: true, isToday: false, isSelected: true })
    ).toContain("bg-muted");
    expect(
      planAgendaDayRowClass({ inMonth: true, isToday: true, isSelected: true })
    ).toContain("bg-primary");
    expect(
      planAgendaDayRowClass({ inMonth: false, isToday: false, isSelected: false })
    ).toContain("bg-selection");
    expect(
      planAgendaDayNumberClass({ isToday: false, isSelected: true })
    ).toContain("text-foreground");
    expect(
      planAgendaDayNumberClass({ isToday: true, isSelected: true })
    ).toContain("text-primary");
  });
});
