"use client";

import type { MutableRefObject, ReactNode } from "react";
import { PlannerDndProvider } from "@/features/planner/calendar-dnd";
import type { PlannerDragTarget } from "@/features/planner/planner-drag-target";
import {
  getEntryGoalFirstTitleWithTime,
  getEntrySubtitle,
  isEntryCredited,
  isEntryImmovableForDraft,
} from "@/features/planner/calendar-format";
import type {
  DayPreviewState,
  PlannerCalendarViewMode,
  PlannerCompletionFactMarker,
  PlannerDayDetailEntry,
} from "@/features/planner/calendar-surface.types";
import styles from "@/features/planner/calendar-surface.module.css";
import { PlannerDayPreviewPopover } from "@/features/planner/planner-day-preview-popover";
import { PlannerFocusedDayPane } from "@/features/planner/planner-focused-day-pane";
import { PlannerViewWindowHeader } from "@/features/planner/planner-view-window-header";
import { PlannerPartnerWeekDayCell } from "@/features/planner/planner-partner-week-cell";
import { PlanViewTransitionFrame } from "@/features/planner/plan-view-transition-frame";
import type { PlanDayChecklistModel } from "@/features/planner/use-plan-day-checklist-model";

const SEVEN_COLUMN_GRID_STYLE = {
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
} as const;

function isMonthScopedCalendarViewMode(viewMode: PlannerCalendarViewMode) {
  return viewMode === "month";
}

interface PlannerCalendarCell {
  date: string;
  inMonth: boolean;
}

export interface PlannerCalendarBoardProps {
  loading: boolean;
  viewMode: PlannerCalendarViewMode;
  showTasksInsteadOfGoals?: boolean;
  previousWindowAriaLabel: string;
  nextWindowAriaLabel: string;
  fixedViewHeadingWidthCh: number;
  viewHeading: string;
  showTodayShortcut: boolean;
  expandedMonthRows: boolean;
  onMoveViewWindow: (direction: -1 | 1) => void;
  onJumpToToday: () => void;
  onToggleExpandedMonthRows: () => void;
  getDragEntryLabel: (entryKey: string) => string;
  getDragDayLabel: (day: string) => string;
  renderEntryDragOverlay?: (entryKey: string) => ReactNode;
  onEntryDragStart: (entryKey: string) => void;
  onEntryDragOverTarget?: (
    entryKey: string,
    target: PlannerDragTarget
  ) => void;
  onEntryDragEnd: (entryKey: string, target: PlannerDragTarget) => void;
  onEntryDragCancel: (entryKey: string | null) => void;
  rollingWeekStrip: ReactNode;
  focusedDay: string;
  focusedDayEntries: PlannerDayDetailEntry[];
  focusedDayCompletionFactMarkers: PlannerCompletionFactMarker[];
  mutationLoadingKey: string | null;
  asOfDate: string | null;
  canMutatePlanItems: boolean;
  canMutateEntryOnDay: (entry: PlannerDayDetailEntry, day: string | null) => boolean;
  onFocusedDayEntryOpen: (entryKey: string) => void;
  onToggleCompletion: (
    entry: PlannerDayDetailEntry,
    day: string,
    sourceElement?: HTMLButtonElement
  ) => void;
  onEntryPointerStart: (immovable: boolean) => void;
  onEntryPointerEnd: () => void;
  selectedEntryKey?: string | null;
  dayChecklist?: PlanDayChecklistModel | null;
  calendarGridViewportRef: MutableRefObject<HTMLDivElement | null>;
  onCalendarGridViewportScroll: () => void;
  weekdayLabels: string[];
  multiMonthGridScrollRef: MutableRefObject<HTMLDivElement | null>;
  onMonthScopedGridScroll: () => void;
  cells: PlannerCalendarCell[];
  renderCalendarDayCell: (cell: PlannerCalendarCell) => ReactNode;
  focusedWeekCells: PlannerCalendarCell[];
  partnerWeekBoard?: {
    label: string;
    getMarkersForDay: (day: string) => PlannerCompletionFactMarker[];
  } | null;
  dayPreview: DayPreviewState | null;
  dayPreviewRef: MutableRefObject<HTMLDivElement | null>;
  previewDayEntries: PlannerDayDetailEntry[];
  previewDayCompletionFactMarkers: PlannerCompletionFactMarker[];
  onPreviewEntryOpen: (entryKey: string, day: string) => void;
  onPreviewToggleCompletion: (
    entry: PlannerDayDetailEntry,
    day: string,
    sourceElement?: HTMLButtonElement
  ) => void;
  onMoveDay: (day: string) => void;
  onExpandPreviewDay: (day: string) => void;
  onCloseDayPreview: () => void;
  onDayPreviewPointerDownCapture: () => void;
  onDayPreviewMouseEnter: () => void;
  onDayPreviewMouseLeave: () => void;
}

