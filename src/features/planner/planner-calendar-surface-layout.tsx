"use client";

import { PlannerGoalLinksProvider } from "@/features/planner/planner-goal-links";

import { LoadingCard } from "@/components/ui/loading-card";
import {
  captureCalendarDayScreenTop,
  resolveMonthRowAnchorDay,
  restoreCalendarDayScreenTop,
} from "@/features/planner/calendar-scroll-position";
import type { GoalViewSession } from "@/features/planner/goal-view/goal-view-model";
import { PlannerGoalView } from "@/features/planner/goal-view/planner-goal-view";
import { PlannerCalendarBoard } from "@/features/planner/planner-calendar-board";
import { PlannerCalendarOverlays } from "@/features/planner/planner-calendar-overlays";
import { PlannerCalendarToolbar } from "@/features/planner/planner-calendar-toolbar";
import { PlanningActionBar } from "@/features/planner/plan-action-bar";
import { PlannerWarningsPanel } from "@/features/planner/planner-warnings-panel";
import { cn } from "@/lib/utils";
import type { PlannerEventDetailDialogCallbacks } from "@/features/planner/planner-event-detail-dialog";
import type {
  DayPreviewState,
  PlannerCalendarViewMode,
  PlannerCompletionFactMarker,
  PlannerContextPayload,
  PlannerDayDetailEntry,
} from "@/features/planner/calendar-surface.types";
import type { GoalCategoryFilterOption } from "@/features/goals/goal-filters";
import type { PlannerDragTarget } from "@/features/planner/planner-drag-target";
import type { PlannerEligibilityNotices } from "@/features/planner/planner-eligibility-notices";
import { canOpenPlannerEventDetails } from "@/features/planner/calendar-task-entries";
import type { MoveSourceCandidate } from "@/features/planner/planner-move-source-options";
import type { GoalMonthOption } from "@/lib/goals/list-view";
import type { OptimisticCompletionFacts } from "@/lib/planner/optimistic-completion-facts";
import { usePlanDayChecklistModel } from "@/features/planner/use-plan-day-checklist-model";
import {
  filterPlannerDayEntries,
  filterPlannerDayMarkers,
} from "@/features/planner/plan-day-filters";
import type { PlannerWorkUnit } from "@cadence/shared/planner/context";
import type { DuoLaneSubject } from "@cadence/shared/social/duo";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type ReactNode,
  type SetStateAction,
} from "react";

interface PlannerCalendarCell {
  date: string;
  inMonth: boolean;
}

