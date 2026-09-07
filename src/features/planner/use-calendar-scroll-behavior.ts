"use client";

import { useCallback, useEffect } from "react";
import {
  getCalendarTargetScrollLeft,
  getCalendarTargetScrollTop,
} from "@/features/planner/calendar-scroll-position";
import { shouldShowPlanTodayShortcut } from "@/features/planner/calendar-today-shortcut";
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
  pendingMonthAlignment,
  setPendingMonthAlignment,
  monthScrollAnchorDay,
  resolveWeekdayAlignedAnchorDay,
  resolveMonthScopedTopRowDay,
  multiMonthGridScrollRef,
  calendarGridViewportRef,
  monthScrollAlignmentKeyRef,
  calendarHorizontalAlignmentKeyRef,
}: {
  viewMode: PlannerCalendarViewMode;
  month: string | null;
  context: unknown;
  calendarToday: string;
  focusedDay: string;
  focusedWeekDays: string[];
  pendingMonthAlignment: { rowStartDay: string; focusDay: string } | null;
  setPendingMonthAlignment: React.Dispatch<
    React.SetStateAction<{ rowStartDay: string; focusDay: string } | null>
  >;
  monthScrollAnchorDay: string | null;
  resolveWeekdayAlignedAnchorDay: (rowStartDay: string) => string;
  resolveMonthScopedTopRowDay: () => string | null;
  multiMonthGridScrollRef: React.RefObject<HTMLDivElement | null>;
  calendarGridViewportRef: React.RefObject<HTMLDivElement | null>;
  monthScrollAlignmentKeyRef: React.MutableRefObject<string | null>;
  calendarHorizontalAlignmentKeyRef: React.MutableRefObject<string | null>;
}) {
  const showTodayShortcut = shouldShowPlanTodayShortcut(focusedDay, calendarToday);

  const handleMonthScopedGridScroll = useCallback(() => {
    if (!isMonthScopedCalendarViewMode(viewMode)) {
      return;
    }
    resolveMonthScopedTopRowDay();
  }, [resolveMonthScopedTopRowDay, viewMode]);

  const handleCalendarGridViewportScroll = useCallback(() => {
    return;
  }, []);

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
    // Scope alignment to the viewed month, not the selected day. Clicking a
    // date should update the checklist without pulling that week to row one.
    const verticalAlignmentKey = `${viewMode}:${month}`;
    const horizontalAlignmentKey = `${viewMode}:${month}`;
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
    viewMode,
  ]);

  return {
    showTodayShortcut,
    handleMonthScopedGridScroll,
    handleCalendarGridViewportScroll,
  };
}