export function PlannerCalendarBoard({
  loading,
  viewMode,
  showTasksInsteadOfGoals = false,
  previousWindowAriaLabel,
  nextWindowAriaLabel,
  fixedViewHeadingWidthCh,
  viewHeading,
  showTodayShortcut,
  expandedMonthRows,
  onMoveViewWindow,
  onJumpToToday,
  onToggleExpandedMonthRows,
  getDragEntryLabel,
  getDragDayLabel,
  renderEntryDragOverlay,
  onEntryDragStart,
  onEntryDragOverTarget,
  onEntryDragEnd,
  onEntryDragCancel,
  rollingWeekStrip,
  focusedDay,
  focusedDayEntries,
  focusedDayCompletionFactMarkers,
  mutationLoadingKey,
  asOfDate,
  canMutatePlanItems,
  canMutateEntryOnDay,
  onFocusedDayEntryOpen,
  onToggleCompletion,
  onEntryPointerStart,
  onEntryPointerEnd,
  selectedEntryKey = null,
  dayChecklist = null,
  calendarGridViewportRef,
  onCalendarGridViewportScroll,
  weekdayLabels,
  multiMonthGridScrollRef,
  onMonthScopedGridScroll,
  cells,
  renderCalendarDayCell,
  focusedWeekCells,
  partnerWeekBoard = null,
  dayPreview,
  dayPreviewRef,
  previewDayEntries,
  previewDayCompletionFactMarkers,
  onPreviewEntryOpen,
  onPreviewToggleCompletion,
  onMoveDay,
  onExpandPreviewDay,
  onCloseDayPreview,
  onDayPreviewPointerDownCapture,
  onDayPreviewMouseEnter,
  onDayPreviewMouseLeave,
}: PlannerCalendarBoardProps) {
  return (
    <div
      className="border-b border-border pb-4"
      data-onboarding="planner.calendar.board"
    >
      <PlannerViewWindowHeader
        loading={loading}
        viewMode={viewMode}
        previousWindowAriaLabel={previousWindowAriaLabel}
        nextWindowAriaLabel={nextWindowAriaLabel}
        fixedViewHeadingWidthCh={fixedViewHeadingWidthCh}
        viewHeading={viewHeading}
        showTodayShortcut={showTodayShortcut}
        expandedMonthRows={expandedMonthRows}
        onMoveViewWindow={onMoveViewWindow}
        onJumpToToday={onJumpToToday}
        onToggleExpandedMonthRows={onToggleExpandedMonthRows}
      />
      <PlannerDndProvider
        getEntryLabel={getDragEntryLabel}
        getDayLabel={getDragDayLabel}
        renderDragOverlay={renderEntryDragOverlay}
        onEntryDragStart={onEntryDragStart}
        onEntryDragOverTarget={onEntryDragOverTarget}
        onEntryDragEnd={onEntryDragEnd}
        onEntryDragCancel={onEntryDragCancel}
      >
        <div
          className={`transition-opacity duration-150 motion-reduce:transition-none ${
            loading ? "opacity-70" : "opacity-100"
          } ${isMonthScopedCalendarViewMode(viewMode) ? "min-h-[34rem]" : "min-h-[26rem]"}`}
        >
          <PlanViewTransitionFrame viewMode={viewMode}>
          {viewMode === "day" ? (
            <PlannerFocusedDayPane
              day={focusedDay}
              entries={focusedDayEntries}
              completionFactMarkers={focusedDayCompletionFactMarkers}
              mutationLoading={Boolean(mutationLoadingKey)}
              asOfDate={asOfDate}
              canMutatePlanItems={canMutatePlanItems}
              canMutateEntryOnDay={canMutateEntryOnDay}
              onEntryOpen={onFocusedDayEntryOpen}
              onToggleCompletion={onToggleCompletion}
              onEntryPointerStart={onEntryPointerStart}
              onEntryPointerEnd={onEntryPointerEnd}
              showTasksInsteadOfGoals={showTasksInsteadOfGoals}
              selectedEntryKey={selectedEntryKey}
              dayChecklist={dayChecklist}
              titleAs="h2"
              shareDayTransition
            />
          ) : viewMode === "three_day" ? (
            rollingWeekStrip
          ) : (
            <div className="md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(18rem,24rem)] md:items-start md:gap-8">
              <div className="min-w-0">
                {viewMode === "week" && partnerWeekBoard ? (
                  <div
                    className="grid gap-4 md:grid-cols-2"
                    data-testid="duo-week-board"
                  >
                    <section className="space-y-2">
                      <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        You
                      </h2>
                      <ol
                        aria-label="Your week"
                        className="flex flex-col"
                        data-calendar-week-agenda="true"
                      >
                        {focusedWeekCells.map(renderCalendarDayCell)}
                      </ol>
                    </section>
                    <section className="space-y-2">
                      <div className="flex min-h-6 items-center gap-2">
                        <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          {partnerWeekBoard.label}
                        </h2>
                        <span className="rounded-[8px] border border-border px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                          View only
                        </span>
                      </div>
                      <ol
                        aria-label={`${partnerWeekBoard.label} week`}
                        className="flex flex-col"
                      >
                        {focusedWeekCells.map((cell) => (
                          <PlannerPartnerWeekDayCell
                            key={`partner-week-${cell.date}`}
                            day={cell.date}
                            inMonth={cell.inMonth}
                            isToday={cell.date === asOfDate}
                            isSelected={cell.date === focusedDay}
                            layout="agenda"
                            markers={partnerWeekBoard.getMarkersForDay(cell.date)}
                          />
                        ))}
                      </ol>
                    </section>
                  </div>
                ) : viewMode === "week" ? (
                  <ol
                    aria-label="Week agenda"
                    className="flex flex-col"
                    data-testid="week-agenda"
                    data-calendar-week-agenda="true"
                  >
                    {focusedWeekCells.map(renderCalendarDayCell)}
                  </ol>
                ) : (
                  <div className="mx-auto w-full max-w-[56rem]">
                    <div
                      ref={calendarGridViewportRef}
                      onScroll={onCalendarGridViewportScroll}
                      className="overflow-x-auto pb-1"
                      data-calendar-horizontal-viewport="true"
                    >
                      {isMonthScopedCalendarViewMode(viewMode) ? (
                        <div
                          className={styles.monthGridTrack}
                          data-calendar-grid-track="true"
                        >
                          <div
                            className="grid gap-2 text-center text-xs text-muted-foreground"
                            style={SEVEN_COLUMN_GRID_STYLE}
                            data-calendar-weekday-grid="true"
                          >
                            {weekdayLabels.map((weekday) => (
                              <span key={weekday}>{weekday}</span>
                            ))}
                          </div>
                          <div
                            ref={multiMonthGridScrollRef}
                            onScroll={onMonthScopedGridScroll}
                            className="mt-2 max-h-[34rem] overflow-y-auto overscroll-y-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                            data-calendar-month-vertical-viewport="true"
                          >
                            <div
                              className="grid gap-2"
                              style={SEVEN_COLUMN_GRID_STYLE}
                            >
                              {cells.map(renderCalendarDayCell)}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
              <aside
                className="hidden min-w-0 md:block"
                data-testid="plan-desktop-day-pane"
                style={{ viewTransitionName: "plan-focused-aside" }}
              >
                <PlannerFocusedDayPane
                  day={focusedDay}
                  entries={focusedDayEntries}
                  completionFactMarkers={focusedDayCompletionFactMarkers}
                  mutationLoading={Boolean(mutationLoadingKey)}
                  asOfDate={asOfDate}
                  canMutatePlanItems={canMutatePlanItems}
                  canMutateEntryOnDay={canMutateEntryOnDay}
                  onEntryOpen={onFocusedDayEntryOpen}
                  onToggleCompletion={onToggleCompletion}
                  onEntryPointerStart={onEntryPointerStart}
                  onEntryPointerEnd={onEntryPointerEnd}
                  showTasksInsteadOfGoals={showTasksInsteadOfGoals}
                  selectedEntryKey={selectedEntryKey}
                />
              </aside>
            </div>
          )}
          </PlanViewTransitionFrame>

          {viewMode !== "day" && dayPreview ? (
            <PlannerDayPreviewPopover
              dayPreview={dayPreview}
              popupRef={dayPreviewRef}
              entries={previewDayEntries}
              completionFactMarkers={previewDayCompletionFactMarkers}
              mutationLoading={Boolean(mutationLoadingKey)}
              asOfDate={asOfDate}
              canMutatePlanItems={canMutatePlanItems}
              canMutateEntryOnDay={canMutateEntryOnDay}
              getEntryDisplayTitle={getEntryGoalFirstTitleWithTime}
              getEntrySubtitle={getEntrySubtitle}
              isEntryCredited={isEntryCredited}
              isEntryImmovableForDraft={isEntryImmovableForDraft}
              onEntryOpen={onPreviewEntryOpen}
              onToggleCompletion={onPreviewToggleCompletion}
              onEntryPointerStart={onEntryPointerStart}
              onEntryPointerEnd={onEntryPointerEnd}
              onMoveDay={onMoveDay}
              onExpandDay={onExpandPreviewDay}
              onClose={onCloseDayPreview}
              onPointerDownCapture={onDayPreviewPointerDownCapture}
              onMouseEnter={onDayPreviewMouseEnter}
              onMouseLeave={onDayPreviewMouseLeave}
            />
          ) : null}
        </div>
      </PlannerDndProvider>
    </div>
  );
}
