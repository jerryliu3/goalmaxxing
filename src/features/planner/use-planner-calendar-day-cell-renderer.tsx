"use client";

import { format, parse } from "date-fns";
import {
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useMediaQuery } from "@/lib/ui/use-media-query";
import {
  CalendarMonthDayCell,
  COMPACT_MONTH_MAX_VISIBLE_GOALS,
} from "@/features/planner/calendar-month-day-cell";
import {
  getDayStatus,
  getEntryCompactTitleWithTime,
  getEntryGoalFirstTitleWithTime,
  isEntryCredited,
} from "@/features/planner/calendar-format";
import type {
  DayPreviewState,
  PlannerCalendarViewMode,
  PlannerCompletionFactMarker,
  PlannerDayDetailEntry,
} from "@/features/planner/calendar-surface.types";
import type { PlannerDayPreviewInteractions } from "@/features/planner/use-planner-day-preview-interactions";
import { getPlannerCompletionTogglePresentation } from "@/features/planner/completion-entry-dispatch";
import { scrollPlannerChecklistIntoView } from "@/features/planner/planner-checklist-scroll";
import type { OptimisticCompletionFacts } from "@/lib/planner/optimistic-completion-facts";
export function resolveWeekAgendaSelectionViewMode(): Extract<
  PlannerCalendarViewMode,
  "week" | "day"
> {
  return "week";
}

interface PlannerCalendarCell {
  date: string;
  inMonth: boolean;
}

export function selectOnboardingCalendarItemDay({
  calendarToday,
  visibleCells,
  getEntryCount,
}: {
  calendarToday: string;
  visibleCells: PlannerCalendarCell[];
  getEntryCount: (day: string) => number;
}) {
  const todayIsVisible = visibleCells.some((cell) => cell.date === calendarToday);
  if (todayIsVisible && getEntryCount(calendarToday) > 0) {
    return calendarToday;
  }
  return (
    visibleCells.find(
      (cell) => cell.inMonth && getEntryCount(cell.date) > 0
    )?.date ??
    visibleCells.find((cell) => getEntryCount(cell.date) > 0)?.date ??
    null
  );
}

interface UsePlannerCalendarDayCellRendererArgs {
  viewMode: PlannerCalendarViewMode;
  expandedMonthRows: boolean;
  draggingEntryKey: string | null;
  calendarToday: string;
  focusedDay: string;
  plannerReadOnly: boolean;
  onSelectedDayChange: (
    day: string | null,
    mode: "push" | "replace",
    nextViewMode?: PlannerCalendarViewMode
  ) => void;
  setLocalSelectedDay: (day: string | null) => void;
  setSelectedEventEntryKey: (entryKey: string | null) => void;
  selectedEventEntryKey: string | null;
  setCalendarFocusedGoalId: (goalId: string | null) => void;
  calendarFocusedGoalId: string | null;
  togglePlannerGoalSelection: (
    entry: PlannerDayDetailEntry,
    options: { applyGoalFocus: boolean }
  ) => void;
  resetPlannerEntrySelection: (options?: { clearGoalFocus?: boolean }) => void;
  calendarAsOfDate: string;
  setDayPreview: Dispatch<SetStateAction<DayPreviewState | null>>;
  canMutateEntryOnDay: (entry: PlannerDayDetailEntry, day: string) => boolean;
  getOrderedEntriesForDay: (day: string | null) => PlannerDayDetailEntry[];
  getCompletionFactMarkersForDay: (day: string | null) => PlannerCompletionFactMarker[];
  asOfDate: string | null;
  canMutatePlanItems: boolean;
  mutationLoadingKey: string | null;
  optimisticCompletionFacts?: OptimisticCompletionFacts;
  onToggleCompletion: (
    entry: PlannerDayDetailEntry,
    day: string,
    sourceElement?: HTMLButtonElement
  ) => void;
  visibleCells: PlannerCalendarCell[];
  dayPreviewInteractions: Pick<
    PlannerDayPreviewInteractions,
    | "renderTaskComposer"
    | "clearHoverPreviewTimer"
    | "clearHoverPreviewCloseTimer"
    | "clearLongPressTimer"
    | "openDayPreview"
    | "handleDayCellClick"
    | "selectDayForView"
    | "scheduleHoverPreview"
    | "scheduleHoverPreviewClose"
    | "startDayLongPress"
    | "pointerPressActiveRef"
    | "longPressTriggeredRef"
    | "lastTouchTapRef"
    | "suppressDayCellClickRef"
  >;
}