export interface PlannerCalendarSurfaceLayoutProps {
  hasPlannerWarnings: boolean;
  warningsDismissed: boolean;
  setWarningsDismissed: Dispatch<SetStateAction<boolean>>;
  showBlockingLoading: boolean;
  error: string | null;
  plannerWarningBannerCopy: string;
  warningsOpen: boolean;
  setWarningsOpen: (open: boolean) => void;
  invalidLockGoalSummaries: Array<{
    goalId: string;
    title: string;
    unplacedCount: number;
    reason: "capacity" | "invalid_lock";
  }>;
  invalidLockGoalCount: number;
  totalInvalidLockSessionCount: number;
  warningSuggestedNextSteps: string[];
  eligibilityNotices: PlannerEligibilityNotices;
  plannerReadOnly: boolean;
  canResetPlan: boolean;
  resetLoading: boolean;
  loading: boolean;
  resetPlan: () => void;
  setSettingsOpen: (open: boolean) => void;
  hasDraftSession: boolean;
  canShowSaveAction: boolean;
  saveButtonLabel: string;
  draftSaveBlockedMessage: string | null;
  saveLoading: boolean;
  context: PlannerContextPayload | null;
  draftSaveWindow: { start: string; end: string } | null;
  hasUnsavedPlannerChanges: boolean;
  draftSaveBlocked: boolean;
  viewMode: PlannerCalendarViewMode;
  goalViewOpen: boolean;
  onGoalTimelineVisibleDateChange: (date: string) => void;
  onGoalTimelineRetry: () => void;
  goalViewVisible: boolean;
  onGoalViewOpenChange: (open: boolean) => void;
  goalViewSessions: GoalViewSession[];
  goalViewWindow: { start: string; end: string } | null;
  onGoalViewMoveSession: (entry: PlannerDayDetailEntry, date: string) => void;
  hideTasks: boolean;
  onHideTasksChange: (value: boolean) => void;
  searchQuery: string;
  savePlan: () => void;
  discardDraftChanges: () => void;
  setCalendarViewMode: (mode: PlannerCalendarViewMode) => void;
  setFiltersOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  partnerOverlayError?: string | null;
  partnerLabel?: string | null;
  viewerSubject?: DuoLaneSubject | null;
  partnerSubject?: DuoLaneSubject | null;
  duoScope?: "me" | "partner" | "both";
  month: string | null;
  previousWindowAriaLabel: string;
  nextWindowAriaLabel: string;
  fixedViewHeadingWidthCh: number;
  viewHeading: string;
  showTodayShortcut: boolean;
  expandedMonthRows: boolean;
  moveViewWindow: (direction: -1 | 1) => void;
  jumpToToday: () => void;
  setExpandedMonthRows: Dispatch<SetStateAction<boolean>>;
  getDragEntryLabel: (entryKey: string) => string;
  getDragDayLabel: (day: string) => string;
  renderEntryDragOverlay: (entryKey: string) => ReactNode;
  handleDndEntryDragStart: (entryKey: string) => void;
  handleDndEntryDragOver: (entryKey: string, target: PlannerDragTarget) => void;
  handleDndEntryDragEnd: (entryKey: string, target: PlannerDragTarget) => void;
  handleDndEntryDragCancel: (entryKey: string | null) => void;
  focusedDay: string;
  focusedDayEntries: PlannerDayDetailEntry[];
  focusedDayCompletionFactMarkers: PlannerCompletionFactMarker[];
  mutationLoadingKey: string | null;
  optimisticCompletionFacts: OptimisticCompletionFacts;
  canMutatePlanItems: boolean;
  canMutateEntryOnDay: (
    entry: PlannerDayDetailEntry,
    day: string | null
  ) => boolean;
  setLocalSelectedDay: (day: string | null) => void;
  setSelectedEventEntryKey: (key: string | null) => void;
  togglePlannerGoalSelection: (
    entry: PlannerDayDetailEntry,
    options: { applyGoalFocus: boolean }
  ) => void;
  onClearSelectedEntry: () => void;
  toggleDateFact: (
    entry: PlannerDayDetailEntry,
    selectedDateOverride?: string,
    sourceElement?: HTMLElement
  ) => Promise<void>;
  pointerPressActiveRef: MutableRefObject<boolean>;
  calendarGridViewportRef: MutableRefObject<HTMLDivElement | null>;
  handleCalendarGridViewportScroll: () => void;
  weekdayLabels: string[];
  multiMonthGridScrollRef: MutableRefObject<HTMLDivElement | null>;
  handleMonthScopedGridScroll: () => void;
  cells: PlannerCalendarCell[];
  renderCalendarDayCell: (cell: PlannerCalendarCell) => ReactNode;
  focusedWeekCells: PlannerCalendarCell[];
  dayPreview: DayPreviewState | null;
  dayPreviewRef: MutableRefObject<HTMLDivElement | null>;
  previewDayEntries: PlannerDayDetailEntry[];
  previewDayCompletionFactMarkers: PlannerCompletionFactMarker[];
  openMoveDialogForDay: (day: string) => void;
  setExpandedPreviewDay: (day: string | null) => void;
  setDayPreview: Dispatch<SetStateAction<DayPreviewState | null>>;
  clearHoverPreviewTimer: () => void;
  clearHoverPreviewCloseTimer: () => void;
  pointerInsideDayPreviewRef: MutableRefObject<boolean>;
  expandedPreviewDay: string | null;
  onConfirmDraftMove: (entry: PlannerDayDetailEntry, day: string) => void;
  onCancelDraftMove: (entry: PlannerDayDetailEntry, day: string) => void;
  expandedPreviewEntries: PlannerDayDetailEntry[];
  expandedPreviewCompletionFactMarkers: PlannerCompletionFactMarker[];
  contractExpandedPreview: () => void;
  moveDialogDay: string | null;
  effectiveMoveDialogSourceEntryKey: string;
  moveDialogSourceOptions: MoveSourceCandidate[];
  closeMoveDialog: () => void;
  setMoveDialogSourceEntryKey: (key: string) => void;
  submitMoveDialog: () => void;
  selectedEventEntry: PlannerDayDetailEntry | null;
  selectedEventBaselineUnit: PlannerWorkUnit | null;
  selectedEventDraftScheduledDate: string | null;
  selectedEventDraftTimeInputValue: string;
  canNavigateToFirstOpenInstance: boolean;
  canNavigateToPreviousOpenInstance: boolean;
  canNavigateToNextOpenInstance: boolean;
  canNavigateToLastOpenInstance: boolean;
  eventDetailCallbacks: PlannerEventDetailDialogCallbacks;
  filtersOpen: boolean;
  categoryFilters: string[];
  setCategoryFilters: (value: string[]) => void;
  goalIdFilters: string[];
  setGoalIdFilters: (value: string[]) => void;
  goalFilterOptions: GoalCategoryFilterOption[];
  effectiveEndMonthFilters: string[];
  endMonthFilters: string[];
  setEndMonthFilters: (value: string[]) => void;
  endMonthOptions: GoalMonthOption[];
  showCompletedGoals: boolean;
  setShowCompletedGoals: (value: boolean) => void;
  hideLinkedParents: boolean;
  setHideLinkedParents: (value: boolean) => void;
  settingsOpen: boolean;
  plannerSettingsForm: ReactNode;
  /** Recovery mode is on: its bar owns Save and Cancel for the draft. */
  recoveryMode?: boolean;
  /** Recovery mode without the full calendar: Day lists only the slipped goals' sessions. */
  recoveryGoalsOnly?: boolean;
  /** Agenda's "N sessions slipped · Review" prompt beside the title. */
  recoveryPrompt?: ReactNode;
  /** Recovery mode's floating bar. */
  recoveryBar?: ReactNode;
  /** Recovery mode's suggestions; the calendar makes room for them. */
  recoveryPanel?: ReactNode;
}

