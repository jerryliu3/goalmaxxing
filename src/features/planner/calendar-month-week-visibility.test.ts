import { describe, expect, it } from "vitest";
import { selectCalendarViewWindowProjection } from "@/features/planner/calendar-view-projection";
import {
  classifyMonthGridWeeks,
  groupMonthGridWeeks,
  isMonthWeekVisible,
  shouldShowAdjacentMonthToggle,
} from "@/features/planner/calendar-month-week-visibility";

describe("calendar month week visibility", () => {
  it("keeps overlap weeks with the current month and bands fully adjacent weeks", () => {
    const projection = selectCalendarViewWindowProjection({
      month: "2026-08",
      selectedDay: null,
      calendarToday: "2026-08-11",
      weekStartsOn: 1,
      viewMode: "month",
    });
    const weeks = groupMonthGridWeeks(projection.cells);
    const bands = classifyMonthGridWeeks(weeks);

    expect(weeks).toHaveLength(15);
    expect(weeks[0]?.map((cell) => cell.date)).toEqual([
      "2026-06-29",
      "2026-06-30",
      "2026-07-01",
      "2026-07-02",
      "2026-07-03",
      "2026-07-04",
      "2026-07-05",
    ]);
    expect(bands[0]).toBe("previous");

    const overlapStart = weeks.find((week) =>
      week.some((cell) => cell.date === "2026-08-01")
    );
    expect(overlapStart?.some((cell) => cell.date === "2026-07-27")).toBe(true);
    expect(overlapStart?.some((cell) => cell.inMonth)).toBe(true);
    expect(bands[weeks.indexOf(overlapStart!)]).toBe("current");

    const overlapEnd = weeks.find((week) =>
      week.some((cell) => cell.date === "2026-08-31")
    );
    expect(overlapEnd?.some((cell) => cell.date === "2026-09-01")).toBe(true);
    expect(bands[weeks.indexOf(overlapEnd!)]).toBe("current");

    const lateSeptember = weeks.find((week) =>
      week.some((cell) => cell.date === "2026-09-30")
    );
    expect(bands[weeks.indexOf(lateSeptember!)]).toBe("next");
  });

  it("hides adjacent bands until they are shown", () => {
    expect(
      isMonthWeekVisible("current", { previous: false, next: false })
    ).toBe(true);
    expect(
      isMonthWeekVisible("previous", { previous: false, next: false })
    ).toBe(false);
    expect(
      isMonthWeekVisible("previous", { previous: true, next: false })
    ).toBe(true);
    expect(isMonthWeekVisible("next", { previous: false, next: false })).toBe(
      false
    );
    expect(isMonthWeekVisible("next", { previous: false, next: true })).toBe(
      true
    );
  });

  it("keeps Hide visible whenever the adjacent month is shown", () => {
    expect(
      shouldShowAdjacentMonthToggle({
        hasAdjacentWeeks: true,
        adjacentShown: true,
        edgeVisible: false,
      })
    ).toBe(true);
    expect(
      shouldShowAdjacentMonthToggle({
        hasAdjacentWeeks: true,
        adjacentShown: false,
        edgeVisible: false,
      })
    ).toBe(false);
    expect(
      shouldShowAdjacentMonthToggle({
        hasAdjacentWeeks: true,
        adjacentShown: false,
        edgeVisible: true,
      })
    ).toBe(true);
    expect(
      shouldShowAdjacentMonthToggle({
        hasAdjacentWeeks: false,
        adjacentShown: true,
        edgeVisible: true,
      })
    ).toBe(false);
  });
});
