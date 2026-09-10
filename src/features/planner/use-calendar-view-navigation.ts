"use client";

import { addDays, addMonths, format, isValid, parse } from "date-fns";
import { useCallback, useMemo, useRef, useState } from "react";
import { isEntryImmovableForDraft, parseMonth } from "@/features/planner/calendar-format";
import { getTopVisibleCalendarDay } from "@/features/planner/calendar-scroll-position";
import type {
  PlannerCalendarViewMode,
  PlannerDayDetailEntry,
} from "@/features/planner/calendar-surface.types";

export interface OpenGoalInstance {
  entryKey: string;
  day: string;
}

function isMonthScopedCalendarViewMode(viewMode: PlannerCalendarViewMode) {
  return viewMode === "month";
}

export function useCalendarViewNavigation({
  viewMode,
  month,
  focusedDay,
  focusedWeekDays,
  calendarToday,
  setupWeekStartsOn,
  cellByDate,
  cells,
  onMonthChange,
  onSelectedDayChange,
  setDayPreview,
  setSelectedEventEntryKey,
  setLocalSelectedDay,
  onRenderedViewModeChange,
  multiMonthGridScrollRef,
  monthScrollAlignmentKeyRef,
  calendarHorizontalAlignmentKeyRef,
}: {
  viewMode: PlannerCalendarViewMode;
  month: string | null;
  focusedDay: string;
  focusedWeekDays: string[];
  calendarToday: string;
  setupWeekStartsOn: number;
  cellByDate: Map<string, unknown>;
  cells: Array<{ date: string }>;
  onMonthChange: (month: string, mode: "push" | "replace") => void;
  onSelectedDayChange: (
    day: string,
    mode: "push" | "replace",
    viewMode: PlannerCalendarViewMode,
    options?: { alignMonth?: boolean }
  ) => void;
  setDayPreview: (value: null) => void;
  setSelectedEventEntryKey: (value: string | null) => void;
  setLocalSelectedDay: (value: string | null) => void;
  onRenderedViewModeChange: (viewMode: PlannerCalendarViewMode) => void;
  multiMonthGridScrollRef: React.RefObject<HTMLDivElement | null>;
  monthScrollAlignmentKeyRef: React.MutableRefObject<string | null>;
  calendarHorizontalAlignmentKeyRef: React.MutableRefObject<string | null>;
}) {
  const [pendingMonthAlignment, setPendingMonthAlignment] = useState<{
    rowStartDay: string;
    focusDay: string;
  } | null>(null);
  const monthScrollAnchorDayRef = useRef<string | null>(null);

  const resolveMonthScopedTopRowDay = useCallback(() => {
    const container = multiMonthGridScrollRef.current;
    return container ? getTopVisibleCalendarDay(container) : null;
  }, [multiMonthGridScrollRef]);

  const resolveWeekStartDay = useCallback(
    (day: string) => {
      const parsedDay = parse(day, "yyyy-MM-dd", new Date());
      if (!isValid(parsedDay)) {
        return day;
      }
      const weekdayOffset = (parsedDay.getDay() - setupWeekStartsOn + 7) % 7;
      return format(addDays(parsedDay, -weekdayOffset), "yyyy-MM-dd");
    },
    [setupWeekStartsOn]
  );

  const resolveWeekdayAlignedAnchorDay = useCallback(
    (rowStartDay: string) => {
      const rowWeekDays = Array.from({ length: 7 }, (_, index) =>
        format(addDays(parse(rowStartDay, "yyyy-MM-dd", new Date()), index), "yyyy-MM-dd")
      );
      const parsedToday = parse(calendarToday, "yyyy-MM-dd", new Date());
      if (!isValid(parsedToday)) {
        return rowWeekDays[0] ?? rowStartDay;
      }
      const weekdayOffset = (parsedToday.getDay() - setupWeekStartsOn + 7) % 7;
      return rowWeekDays[weekdayOffset] ?? rowWeekDays[0] ?? rowStartDay;
    },
    [calendarToday, setupWeekStartsOn]
  );

  const monthScrollAnchorDay = useMemo(() => {
    if (!month || !isMonthScopedCalendarViewMode(viewMode)) {
      return null;
    }
    const preservedTopRowDay = pendingMonthAlignment?.rowStartDay;
    if (preservedTopRowDay && cellByDate.has(preservedTopRowDay)) {
      return preservedTopRowDay;
    }
    for (const day of focusedWeekDays) {
      if (cellByDate.has(day)) {
        return day;
      }
    }
    if (cellByDate.has(calendarToday)) {
      return calendarToday;
    }
    return cells[0]?.date ?? null;
  }, [
    calendarToday,
    cellByDate,
    cells,
    focusedWeekDays,
    month,
    pendingMonthAlignment?.rowStartDay,
    viewMode,
  ]);

  const navigateToOpenInstance = useCallback(
    (target: OpenGoalInstance | undefined) => {
      if (!target) {
        return;
      }
      setSelectedEventEntryKey(target.entryKey);
      setLocalSelectedDay(target.day);
      if (viewMode === "month") {
        onMonthChange(target.day.slice(0, 7), "replace");
        return;
      }
      onSelectedDayChange(target.day, "replace", viewMode);
    },
    [onMonthChange, onSelectedDayChange, setLocalSelectedDay, setSelectedEventEntryKey, viewMode]
  );

  const jumpToToday = useCallback(() => {
    setDayPreview(null);
    setSelectedEventEntryKey(null);
    setLocalSelectedDay(calendarToday);
    monthScrollAlignmentKeyRef.current = null;
    calendarHorizontalAlignmentKeyRef.current = null;
    if (isMonthScopedCalendarViewMode(viewMode)) {
      const todayRowStartDay = resolveWeekStartDay(calendarToday);
      setPendingMonthAlignment({
        rowStartDay: todayRowStartDay,
        focusDay: calendarToday,
      });
      monthScrollAnchorDayRef.current = todayRowStartDay;
    }
    onSelectedDayChange(calendarToday, "replace", viewMode, { alignMonth: true });
  }, [
    calendarHorizontalAlignmentKeyRef,
    calendarToday,
    monthScrollAlignmentKeyRef,
    onSelectedDayChange,
    resolveWeekStartDay,
    setDayPreview,
    setLocalSelectedDay,
    setPendingMonthAlignment,
    setSelectedEventEntryKey,
    viewMode,
  ]);

  const moveViewWindow = useCallback(
    (direction: -1 | 1, resolvedFocusedDay: string, stepDays: number) => {
      if (isMonthScopedCalendarViewMode(viewMode)) {
        if (!month) {
          return;
        }
        onMonthChange(
          format(addMonths(parseMonth(month), direction), "yyyy-MM"),
          "push"
        );
        return;
      }
      const baseDay = parse(resolvedFocusedDay, "yyyy-MM-dd", new Date());
      const nextDay = format(addDays(baseDay, direction * stepDays), "yyyy-MM-dd");
      onSelectedDayChange(nextDay, "push", viewMode);
    },
    [month, onMonthChange, onSelectedDayChange, viewMode]
  );

  const setCalendarViewMode = useCallback(
    (nextViewMode: PlannerCalendarViewMode) => {
      if (nextViewMode === viewMode) {
        return;
      }
      setDayPreview(null);
      if (isMonthScopedCalendarViewMode(nextViewMode)) {
        setPendingMonthAlignment({
          rowStartDay: resolveWeekStartDay(focusedDay),
          focusDay: focusedDay,
        });
      } else {
        setPendingMonthAlignment(null);
      }
      monthScrollAlignmentKeyRef.current = null;
      calendarHorizontalAlignmentKeyRef.current = null;
      onRenderedViewModeChange(nextViewMode);
      onSelectedDayChange(focusedDay, "push", nextViewMode, { alignMonth: true });
    },
    [
      calendarHorizontalAlignmentKeyRef,
      focusedDay,
      monthScrollAlignmentKeyRef,
      onSelectedDayChange,
      onRenderedViewModeChange,
      resolveWeekStartDay,
      setDayPreview,
      viewMode,
    ]
  );

  return {
    pendingMonthAlignment,
    setPendingMonthAlignment,
    monthScrollAnchorDayRef,
    monthScrollAnchorDay,
    resolveMonthScopedTopRowDay,
    resolveWeekStartDay,
    resolveWeekdayAlignedAnchorDay,
    navigateToOpenInstance,
    jumpToToday,
    moveViewWindow,
    setCalendarViewMode,
  };
}