export function buildCalendarSurfaceLayoutProps<
  T extends PlannerCalendarSurfaceLayoutProps,
>(props: T): T {
  return props;
}

export function PlannerCalendarSurfaceLayout(props: PlannerCalendarSurfaceLayoutProps) {
  const {
    hasPlannerWarnings,
    warningsDismissed,
    setWarningsDismissed,
    showBlockingLoading,
    error,
    plannerWarningBannerCopy,
    warningsOpen,
    setWarningsOpen,
    invalidLockGoalSummaries,
    invalidLockGoalCount,
    totalInvalidLockSessionCount,
    warningSuggestedNextSteps,
    eligibilityNotices,
    plannerReadOnly,
    canResetPlan,
    resetLoading,
    loading,
    resetPlan,
    setSettingsOpen,
    hasDraftSession,
    canShowSaveAction,
    saveButtonLabel,
    draftSaveBlockedMessage,
    saveLoading,
    context,
    draftSaveWindow,
    hasUnsavedPlannerChanges,
    draftSaveBlocked,
    viewMode,
    goalViewOpen,
    goalViewVisible,
    onGoalTimelineVisibleDateChange,
    onGoalTimelineRetry,
    onGoalViewOpenChange,
    goalViewSessions,
    goalViewWindow,
    onGoalViewMoveSession,
    hideTasks,
    onHideTasksChange,
    searchQuery,
    savePlan,
    discardDraftChanges,
    setCalendarViewMode,
    setFiltersOpen,
    setSearchQuery,
    partnerOverlayError,
    partnerLabel = null,
    viewerSubject = null,
    partnerSubject = null,
    duoScope = "me",
    month,
    previousWindowAriaLabel,
    nextWindowAriaLabel,
    fixedViewHeadingWidthCh,
    viewHeading,
    showTodayShortcut,
    expandedMonthRows,
    moveViewWindow,
    jumpToToday,
    setExpandedMonthRows,
    getDragEntryLabel,
    getDragDayLabel,
    renderEntryDragOverlay,
    handleDndEntryDragStart,
    handleDndEntryDragOver,
    handleDndEntryDragEnd,
    handleDndEntryDragCancel,
    focusedDay,
    focusedDayEntries,
    focusedDayCompletionFactMarkers,
    mutationLoadingKey,
    optimisticCompletionFacts,
    canMutatePlanItems,
    canMutateEntryOnDay,
    setLocalSelectedDay,
    setSelectedEventEntryKey,
    togglePlannerGoalSelection,
    onClearSelectedEntry,
    toggleDateFact,
    pointerPressActiveRef,
    calendarGridViewportRef,
    handleCalendarGridViewportScroll,
    weekdayLabels,
    multiMonthGridScrollRef,
    handleMonthScopedGridScroll,
    cells,
    renderCalendarDayCell,
    focusedWeekCells,
    dayPreview,
    dayPreviewRef,
    previewDayEntries,
    previewDayCompletionFactMarkers,
    openMoveDialogForDay,
    setExpandedPreviewDay,
    setDayPreview,
    clearHoverPreviewTimer,
    clearHoverPreviewCloseTimer,
    pointerInsideDayPreviewRef,
    expandedPreviewDay,
    onConfirmDraftMove,
    onCancelDraftMove,
    expandedPreviewEntries,
    expandedPreviewCompletionFactMarkers,
    contractExpandedPreview,
    moveDialogDay,
    effectiveMoveDialogSourceEntryKey,
    moveDialogSourceOptions,
    closeMoveDialog,
    setMoveDialogSourceEntryKey,
    submitMoveDialog,
    selectedEventEntry,
    selectedEventBaselineUnit,
    selectedEventDraftScheduledDate,
    selectedEventDraftTimeInputValue,
    canNavigateToFirstOpenInstance,
    canNavigateToPreviousOpenInstance,
    canNavigateToNextOpenInstance,
    canNavigateToLastOpenInstance,
    eventDetailCallbacks,
    filtersOpen,
    categoryFilters,
    setCategoryFilters,
    goalIdFilters,
    setGoalIdFilters,
    goalFilterOptions,
    effectiveEndMonthFilters,
    endMonthFilters,
    setEndMonthFilters,
    endMonthOptions,
    showCompletedGoals,
    setShowCompletedGoals,
    hideLinkedParents,
    setHideLinkedParents,
    settingsOpen,
    plannerSettingsForm,
    recoveryMode = false,
    recoveryGoalsOnly = false,
    recoveryPrompt = null,
    recoveryBar = null,
    recoveryPanel = null,
  } = props;
  const showPlanningBar = hasDraftSession && !recoveryMode;
  // Goal View lists goals like Week/Month, so Day's own checklist filters
  // must not replace the planner's Filters while it is open.
  const checklistViewMode = goalViewVisible && viewMode === "day" ? "week" : viewMode;
  const dayChecklist = usePlanDayChecklistModel({
    isActive: true,
    viewDate: focusedDay,
    searchQuery,
    asOfDate: context?.asOfDate ?? null,
    timezone: context?.timezone ?? null,
    categoryFilters,
    onCategoryFiltersChange: setCategoryFilters,
    goalIdFilters,
    endMonthFilters: effectiveEndMonthFilters,
    onEndMonthFiltersChange: setEndMonthFilters,
    viewMode: checklistViewMode,
    plannerShowCompletedGoals: showCompletedGoals,
  });
  const dayEntries = useMemo(
    () => filterPlannerDayEntries(focusedDayEntries, dayChecklist.recurrenceGoalIds),
    [dayChecklist.recurrenceGoalIds, focusedDayEntries]
  );
  const dayCompletionFactMarkers = useMemo(
    () =>
      filterPlannerDayMarkers(focusedDayCompletionFactMarkers, dayChecklist.recurrenceGoalIds),
    [dayChecklist.recurrenceGoalIds, focusedDayCompletionFactMarkers]
  );
  const selectedEventGoal = selectedEventEntry
    ? dayChecklist.data.goals.find(
        (goal) => goal.id === selectedEventEntry.originalGoalId
      ) ?? null
    : null;
  const selectedEventPresentation = selectedEventEntry
    ? dayChecklist.listModel.presentationByGoalId.get(
        selectedEventEntry.originalGoalId
      ) ?? null
    : null;
  const pendingMonthRowRestoreRef = useRef<{
    day: string;
    previousTop: number;
    alignInsideViewport: boolean;
  } | null>(null);

  const onToggleExpandedMonthRows = useCallback(() => {
    const viewport = multiMonthGridScrollRef.current;
    const willExpand = !expandedMonthRows;
    if (viewport && viewMode === "month") {
      const day = resolveMonthRowAnchorDay({ viewport, focusedDay });
      const previousTop = captureCalendarDayScreenTop(viewport, day);
      if (previousTop != null) {
        pendingMonthRowRestoreRef.current = {
          day,
          previousTop,
          alignInsideViewport: !willExpand,
        };
      }
    }
    setExpandedMonthRows(willExpand);
  }, [
    expandedMonthRows,
    focusedDay,
    multiMonthGridScrollRef,
    setExpandedMonthRows,
    viewMode,
  ]);

  useLayoutEffect(() => {
    const pending = pendingMonthRowRestoreRef.current;
    if (!pending) {
      return;
    }
    pendingMonthRowRestoreRef.current = null;
    const viewport = multiMonthGridScrollRef.current;
    if (!viewport) {
      return;
    }
    restoreCalendarDayScreenTop({
      viewport,
      day: pending.day,
      previousTop: pending.previousTop,
      alignInsideViewport: pending.alignInsideViewport,
    });
  }, [expandedMonthRows, multiMonthGridScrollRef]);

  return (
    <PlannerGoalLinksProvider links={context?.links ?? []} goalTitles={context?.goalTitles ?? {}}>
    <div className={cn("space-y-4", (showPlanningBar || recoveryMode) && "pb-20")}>
      <PlannerWarningsPanel
        hasPlannerWarnings={hasPlannerWarnings}
        warningsDismissed={warningsDismissed}
        showBlockingLoading={showBlockingLoading}
        error={error}
        plannerWarningBannerCopy={plannerWarningBannerCopy}
        warningsOpen={warningsOpen}
        setWarningsOpen={setWarningsOpen}
        onDismissBanner={() => setWarningsDismissed(true)}
        invalidLockGoalSummaries={invalidLockGoalSummaries}
        invalidLockGoalCount={invalidLockGoalCount}
        totalInvalidLockSessionCount={totalInvalidLockSessionCount}
        warningSuggestedNextSteps={warningSuggestedNextSteps}
        eligibilityNotices={eligibilityNotices}
        plannerReadOnly={plannerReadOnly}
        canResetPlan={canResetPlan}
        resetLoading={resetLoading}
        loading={loading}
        onUnlockAllGoals={() => {
          setWarningsOpen(false);
          void resetPlan();
        }}
      />
      {showPlanningBar ? (
        <PlanningActionBar
          canSave={canShowSaveAction && !plannerReadOnly}
          saveLabel={saveButtonLabel}
          saveBlockedMessage={draftSaveBlockedMessage}
          saveDisabled={
            saveLoading ||
            loading ||
            !context ||
            !draftSaveWindow ||
            !hasUnsavedPlannerChanges ||
            draftSaveBlocked
          }
          discardDisabled={saveLoading || loading}
          onSave={savePlan}
          onDiscard={discardDraftChanges}
        />
      ) : null}
      {recoveryBar}
      <PlannerCalendarToolbar
        plannerReadOnly={plannerReadOnly}
        status={recoveryPrompt}
        loading={loading}
        viewMode={viewMode}
        goalViewOpen={goalViewOpen}
        onGoalViewOpenChange={onGoalViewOpenChange}
        canOpenSettings={Boolean(context?.preferences)}
        searchQuery={searchQuery}
        referenceMonth={month ?? focusedDay.slice(0, 7)}
        endMonthFilters={endMonthFilters}
        onEndMonthFiltersChange={setEndMonthFilters}
        onViewModeChange={setCalendarViewMode}
        goalIdFilters={goalIdFilters}
        onGoalIdFiltersChange={setGoalIdFilters}
        goalFilterOptions={goalFilterOptions}
        onOpenFilters={() => setFiltersOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onSearchQueryChange={setSearchQuery}
      />

      <div
        className={cn(
          "grid grid-cols-[minmax(0,1fr)] items-start gap-5",
          recoveryPanel && "lg:grid-cols-[minmax(0,1fr)_400px]"
        )}
      >
        <div className={cn("min-w-0 space-y-4", recoveryPanel && "pb-[45dvh] lg:pb-0")}>
          {partnerOverlayError ? (
            <p className="text-xs text-muted-foreground">{partnerOverlayError}</p>
          ) : null}
          {showBlockingLoading ? (
            <LoadingCard
              title="Loading planner context..."
              description="Preparing your schedule and completion state."
            />
          ) : error && !context ? (
            <div className="rounded-xl border bg-card p-6 text-sm text-destructive">
              {error}
            </div>
          ) : month ? (
            <>
              {error ? <div role="status" className="flex items-center gap-3 text-sm text-muted-foreground">
                <p>Calendar could not refresh.</p><button type="button" className="underline" onClick={onGoalTimelineRetry}>Retry</button>
              </div> : null}
              <PlannerCalendarBoard
                loading={loading}
                viewMode={viewMode}
                // Until Goal View's window has loaded, the calendar stays (dimmed by
                // the board's loading state), so the switch morphs the calendar's
                // pills into Goal View's cards rather than into a loading card.
                goalView={
                  goalViewVisible ? (
                    <PlannerGoalView
                      loading={loading}
                      onVisibleDate={onGoalTimelineVisibleDateChange}
                      onInspectDate={(date) => setExpandedPreviewDay(date)}
                      onOpenEntry={(entry, day) => {
                        // The checklist's session popup, with the goal card.
                        setLocalSelectedDay(day);
                        setSelectedEventEntryKey(entry.key);
                      }}
                      window={goalViewWindow!}
                      progressSummaries={dayChecklist.data.progress?.summaries ?? []}
                      onMoveEntry={onGoalViewMoveSession}
                      goals={dayChecklist.data.goals}
                      completedGoalIds={dayChecklist.listModel.targetAchievedGoalIds}
                      showCompletedGoals={showCompletedGoals}
                      sessions={goalViewSessions}
                      today={context?.asOfDate ?? focusedDay}
                      weekStartsOn={context?.preferences?.defaultPolicy.weekStartsOn}
                      canMutatePlanItems={canMutatePlanItems}
                      optimisticCompletionFacts={optimisticCompletionFacts}
                      mutationLoadingKey={mutationLoadingKey}
                      canOpenEntry={canOpenPlannerEventDetails}
                      canMutateEntryOnDay={canMutateEntryOnDay}
                      onToggleEntry={(entry, day, source) => {
                        void toggleDateFact(entry, day, source);
                      }}
                    />
                  ) : null
                }
                hideTasks={hideTasks}
                previousWindowAriaLabel={previousWindowAriaLabel}
                nextWindowAriaLabel={nextWindowAriaLabel}
                fixedViewHeadingWidthCh={fixedViewHeadingWidthCh}
                viewHeading={viewHeading}
                showTodayShortcut={showTodayShortcut}
                expandedMonthRows={expandedMonthRows}
                onMoveViewWindow={moveViewWindow}
                onJumpToToday={jumpToToday}
                onToggleExpandedMonthRows={onToggleExpandedMonthRows}
                getDragEntryLabel={getDragEntryLabel}
                getDragDayLabel={getDragDayLabel}
                renderEntryDragOverlay={renderEntryDragOverlay}
                onEntryDragStart={handleDndEntryDragStart}
                onEntryDragOverTarget={handleDndEntryDragOver}
                onEntryDragEnd={handleDndEntryDragEnd}
                onEntryDragCancel={handleDndEntryDragCancel}
                focusedDay={focusedDay}
                focusedDayEntries={dayEntries}
                focusedDayCompletionFactMarkers={dayCompletionFactMarkers}
                mutationLoadingKey={mutationLoadingKey}
                optimisticCompletionFacts={optimisticCompletionFacts}
                asOfDate={context?.asOfDate ?? null}
                canMutatePlanItems={canMutatePlanItems}
                canMutateEntryOnDay={canMutateEntryOnDay}
                onFocusedDayEntryOpen={(entryKey) => {
                  const entry = dayEntries.find(
                    (candidate) => candidate.key === entryKey
                  );
                  if (
                    !entry ||
                    !canMutateEntryOnDay(entry, focusedDay)
                  ) {
                    return;
                  }
                  setLocalSelectedDay(focusedDay);
                  togglePlannerGoalSelection(entry, {
                    applyGoalFocus: viewMode === "month",
                  });
                }}
                onToggleCompletion={(entry, day, sourceElement) => {
                  void toggleDateFact(entry, day, sourceElement ?? undefined);
                }}
                onEntryPointerStart={(immovable) => {
                  void immovable;
                  pointerPressActiveRef.current = true;
                }}
                onEntryPointerEnd={() => {
                  pointerPressActiveRef.current = false;
                }}
                selectedEntryKey={selectedEventEntry?.key ?? null}
                dayChecklist={dayChecklist}
                partnerLabel={partnerLabel}
                viewerSubject={viewerSubject}
                partnerSubject={partnerSubject}
                splitPartnerChecklist={viewMode === "day" && duoScope === "both"}
                hideWeekMonthChecklist={recoveryMode}
                dayScheduledOnly={recoveryGoalsOnly}
                calendarGridViewportRef={calendarGridViewportRef}
                onCalendarGridViewportScroll={handleCalendarGridViewportScroll}
                weekdayLabels={weekdayLabels}
                multiMonthGridScrollRef={multiMonthGridScrollRef}
                onMonthScopedGridScroll={handleMonthScopedGridScroll}
                cells={cells}
                renderCalendarDayCell={renderCalendarDayCell}
                focusedWeekCells={focusedWeekCells}
                dayPreview={dayPreview}
                dayPreviewRef={dayPreviewRef}
                previewDayEntries={previewDayEntries}
                previewDayCompletionFactMarkers={previewDayCompletionFactMarkers}
                onPreviewEntryOpen={(entryKey, day) => {
                  const entry = previewDayEntries.find(
                    (candidate) => candidate.key === entryKey
                  );
                  if (
                    !entry ||
                    !canMutateEntryOnDay(entry, day)
                  ) {
                    return;
                  }
                  setLocalSelectedDay(day);
                  togglePlannerGoalSelection(entry, {
                    applyGoalFocus: viewMode === "month",
                  });
                }}
                onPreviewToggleCompletion={(entry, day, sourceElement) => {
                  if (!canMutateEntryOnDay(entry, day)) {
                    return;
                  }
                  void toggleDateFact(entry, day, sourceElement ?? undefined);
                }}
                onMoveDay={openMoveDialogForDay}
                onExpandPreviewDay={(day) => {
                  setExpandedPreviewDay(day);
                  setDayPreview(null);
                }}
                onCloseDayPreview={() => setDayPreview(null)}
                onDayPreviewPointerDownCapture={() => {
                  setDayPreview((current) =>
                    current && !current.pinned ? { ...current, pinned: true } : current
                  );
                }}
                onDayPreviewMouseEnter={() => {
                  pointerInsideDayPreviewRef.current = true;
                  clearHoverPreviewTimer();
                  clearHoverPreviewCloseTimer();
                }}
                onDayPreviewMouseLeave={() => {
                  pointerInsideDayPreviewRef.current = false;
                  if (dayPreview?.pinned) {
                    return;
                  }
                  clearHoverPreviewTimer();
                  clearHoverPreviewCloseTimer();
                  setDayPreview(null);
                }}
                onConfirmDraftMove={onConfirmDraftMove}
                onCancelDraftMove={onCancelDraftMove}
                onCalendarViewModeChange={setCalendarViewMode}
                onClearSelectedEntry={onClearSelectedEntry}
                pinchDisabled
              />

            </>
          ) : null}
        </div>
        {recoveryPanel ? (
          // On desktop the column adds no height of its own, so it ends where the calendar does.
          <div className="lg:relative lg:min-h-[28rem] lg:self-stretch">
            <div className="lg:absolute lg:inset-0">{recoveryPanel}</div>
          </div>
        ) : null}
      </div>

      <PlannerCalendarOverlays
        renderMonthScopedOverlays={Boolean(month)}
        expandedPreviewDay={expandedPreviewDay}
        expandedPreviewEntries={expandedPreviewEntries}
        expandedPreviewCompletionFactMarkers={expandedPreviewCompletionFactMarkers}
        mutationLoadingKey={mutationLoadingKey}
        optimisticCompletionFacts={optimisticCompletionFacts}
        asOfDate={context?.asOfDate ?? null}
        canMutatePlanItems={canMutatePlanItems}
        canMutateEntryOnDay={canMutateEntryOnDay}
        onExpandedPreviewOpenChange={(open) => {
          if (!open) {
            setExpandedPreviewDay(null);
          }
        }}
        onExpandedPreviewMoveDay={openMoveDialogForDay}
        onExpandedPreviewContract={contractExpandedPreview}
        onExpandedPreviewEntryOpen={(entryKey, day) => {
          const entry = expandedPreviewEntries.find(
            (candidate) => candidate.key === entryKey
          );
          if (
            !entry ||
            !canMutateEntryOnDay(entry, day)
          ) {
            return;
          }
          setExpandedPreviewDay(null);
          setLocalSelectedDay(day);
          togglePlannerGoalSelection(entry, {
            applyGoalFocus: viewMode === "month",
          });
        }}
        onExpandedPreviewToggleCompletion={(entry, day, sourceElement) => {
          if (!canMutateEntryOnDay(entry, day)) {
            return;
          }
          void toggleDateFact(entry, day, sourceElement ?? undefined);
        }}
        onExpandedPreviewEntryPointerStart={(immovable) => {
          void immovable;
          pointerPressActiveRef.current = true;
        }}
        onExpandedPreviewEntryPointerEnd={() => {
          pointerPressActiveRef.current = false;
        }}
        moveDialogDay={moveDialogDay}
        effectiveMoveDialogSourceEntryKey={effectiveMoveDialogSourceEntryKey}
        moveDialogSourceOptions={moveDialogSourceOptions}
        onMoveDialogOpenChange={(open) => {
          if (!open) {
            closeMoveDialog();
          }
        }}
        onMoveDialogSourceChange={setMoveDialogSourceEntryKey}
        onMoveDialogCancel={closeMoveDialog}
        onMoveDialogSubmit={submitMoveDialog}
        selectedEventEntry={selectedEventEntry?.entryKind === "task" ? null : selectedEventEntry}
        selectedEventGoal={selectedEventGoal}
        selectedEventPresentation={selectedEventPresentation}
        selectedEventProgress={dayChecklist.data.progress?.summaries.find(summary => summary.goalId === selectedEventGoal?.id) ?? null}
        selectedEventBaselineUnit={selectedEventBaselineUnit}
        selectedEventDraftScheduledDate={selectedEventDraftScheduledDate}
        selectedEventDraftTimeInputValue={selectedEventDraftTimeInputValue}
        canNavigateToFirstOpenInstance={canNavigateToFirstOpenInstance}
        canNavigateToPreviousOpenInstance={canNavigateToPreviousOpenInstance}
        canNavigateToNextOpenInstance={canNavigateToNextOpenInstance}
        canNavigateToLastOpenInstance={canNavigateToLastOpenInstance}
        eventDetailCallbacks={eventDetailCallbacks}
        eventDetailPresentation={goalViewOpen ? "popup" : "inline"}
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
        hideTasks={hideTasks}
        onHideTasksChange={onHideTasksChange}
        tasksToggleDisabled={plannerReadOnly}
        showTasksToggle={!goalViewOpen}
        categoryFilters={categoryFilters}
        onCategoryFiltersChange={setCategoryFilters}
        categoryOptions={dayChecklist.categoryOptions}
        endMonthFilters={effectiveEndMonthFilters}
        onEndMonthFiltersChange={setEndMonthFilters}
        endMonthOptions={endMonthOptions}
        showCompletedGoals={showCompletedGoals}
        onShowCompletedGoalsChange={setShowCompletedGoals}
        hideLinkedParents={hideLinkedParents}
        onHideLinkedParentsChange={setHideLinkedParents}
        dayFilters={
          !goalViewOpen && checklistViewMode === "day" && dayChecklist
            ? dayChecklist.filterFormProps
            : null
        }
        settingsOpen={settingsOpen}
        onSettingsOpenChange={setSettingsOpen}
        plannerSettingsForm={plannerSettingsForm}
      />
    </div>
    </PlannerGoalLinksProvider>

  );
}