export function usePlannerCalendarDayCellRenderer({
  viewMode,
  expandedMonthRows,
  draggingEntryKey,
  calendarToday,
  focusedDay,
  plannerReadOnly,
  onSelectedDayChange,
    setLocalSelectedDay,
  setSelectedEventEntryKey,
  selectedEventEntryKey,
  setCalendarFocusedGoalId,
  calendarFocusedGoalId,
  togglePlannerGoalSelection,
  resetPlannerEntrySelection,
  calendarAsOfDate,
  setDayPreview,
  canMutateEntryOnDay,
  getOrderedEntriesForDay,
  getCompletionFactMarkersForDay,
  asOfDate,
  canMutatePlanItems,
  mutationLoadingKey,
  optimisticCompletionFacts,
  onToggleCompletion,
  visibleCells,
  dayPreviewInteractions,
}: UsePlannerCalendarDayCellRendererArgs) {
  const portraitPhone = useMediaQuery(
    "(max-width: 767px) and (orientation: portrait)"
  );
  const compactMonth = viewMode === "month" && portraitPhone && !expandedMonthRows;
  const {
    renderTaskComposer,
    clearHoverPreviewTimer,
    clearHoverPreviewCloseTimer,
    clearLongPressTimer,
    openDayPreview,
    handleDayCellClick,
    selectDayForView,
    scheduleHoverPreview,
    scheduleHoverPreviewClose,
    startDayLongPress,
    pointerPressActiveRef,
    longPressTriggeredRef,
    lastTouchTapRef,
    suppressDayCellClickRef,
  } = dayPreviewInteractions;
  const onboardingItemDay = selectOnboardingCalendarItemDay({
    calendarToday,
    visibleCells,
    getEntryCount: (day) => getOrderedEntriesForDay(day).length,
  });

  return useCallback(
    (cell: PlannerCalendarCell) => {
      const entriesForDay = getOrderedEntriesForDay(cell.date);
      const completionFactMarkersForDay = getCompletionFactMarkersForDay(cell.date);
      const status =
        entriesForDay.length > 0
          ? getDayStatus(entriesForDay, "No items")
          : completionFactMarkersForDay.length > 0
            ? "Completed elsewhere"
            : "No items";
      const isToday = cell.date === calendarToday;
      const isPastInMonth = cell.inMonth && cell.date < calendarToday;
      const monthContextLabel =
        viewMode === "month" && !cell.inMonth && cell.date.endsWith("-01")
          ? format(parse(cell.date, "yyyy-MM-dd", new Date()), "MMM")
          : null;
      const ariaLabel = `${format(
        parse(cell.date, "yyyy-MM-dd", new Date()),
        "EEEE, MMMM d, yyyy"
      )}. ${entriesForDay.length} planned item${
        entriesForDay.length === 1 ? "" : "s"
      }. ${completionFactMarkersForDay.length} completion fact${
        completionFactMarkersForDay.length === 1 ? "" : "s"
      }. ${status}.`;

      return (
        <CalendarMonthDayCell
          key={`${viewMode}-${cell.date}`}
          day={cell.date}
          compactMonth={compactMonth}
          taskComposer={compactMonth ? null : renderTaskComposer?.(cell.date)}
          inMonth={cell.inMonth}
          monthContextLabel={monthContextLabel}
          isToday={isToday}
          isPastInMonth={isPastInMonth}
          isSelected={cell.date === focusedDay}
          layout={viewMode === "week" ? "agenda" : "month"}
          ariaLabel={ariaLabel}
          entriesForDay={entriesForDay}
          focusedGoalId={viewMode === "month" ? calendarFocusedGoalId : null}
          selectedEntryKey={viewMode === "month" ? selectedEventEntryKey : null}
          completionFactMarkersForDay={completionFactMarkersForDay}
          maxVisibleItems={
            viewMode === "week" || viewMode === "three_day"
              ? Number.MAX_SAFE_INTEGER
              : expandedMonthRows
                ? Number.MAX_SAFE_INTEGER
                : COMPACT_MONTH_MAX_VISIBLE_GOALS
          }
          isAnyEntryDragging={Boolean(draggingEntryKey)}
          getEntryDisplayTitle={
            viewMode === "month" || viewMode === "week" || viewMode === "three_day"
              ? getEntryCompactTitleWithTime
              : getEntryGoalFirstTitleWithTime
          }
          isEntryCredited={isEntryCredited}
          isEntryImmovableForDraft={(entry) =>
            plannerReadOnly ||
            !canMutateEntryOnDay(entry, cell.date) ||
            entry.draftGhost ||
            (entry.entryKind === "task" && isEntryCredited(entry))
          }
          onEntryClick={(day, entry, target) => {
            if (!canMutateEntryOnDay(entry, day)) {
              return;
            }
            // One click on a work item selects its day and the item together.
            // Dragging is a separate pointer path and still moves an item
            // straight out of an unfocused day.
            if (viewMode === "week" || viewMode === "three_day") {
              if (day !== focusedDay) {
                selectDayForView(day, resolveWeekAgendaSelectionViewMode());
              }
              togglePlannerGoalSelection(entry, { applyGoalFocus: false });
              return;
            }
            if (viewMode === "month") {
              if (day !== focusedDay) {
                selectDayForView(day, "month");
              }
              togglePlannerGoalSelection(entry, { applyGoalFocus: true });
              return;
            }
            if (viewMode === "day") {
              setDayPreview(null);
              if (day !== focusedDay) {
                setLocalSelectedDay(day);
                onSelectedDayChange(day, "push", "day");
              }
              togglePlannerGoalSelection(entry, { applyGoalFocus: false });
              return;
            }
            clearHoverPreviewTimer();
            clearHoverPreviewCloseTimer();
            setSelectedEventEntryKey(null);
            openDayPreview({ day, pinned: true, target });
          }}
          onCellClick={(target) => {
            if (suppressDayCellClickRef.current?.day === cell.date && suppressDayCellClickRef.current.active) {
              suppressDayCellClickRef.current = null;
              longPressTriggeredRef.current = false;
              return;
            }
            if (draggingEntryKey) {
              return;
            }
            if (viewMode === "week") {
              selectDayForView(cell.date, resolveWeekAgendaSelectionViewMode());
              return;
            }
            if (viewMode === "month") {
              resetPlannerEntrySelection();
              selectDayForView(cell.date, "month");
              return;
            }
            if (viewMode === "day") {
              if (cell.date !== focusedDay) {
                setLocalSelectedDay(cell.date);
                onSelectedDayChange(cell.date, "push", "day");
              }
              setDayPreview(null);
              return;
            }
            handleDayCellClick(cell.date, target);
          }}
          onCellDoubleClick={(target) => {
            void target;
            if (draggingEntryKey) {
              return;
            }
            clearHoverPreviewTimer();
            clearHoverPreviewCloseTimer();
            clearLongPressTimer();
            longPressTriggeredRef.current = false;
            setDayPreview(null);
            selectDayForView(
              cell.date,
              viewMode === "week" ? resolveWeekAgendaSelectionViewMode() : "month"
            );
            scrollPlannerChecklistIntoView();
          }}
          onCellMouseEnter={(target) => {
            if (viewMode === "day") {
              return;
            }
            scheduleHoverPreview(cell.date, target);
          }}
          onCellMouseLeave={() => {
            if (viewMode === "day") {
              return;
            }
            clearHoverPreviewTimer();
            scheduleHoverPreviewClose(cell.date);
          }}
          onCellPointerDown={(pointerType, target) => {
            if (draggingEntryKey) {
              return;
            }
            pointerPressActiveRef.current = true;
            clearHoverPreviewTimer();
            setDayPreview(null);
            if (pointerType === "touch" && viewMode !== "day") {
              const now = Date.now();
              const lastTouchTap = lastTouchTapRef.current;
              if (
                lastTouchTap &&
                lastTouchTap.day === cell.date &&
                now - lastTouchTap.at < 350
              ) {
                clearLongPressTimer();
                longPressTriggeredRef.current = false;
                suppressDayCellClickRef.current = {
                  day: cell.date,
                  active: true,
                };
                setDayPreview(null);
                selectDayForView(
                  cell.date,
                  viewMode === "week" ? resolveWeekAgendaSelectionViewMode() : "month"
                );
                scrollPlannerChecklistIntoView();
                return;
              }
              lastTouchTapRef.current = { day: cell.date, at: now };
            }
            if (!plannerReadOnly && cell.date >= calendarToday) startDayLongPress(cell.date);
          }}
          onCellPointerUp={() => {
            pointerPressActiveRef.current = false;
            clearLongPressTimer();
          }}
          onCellPointerCancel={() => {
            pointerPressActiveRef.current = false;
            clearLongPressTimer();
          }}
          onCellPointerLeave={() => {
            clearLongPressTimer();
          }}
          onEntryPointerStart={(immovable) => {
            void immovable;
            pointerPressActiveRef.current = true;
            clearHoverPreviewTimer();
            setDayPreview(null);
          }}
          onEntryPointerEnd={() => {
            pointerPressActiveRef.current = false;
          }}
          onToggleCompletion={(entry, entryDay, sourceElement) => {
            onToggleCompletion(entry, entryDay, sourceElement);
          }}
          getCompletionToggleState={(entry, entryDay) =>
            getPlannerCompletionTogglePresentation({
              entry,
              selectedDay: entryDay,
              asOfDate,
              canMutatePlanItems,
              canMutateEntryOnDay,
            })
          }
          mutationLoadingKey={mutationLoadingKey}
          optimisticCompletionFacts={optimisticCompletionFacts}
          onboardingFirstEntry={cell.date === onboardingItemDay}
        />
      );
    },
    [
      renderTaskComposer,
      compactMonth,
      calendarToday,
      canMutateEntryOnDay,
      clearHoverPreviewCloseTimer,
      clearHoverPreviewTimer,
      clearLongPressTimer,
      draggingEntryKey,
      expandedMonthRows,
      focusedDay,
      getCompletionFactMarkersForDay,
      getOrderedEntriesForDay,
      handleDayCellClick,
      longPressTriggeredRef,
      onSelectedDayChange,
      openDayPreview,
      selectDayForView,
      plannerReadOnly,
      pointerPressActiveRef,
      scheduleHoverPreview,
      scheduleHoverPreviewClose,
      setDayPreview,
      setLocalSelectedDay,
      setSelectedEventEntryKey,
      selectedEventEntryKey,
      setCalendarFocusedGoalId,
      calendarFocusedGoalId,
      togglePlannerGoalSelection,
      resetPlannerEntrySelection,
      calendarAsOfDate,
      startDayLongPress,
      suppressDayCellClickRef,
      lastTouchTapRef,
      viewMode,
      onboardingItemDay,
      asOfDate,
      canMutatePlanItems,
      mutationLoadingKey,
      optimisticCompletionFacts,
      onToggleCompletion,
    ]
  );
}
