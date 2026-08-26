"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCalendarTargetScrollLeft,
  getCalendarTargetScrollTop,
  isCalendarDayVisible,
  getTopVisibleCalendarDay,
} from "@/features/planner/calendar-scroll-position";
import type { PlannerCalendarViewMode } from "@/features/planner/calendar-surface.types";

function isMonthScopedCalendarViewMode(viewMode: PlannerCalendarViewMode) {
  return viewMode === "month";
}

export function useCalendarScrollBehavior({
  viewMode,
  month,
  context,
  calendarToday,
  focusedDay,
  focusedWeekDays,
  cells,
  cellByDate,
  pendingMonthAlignment,
  setPendingMonthAlignment,
  monthScrollAnchorDay,
  resolveWeekdayAlignedAnchorDay,
  resolveMonthScopedTopRowDay,
  multiMonthGridScrollRef,
  calendarGridViewportRef,
  rollingWeekStripRef,
  monthScrollAlignmentKeyRef,
  calendarHorizontalAlignmentKeyRef,
}: {
  viewMode: PlannerCalendarViewMode;
  month: string | null;
  context: unknown;
  calendarToday: string;
  focusedDay: string;
  focusedWeekDays: string[];
  cells: Array<{ date: string }>;
  cellByDate: Map<string, unknown>;
  pendingMonthAlignment: { rowStartDay: string; focusDay: string } | null;
  setPendingMonthAlignment: React.Dispatch<
    React.SetStateAction<{ rowStartDay: string; focusDay: string } | null>
  >;
  monthScrollAnchorDay: string | null;
  resolveWeekdayAlignedAnchorDay: (rowStartDay: string) => string;
  resolveMonthScopedTopRowDay: () => string | null;
  multiMonthGridScrollRef: React.RefObject<HTMLDivElement | null>;
  calendarGridViewportRef: React.RefObject<HTMLDivElement | null>;
  rollingWeekStripRef: React.RefObject<HTMLDivElement | null>;
  monthScrollAlignmentKeyRef: React.MutableRefObject<string | null>;
  calendarHorizontalAlignmentKeyRef: React.MutableRefObject<string | null>;
}) {
  const [showTodayShortcut, setShowTodayShortcut] = useState(false);
  const todayVisibilityFrameRef = useRef<number | null>(null);

  const syncTodayShortcutVisibility = useCallback(() => {
    let shouldShowShortcut = false;
    if (viewMode === "month") {
      const verticalContainer = multiMonthGridScrollRef.current;
      const horizontalContainer = calendarGridViewportRef.current;
      if (!cellByDate.has(calendarToday)) {
        shouldShowShortcut = true;
      } else if (!verticalContainer || !horizontalContainer) {
        shouldShowShortcut = true;
      } else {
        const verticallyVisible = isCalendarDayVisible(verticalContainer, calendarToday, {
          checkHorizontal: false,
        });
        const horizontallyVisible = isCalendarDayVisible(horizontalContainer, calendarToday, {
          checkVertical: false,
        });
        shouldShowShortcut = !(verticallyVisible && horizontallyVisible);
      }
    } else if (viewMode === "week") {
      const horizontalContainer = calendarGridViewportRef.current;
      shouldShowShortcut = !(
        focusedWeekDays.includes(calendarToday) &&
        horizontalContainer &&
        isCalendarDayVisible(horizontalContainer, calendarToday, {
          checkVertical: false,
        })
      );
    } else if (viewMode === "day" || viewMode === "three_day") {
      const stripContainer = rollingWeekStripRef.current;
      shouldShowShortcut = !(
        focusedWeekDays.includes(calendarToday) &&
        stripContainer &&
        isCalendarDayVisible(stripContainer, calendarToday, {
          checkVertical: false,
        })
      );
    }
    setShowTodayShortcut((current) =>
      current === shouldShowShortcut ? current : shouldShowShortcut
    );
  }, [
    calendarToday,
    calendarGridViewportRef,
    cellByDate,
    focusedWeekDays,
    multiMonthGridScrollRef,
    rollingWeekStripRef,
    viewMode,
  ]);

  const queueTodayShortcutVisibilitySync = useCallback(() => {
    if (todayVisibilityFrameRef.current !== null) {
      return;
    }
    todayVisibilityFrameRef.current = window.requestAnimationFrame(() => {
      todayVisibilityFrameRef.current = null;
      syncTodayShortcutVisibility();
    });
  }, [syncTodayShortcutVisibility]);

  const handleMonthScopedGridScroll = useCallback(() => {
    if (!isMonthScopedCalendarViewMode(viewMode)) {
      return;
    }
    const topRowDay = resolveMonthScopedTopRowDay();
    if (topRowDay) {
      // Anchor day tracked by navigation hook via scroll container reads.
    }
    queueTodayShortcutVisibilitySync();
  }, [queueTodayShortcutVisibilitySync, resolveMonthScopedTopRowDay, viewMode]);

  const handleCalendarGridViewportScroll = useCallback(() => {
    queueTodayShortcutVisibilitySync();
  }, [queueTodayShortcutVisibilitySync]);

  const alignRollingWeekStripToFocusedDay = useCallback(() => {
    if (viewMode !== "day" && viewMode !== "three_day") {
      return;
    }
    const strip = rollingWeekStripRef.current;
    if (!strip) {
      return;
    }
    const weekGrid = strip.querySelector<HTMLElement>('[data-rolling-week-grid="cells"]');
    const firstCell = weekGrid?.firstElementChild;
    if (!(firstCell instanceof HTMLElement) || !weekGrid) {
      return;
    }
    const focusedDayIndex = focusedWeekDays.indexOf(focusedDay);
    if (focusedDayIndex < 0) {
      return;
    }
    const gridStyles = window.getComputedStyle(weekGrid);
    const columnGap = Number.parseFloat(gridStyles.columnGap || "0");
    const columnWidth = firstCell.getBoundingClientRect().width;
    if (!Number.isFinite(columnWidth) || columnWidth <= 0) {
      return;
    }
    const visibleColumnCount = Math.max(
      1,
      Math.round((strip.clientWidth + columnGap) / (columnWidth + columnGap))
    );
    const leftMostVisibleIndex = Math.max(
      0,
      Math.min(
        focusedDayIndex - Math.floor(visibleColumnCount / 2),
        Math.max(0, focusedWeekDays.length - visibleColumnCount)
      )
    );
    strip.scrollTo({
      left: leftMostVisibleIndex * (columnWidth + columnGap),
      behavior: "auto",
    });
    queueTodayShortcutVisibilitySync();
  }, [focusedDay, focusedWeekDays, queueTodayShortcutVisibilitySync, rollingWeekStripRef, viewMode]);

  useEffect(() => {
    if (viewMode !== "day" && viewMode !== "three_day") {
      return;
    }
    const frame = window.requestAnimationFrame(alignRollingWeekStripToFocusedDay);
    window.addEventListener("resize", alignRollingWeekStripToFocusedDay);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", alignRollingWeekStripToFocusedDay);
    };
  }, [alignRollingWeekStripToFocusedDay, viewMode]);

  useEffect(() => {
    if (!isMonthScopedCalendarViewMode(viewMode)) {
      monthScrollAlignmentKeyRef.current = null;
      return;
    }
    if (!context) {
      return;
    }
    const verticalContainer = multiMonthGridScrollRef.current;
    const horizontalContainer = calendarGridViewportRef.current;
    const rowStartDay =
      pendingMonthAlignment?.rowStartDay ?? monthScrollAnchorDay;
    const focusDay =
      pendingMonthAlignment?.focusDay ??
      (rowStartDay ? resolveWeekdayAlignedAnchorDay(rowStartDay) : null);
    if (
      !verticalContainer ||
      !horizontalContainer ||
      !rowStartDay ||
      !focusDay ||
      !month
    ) {
      return;
    }
    const verticalAlignmentKey = `${viewMode}:${month}:${rowStartDay}`;
    const horizontalAlignmentKey = `${viewMode}:${month}:${focusDay}`;
    if (
      !pendingMonthAlignment &&
      monthScrollAlignmentKeyRef.current === verticalAlignmentKey &&
      calendarHorizontalAlignmentKeyRef.current === horizontalAlignmentKey
    ) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const rowStartCell = verticalContainer.querySelector<HTMLElement>(
        `[data-day-cell="true"][data-day="${rowStartDay}"]`
      );
      const focusCell = horizontalContainer.querySelector<HTMLElement>(
        `[data-day-cell="true"][data-day="${focusDay}"]`
      );
      if (!rowStartCell || !focusCell) {
        return;
      }
      monthScrollAlignmentKeyRef.current = verticalAlignmentKey;
      calendarHorizontalAlignmentKeyRef.current = horizontalAlignmentKey;
      const nextTop = getCalendarTargetScrollTop(verticalContainer, rowStartCell);
      if (typeof verticalContainer.scrollTo === "function") {
        verticalContainer.scrollTo({ top: nextTop, behavior: "auto" });
      } else {
        verticalContainer.scrollTop = nextTop;
      }
      const nextLeft = getCalendarTargetScrollLeft(horizontalContainer, focusCell);
      if (typeof horizontalContainer.scrollTo === "function") {
        horizontalContainer.scrollTo({ left: nextLeft, behavior: "auto" });
      } else {
        horizontalContainer.scrollLeft = nextLeft;
      }
      if (pendingMonthAlignment) {
        setPendingMonthAlignment((current) =>
          current === pendingMonthAlignment ? null : current
        );
      }
      queueTodayShortcutVisibilitySync();
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [
    calendarGridViewportRef,
    context,
    month,
    monthScrollAnchorDay,
    multiMonthGridScrollRef,
    pendingMonthAlignment,
    queueTodayShortcutVisibilitySync,
    resolveWeekdayAlignedAnchorDay,
    setPendingMonthAlignment,
    viewMode,
  ]);

  useEffect(() => {
    if (viewMode === "month") {
      return;
    }
    if (viewMode !== "week") {
      calendarHorizontalAlignmentKeyRef.current = null;
      return;
    }
    const viewport = calendarGridViewportRef.current;
    if (!viewport) {
      return;
    }
    const focusDay = focusedWeekDays.includes(calendarToday)
      ? calendarToday
      : focusedDay;
    if (!focusDay) {
      return;
    }
    const alignmentKey = `${viewMode}:${month ?? "none"}:${focusDay}`;
    if (calendarHorizontalAlignmentKeyRef.current === alignmentKey) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const focusCell = viewport.querySelector<HTMLElement>(
        `[data-day-cell="true"][data-day="${focusDay}"]`
      );
      if (!focusCell) {
        return;
      }
      calendarHorizontalAlignmentKeyRef.current = alignmentKey;
      const nextLeft = getCalendarTargetScrollLeft(viewport, focusCell);
      if (typeof viewport.scrollTo === "function") {
        viewport.scrollTo({ left: nextLeft, behavior: "auto" });
      } else {
        viewport.scrollLeft = nextLeft;
      }
      queueTodayShortcutVisibilitySync();
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [
    calendarGridViewportRef,
    calendarToday,
    focusedDay,
    focusedWeekDays,
    month,
    queueTodayShortcutVisibilitySync,
    viewMode,
  ]);

  useEffect(() => {
    queueTodayShortcutVisibilitySync();
  }, [cells, focusedDay, focusedWeekDays, month, queueTodayShortcutVisibilitySync, viewMode]);

  useEffect(() => {
    const handleResize = () => {
      queueTodayShortcutVisibilitySync();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [queueTodayShortcutVisibilitySync]);

  useEffect(() => {
    if (viewMode !== "day" && viewMode !== "three_day") {
      return;
    }
    const strip = rollingWeekStripRef.current;
    if (!strip) {
      return;
    }
    const handleStripScroll = () => {
      queueTodayShortcutVisibilitySync();
    };
    strip.addEventListener("scroll", handleStripScroll, { passive: true });
    return () => {
      strip.removeEventListener("scroll", handleStripScroll);
    };
  }, [queueTodayShortcutVisibilitySync, rollingWeekStripRef, viewMode]);

  useEffect(
    () => () => {
      if (todayVisibilityFrameRef.current !== null) {
        window.cancelAnimationFrame(todayVisibilityFrameRef.current);
        todayVisibilityFrameRef.current = null;
      }
    },
    []
  );

  return {
    showTodayShortcut,
    queueTodayShortcutVisibilitySync,
    handleMonthScopedGridScroll,
    handleCalendarGridViewportScroll,
  };
}
