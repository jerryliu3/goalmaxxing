"use client";

import { format, parse } from "date-fns";
import {
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";
import { promoteEntriesForDisplay } from "@/features/planner/calendar-entries";
import { CalendarMonthDayCell } from "@/features/planner/calendar-month-day-cell";
import {
  getDayStatus,
  getEntryCompactTitleWithTime,
  getEntryGoalFirstTitleWithTime,
  isEntryCredited,
  isEntryImmovableForDraft,
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
    | "clearHoverPreviewTimer"
    | "clearHoverPreviewCloseTimer"
    | "clearLongPressTimer"
    | "openDayPreview"
    | "handleDayCellClick"
    | "selectDayForView"
    | "scheduleHoverPreview"
    | "scheduleHoverPreviewClose"
    | "startLongPressPreview"
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
  const {
    clearHoverPreviewTimer,
    clearHoverPreviewCloseTimer,
    clearLongPressTimer,
    openDayPreview,
    handleDayCellClick,
    selectDayForView,
    scheduleHoverPreview,
    scheduleHoverPreviewClose,
    startLongPressPreview,
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
      const entriesForDayRaw = getOrderedEntriesForDay(cell.date);
      const entriesForDay =
        viewMode === "month" && calendarFocusedGoalId
          ? promoteEntriesForDisplay(entriesForDayRaw, calendarFocusedGoalId)
          : entriesForDayRaw;
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
                : 2
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
            isEntryImmovableForDraft(entry)
          }
          onEntryClick={(day, entry, target) => {
            if (!canMutateEntryOnDay(entry, day)) {
              return;
            }
            // Selecting an item takes two clicks: the first focuses its day, the
            // second selects the item. Dragging is a separate pointer path and
            // still moves an item straight out of an unfocused day.
            if (viewMode === "week" || viewMode === "three_day") {
              if (day !== focusedDay) {
                selectDayForView(day, resolveWeekAgendaSelectionViewMode());
                return;
              }
              togglePlannerGoalSelection(entry, { applyGoalFocus: false });
              return;
            }
            if (viewMode === "month") {
              if (day !== focusedDay) {
                // Month selection dims the rest of the grid around a focused
                // goal, so a click that only moves the day has to drop that
                // focus the same way clicking the day's empty space does.
                // Otherwise an unrelated goal stays lit through the first click.
                resetPlannerEntrySelection();
                selectDayForView(day, "month");
                return;
              }
              togglePlannerGoalSelection(entry, { applyGoalFocus: true });
              return;
            }
            if (viewMode === "day") {
              setDayPreview(null);
              if (day !== focusedDay) {
                setLocalSelectedDay(day);
                onSelectedDayChange(day, "push", "day");
                return;
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
            if (viewMode === "day") {
              return;
            }
            pointerPressActiveRef.current = true;
            clearHoverPreviewTimer();
            if (pointerType === "touch") {
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
              startLongPressPreview(cell.date, target);
            }
          }}
          onCellPointerUp={() => {
            if (viewMode === "day") {
              return;
            }
            pointerPressActiveRef.current = false;
            clearLongPressTimer();
          }}
          onCellPointerCancel={() => {
            if (viewMode === "day") {
              return;
            }
            pointerPressActiveRef.current = false;
            clearLongPressTimer();
          }}
          onCellPointerLeave={() => {
            if (viewMode === "day") {
              return;
            }
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
      startLongPressPreview,
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
