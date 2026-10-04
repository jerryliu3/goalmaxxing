"use client";

import { LoadingCard } from "@/components/ui/loading-card";
import {
  captureCalendarDayScreenTop,
  resolveMonthRowAnchorDay,
  restoreCalendarDayScreenTop,
} from "@/features/planner/calendar-scroll-position";
import type { GoalViewSession } from "@/features/planner/goal-view/goal-view-model";
import { PlannerGoalPresentation } from "@/features/planner/goal-view/planner-goal-presentation";
import { PlannerCalendarBoard } from "@/features/planner/planner-calendar-board";
import { PlannerCalendarOverlays } from "@/features/planner/planner-calendar-overlays";
import { PlannerCalendarToolbar } from "@/features/planner/planner-calendar-toolbar";
import { PlannerWarningsPanel } from "@/features/planner/planner-warnings-panel";
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
import type { PlannerWorkUnit } from "@cadence/shared/planner/context";
import type { DuoLaneSubject } from "@cadence/shared/social/duo";
import {
  useCallback,
  useLayoutEffect,
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
  unplaceableGoalSummaries: Array<{
    goalId: string;
    title: string;
    unplacedCount: number;
    reason: "capacity" | "invalid_lock";
  }>;
  invalidLockGoalCount: number;
  capacityWarningGoalCount: number;
  totalUnplacedCount: number;
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
  selectedEventLinkedTargets: Array<{
    sourceGoalId: string;
    targetGoalId: string;
    targetSuppressionKind: "none" | "until" | "indefinite";
    targetResumesOn: string | null;
  }>;
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
  categoryOptions: GoalCategoryFilterOption[];
  goalIdFilters: string[];
  setGoalIdFilters: (value: string[]) => void;
  goalFilterOptions: GoalCategoryFilterOption[];
  effectiveEndMonthFilters: string[];
  endMonthFilters: string[];
  setEndMonthFilters: (value: string[]) => void;
  endMonthOptions: GoalMonthOption[];
  showCompletedGoals: boolean;
  setShowCompletedGoals: (value: boolean) => void;
  settingsOpen: boolean;
  plannerSettingsForm: ReactNode;
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
    unplaceableGoalSummaries,
    invalidLockGoalCount,
    capacityWarningGoalCount,
    totalUnplacedCount,
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
    selectedEventLinkedTargets,
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
    categoryOptions,
    goalIdFilters,
    setGoalIdFilters,
    goalFilterOptions,
    effectiveEndMonthFilters,
    endMonthFilters,
    setEndMonthFilters,
    endMonthOptions,
    showCompletedGoals,
    setShowCompletedGoals,
    settingsOpen,
    plannerSettingsForm,
  } = props;
  // Goal View lists goals like Week/Month, so Day's own checklist filters
  // must not replace the planner's Filters while it is open.
  const checklistViewMode = goalViewVisible && viewMode === "day" ? "week" : viewMode;
  const dayChecklist = usePlanDayChecklistModel({
    isActive: true,
    viewDate: focusedDay,
    searchQuery,
    asOfDate: context?.asOfDate ?? null,
    timezone: context?.timezone ?? null,
    endMonthFilters: effectiveEndMonthFilters,
    viewMode: checklistViewMode,
    plannerShowCompletedGoals: showCompletedGoals,
  });
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
    <div className="space-y-4">
      <PlannerWarningsPanel
        hasPlannerWarnings={hasPlannerWarnings}
        warningsDismissed={warningsDismissed}
        showBlockingLoading={showBlockingLoading}
        error={error}
        plannerWarningBannerCopy={plannerWarningBannerCopy}
        warningsOpen={warningsOpen}
        setWarningsOpen={setWarningsOpen}
        onDismissBanner={() => setWarningsDismissed(true)}
        unplaceableGoalSummaries={unplaceableGoalSummaries}
        invalidLockGoalCount={invalidLockGoalCount}
        capacityWarningGoalCount={capacityWarningGoalCount}
        totalUnplacedCount={totalUnplacedCount}
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
        onOpenPlannerSettings={() => {
          setWarningsOpen(false);
          setSettingsOpen(true);
        }}
      />
      <PlannerCalendarToolbar
        hasDraftSession={hasDraftSession}
        plannerReadOnly={plannerReadOnly}
        canShowSaveAction={canShowSaveAction}
        saveButtonLabel={saveButtonLabel}
        draftSaveBlockedMessage={draftSaveBlockedMessage}
        saveDisabled={
          saveLoading ||
          loading ||
          !context ||
          !draftSaveWindow ||
          !hasUnsavedPlannerChanges ||
          draftSaveBlocked
        }
        undoDisabled={saveLoading || loading}
        loading={loading}
        viewMode={viewMode}
        goalViewOpen={goalViewOpen}
        onGoalViewOpenChange={onGoalViewOpenChange}
        canOpenSettings={Boolean(context?.preferences)}
        linkedTargetDetails={eligibilityNotices.linkedTargetDetails}
        searchQuery={searchQuery}
        referenceMonth={month ?? focusedDay.slice(0, 7)}
        endMonthFilters={endMonthFilters}
        onEndMonthFiltersChange={setEndMonthFilters}
        onSave={savePlan}
        onDiscardDraftChanges={discardDraftChanges}
        onViewModeChange={setCalendarViewMode}
        goalIdFilters={goalIdFilters}
        onGoalIdFiltersChange={setGoalIdFilters}
        goalFilterOptions={goalFilterOptions}
        onOpenFilters={() => setFiltersOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onSearchQueryChange={setSearchQuery}
      />

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
          {error && goalViewOpen ? <div role="alert" className="flex items-center gap-3 text-sm text-destructive">
            <p>{error}</p><button type="button" className="underline" onClick={onGoalTimelineRetry}>Retry loading dates</button>
          </div> : null}
          <PlannerCalendarBoard
            loading={loading}
            viewMode={viewMode}
            goalView={
              goalViewOpen ? (goalViewVisible ? (
                <PlannerGoalPresentation
                  loading={loading}
                  onVisibleDate={onGoalTimelineVisibleDateChange}
                  onInspectDate={(date) => setExpandedPreviewDay(date)}
                  window={goalViewWindow!}
                  showPast={false}
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
              ) : <LoadingCard title="Opening Goal View..." description="Gathering your saved sessions." />) : null
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
            focusedDayEntries={focusedDayEntries}
            focusedDayCompletionFactMarkers={focusedDayCompletionFactMarkers}
            mutationLoadingKey={mutationLoadingKey}
            optimisticCompletionFacts={optimisticCompletionFacts}
            asOfDate={context?.asOfDate ?? null}
            canMutatePlanItems={canMutatePlanItems}
            canMutateEntryOnDay={canMutateEntryOnDay}
            onFocusedDayEntryOpen={(entryKey) => {
              const entry = focusedDayEntries.find(
                (candidate) => candidate.key === entryKey
              );
              if (
                !entry ||
                !canOpenPlannerEventDetails(entry) ||
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
                !canOpenPlannerEventDetails(entry) ||
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
            !canOpenPlannerEventDetails(entry) ||
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
        selectedEventLinkedTargets={selectedEventLinkedTargets}
        selectedEventGoal={selectedEventGoal}
        selectedEventPresentation={selectedEventPresentation}
        selectedEventProgress={dayChecklist.data.progress?.summaries.find(summary => summary.goalId === selectedEventGoal?.id) ?? null}
        goalTitles={context?.goalTitles ?? {}}
        scopeMonth={context?.scopeMonth ?? month ?? "1970-01"}
        selectedEventBaselineUnit={selectedEventBaselineUnit}
        selectedEventDraftScheduledDate={selectedEventDraftScheduledDate}
        selectedEventDraftTimeInputValue={selectedEventDraftTimeInputValue}
        canNavigateToFirstOpenInstance={canNavigateToFirstOpenInstance}
        canNavigateToPreviousOpenInstance={canNavigateToPreviousOpenInstance}
        canNavigateToNextOpenInstance={canNavigateToNextOpenInstance}
        canNavigateToLastOpenInstance={canNavigateToLastOpenInstance}
        eventDetailCallbacks={eventDetailCallbacks}
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
        hideTasks={hideTasks}
        onHideTasksChange={onHideTasksChange}
        tasksToggleDisabled={plannerReadOnly}
        showTasksToggle={!goalViewOpen}
        categoryFilters={categoryFilters}
        onCategoryFiltersChange={setCategoryFilters}
        categoryOptions={categoryOptions}
        endMonthFilters={effectiveEndMonthFilters}
        onEndMonthFiltersChange={setEndMonthFilters}
        endMonthOptions={endMonthOptions}
        showCompletedGoals={showCompletedGoals}
        onShowCompletedGoalsChange={setShowCompletedGoals}
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

  );
}
