import { describe, expect, it, vi } from "vitest";
import {
  captureCalendarDayScreenTop,
  getCalendarTargetScrollLeft,
  getCalendarTargetScrollTop,
  getTopVisibleCalendarDay,
  isCalendarDayVisible,
  queryCalendarDayCell,
  queryVisibleMonthWeekEdgeCell,
  readMonthGridScrollEdges,
  resolveMonthRowAnchorDay,
  restoreCalendarDayScreenTop,
} from "@/features/planner/calendar-scroll-position";

function rect({
  left = 0,
  top = 0,
  width = 0,
  height = 0,
}: {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
}): DOMRect {
  return {
    left,
    right: left + width,
    top,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({}),
  };
}

describe("calendar scroll positions", () => {
  it("centers a horizontal target using scroll-container coordinates", () => {
    const container = document.createElement("div");
    const target = document.createElement("div");
    container.scrollLeft = 120;
    Object.defineProperties(container, {
      clientWidth: { configurable: true, value: 300 },
      scrollWidth: { configurable: true, value: 900 },
    });
    container.getBoundingClientRect = () => rect({ left: 40, width: 300 });
    target.getBoundingClientRect = () => rect({ left: 440, width: 100 });

    expect(getCalendarTargetScrollLeft(container, target)).toBe(420);
  });

  it("treats the month grid as at an edge only near the scroll start or end", () => {
    expect(
      readMonthGridScrollEdges({
        scrollTop: 0,
        clientHeight: 400,
        scrollHeight: 400,
      })
    ).toEqual({ atStart: true, atEnd: true });
    expect(
      readMonthGridScrollEdges({
        scrollTop: 80,
        clientHeight: 400,
        scrollHeight: 1200,
      })
    ).toEqual({ atStart: false, atEnd: false });
    expect(
      readMonthGridScrollEdges({
        scrollTop: 788,
        clientHeight: 400,
        scrollHeight: 1200,
      })
    ).toEqual({ atStart: false, atEnd: true });
  });

  it("aligns a vertical target to the container top", () => {
    const container = document.createElement("div");
    const target = document.createElement("div");
    container.scrollTop = 200;
    container.getBoundingClientRect = () => rect({ top: 80, height: 500 });
    target.getBoundingClientRect = () => rect({ top: 380, height: 96 });

    expect(getCalendarTargetScrollTop(container, target)).toBe(500);
  });

  it("treats a partially intersecting day as visible", () => {
    const container = document.createElement("div");
    const target = document.createElement("button");
    target.dataset.dayCell = "true";
    target.dataset.day = "2026-08-22";
    container.append(target);
    container.getBoundingClientRect = () =>
      rect({ left: 0, top: 0, width: 300, height: 500 });
    target.getBoundingClientRect = () =>
      rect({ left: 250, top: 100, width: 100, height: 96 });

    expect(
      isCalendarDayVisible(container, "2026-08-22", {
        checkVertical: false,
      })
    ).toBe(true);
  });

  it("skips day cells in hidden month weeks", () => {
    const container = document.createElement("div");
    const hiddenWeek = document.createElement("div");
    hiddenWeek.setAttribute("data-month-week-visible", "false");
    const hidden = document.createElement("button");
    hidden.dataset.dayCell = "true";
    hidden.dataset.day = "2026-07-01";
    hiddenWeek.append(hidden);
    const visibleWeek = document.createElement("div");
    visibleWeek.setAttribute("data-month-week-visible", "true");
    const visible = document.createElement("button");
    visible.dataset.dayCell = "true";
    visible.dataset.day = "2026-08-15";
    visibleWeek.append(visible);
    container.append(hiddenWeek, visibleWeek);

    expect(queryCalendarDayCell(container, "2026-07-01")).toBeNull();
    expect(queryCalendarDayCell(container, "2026-08-15")).toBe(visible);
    expect(queryVisibleMonthWeekEdgeCell(container, "start")).toBe(visible);
    expect(queryVisibleMonthWeekEdgeCell(container, "end")).toBe(visible);
  });

  it("picks the first and last visible month-week cells as row edges", () => {
    const container = document.createElement("div");
    const hiddenWeek = document.createElement("div");
    hiddenWeek.setAttribute("data-month-week-visible", "false");
    const hidden = document.createElement("button");
    hidden.dataset.dayCell = "true";
    hidden.dataset.day = "2026-07-01";
    hiddenWeek.append(hidden);
    const firstWeek = document.createElement("div");
    firstWeek.setAttribute("data-month-week-visible", "true");
    const first = document.createElement("button");
    first.dataset.dayCell = "true";
    first.dataset.day = "2026-08-01";
    firstWeek.append(first);
    const lastWeek = document.createElement("div");
    lastWeek.setAttribute("data-month-week-visible", "true");
    const last = document.createElement("button");
    last.dataset.dayCell = "true";
    last.dataset.day = "2026-08-31";
    lastWeek.append(last);
    container.append(hiddenWeek, firstWeek, lastWeek);

    expect(queryVisibleMonthWeekEdgeCell(container, "start")).toBe(first);
    expect(queryVisibleMonthWeekEdgeCell(container, "end")).toBe(last);
  });

  it("uses the first day intersecting the viewport, even when the grid starts above the fold", () => {
    const container = document.createElement("div");
    const hidden = document.createElement("button");
    hidden.dataset.dayCell = "true";
    hidden.dataset.day = "2026-08-01";
    const visible = document.createElement("button");
    visible.dataset.dayCell = "true";
    visible.dataset.day = "2026-08-15";
    container.append(hidden, visible);
    container.getBoundingClientRect = () =>
      rect({ left: 0, top: -240, width: 300, height: 900 });
    hidden.getBoundingClientRect = () =>
      rect({ left: 0, top: -240, width: 100, height: 96 });
    visible.getBoundingClientRect = () =>
      rect({ left: 0, top: 40, width: 100, height: 96 });

    expect(getTopVisibleCalendarDay(container)).toBe("2026-08-15");
    expect(
      resolveMonthRowAnchorDay({
        viewport: container,
        focusedDay: "2026-08-20",
      })
    ).toBe("2026-08-15");
  });

  it("falls back to the focused day when no cell is visible", () => {
    const container = document.createElement("div");
    container.getBoundingClientRect = () =>
      rect({ left: 0, top: 0, width: 300, height: 500 });

    expect(
      resolveMonthRowAnchorDay({
        viewport: container,
        focusedDay: "2026-08-20",
      })
    ).toBe("2026-08-20");
  });

  it("restores a day's screen position after expand by scrolling the window", () => {
    const viewport = document.createElement("div");
    const cell = document.createElement("button");
    cell.dataset.dayCell = "true";
    cell.dataset.day = "2026-08-15";
    viewport.append(cell);
    viewport.scrollTop = 180;
    viewport.getBoundingClientRect = () =>
      rect({ left: 0, top: -180, width: 300, height: 900 });
    cell.getBoundingClientRect = () =>
      rect({ left: 0, top: 220, width: 100, height: 96 });
    const scrollBy = vi.fn();
    window.scrollBy = scrollBy as typeof window.scrollBy;

    expect(captureCalendarDayScreenTop(viewport, "2026-08-15")).toBe(220);
    restoreCalendarDayScreenTop({
      viewport,
      day: "2026-08-15",
      previousTop: 80,
      alignInsideViewport: false,
    });

    expect(viewport.scrollTop).toBe(0);
    expect(scrollBy).toHaveBeenCalledWith({
      top: 140,
      left: 0,
      behavior: "auto",
    });
  });

  it("aligns the compact viewport to the anchored day before restoring screen position", () => {
    const viewport = document.createElement("div");
    const cell = document.createElement("button");
    cell.dataset.dayCell = "true";
    cell.dataset.day = "2026-08-15";
    viewport.append(cell);
    viewport.scrollTop = 0;
    viewport.getBoundingClientRect = () =>
      rect({ left: 0, top: 80, width: 300, height: 500 });
    cell.getBoundingClientRect = () =>
      rect({ left: 0, top: 380, width: 100, height: 96 });
    const scrollTo = vi.fn((options: ScrollToOptions) => {
      viewport.scrollTop = options.top ?? 0;
      cell.getBoundingClientRect = () =>
        rect({ left: 0, top: 80, width: 100, height: 96 });
    });
    viewport.scrollTo = scrollTo as typeof viewport.scrollTo;
    const scrollBy = vi.fn();
    window.scrollBy = scrollBy as typeof window.scrollBy;

    restoreCalendarDayScreenTop({
      viewport,
      day: "2026-08-15",
      previousTop: 80,
      alignInsideViewport: true,
    });

    expect(scrollTo).toHaveBeenCalledWith({ top: 300, behavior: "auto" });
    expect(scrollBy).not.toHaveBeenCalled();
  });
});