export function useCalendarEventDetail({
  selectedEventEntry,
  selectedEventEntryKey,
  entriesByDate,
}: {
  selectedEventEntry: PlannerDayDetailEntry | null;
  selectedEventEntryKey: string | null;
  entriesByDate: Map<string, PlannerDayDetailEntry[]>;
}) {
  const selectedGoalOpenInstances = useMemo<OpenGoalInstance[]>(() => {
    if (!selectedEventEntry) {
      return [];
    }
    const nextInstances: OpenGoalInstance[] = [];
    const targetGoalId = selectedEventEntry.originalGoalId;
    const orderedDays = Array.from(entriesByDate.keys()).sort();
    for (const day of orderedDays) {
      const dayEntries = entriesByDate.get(day) ?? [];
      for (const entry of dayEntries) {
        if (entry.originalGoalId !== targetGoalId) {
          continue;
        }
        if (!entry.activeItem) {
          continue;
        }
        if (isEntryImmovableForDraft(entry)) {
          continue;
        }
        nextInstances.push({ entryKey: entry.key, day });
      }
    }
    return nextInstances;
  }, [entriesByDate, selectedEventEntry]);

  const selectedGoalOpenInstanceIndex = useMemo(
    () =>
      selectedEventEntryKey
        ? selectedGoalOpenInstances.findIndex(
            (instance) => instance.entryKey === selectedEventEntryKey
          )
        : -1,
    [selectedEventEntryKey, selectedGoalOpenInstances]
  );

  return {
    selectedGoalOpenInstances,
    selectedGoalOpenInstanceIndex,
    canNavigateToFirstOpenInstance: selectedGoalOpenInstanceIndex > 0,
    canNavigateToPreviousOpenInstance: selectedGoalOpenInstanceIndex > 0,
    canNavigateToNextOpenInstance:
      selectedGoalOpenInstanceIndex >= 0 &&
      selectedGoalOpenInstanceIndex < selectedGoalOpenInstances.length - 1,
    canNavigateToLastOpenInstance:
      selectedGoalOpenInstanceIndex >= 0 &&
      selectedGoalOpenInstanceIndex < selectedGoalOpenInstances.length - 1,
  };
}
