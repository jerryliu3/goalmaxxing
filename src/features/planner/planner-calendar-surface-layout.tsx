"use client";

import { LoadingCard } from "@/components/ui/loading-card";
import {
  captureCalendarDayScreenTop,
  resolveMonthRowAnchorDay,
  restoreCalendarDayScreenTop,
} from "@/features/planner/calendar-scroll-position";
import { PlannerCoachPanel } from "@/features/planner/coach/planner-coach-panel";
import type { usePlannerCoach } from "@/features/planner/coach/use-planner-coach";
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
  showTasksInsteadOfGoals: boolean;
  onShowTasksInsteadOfGoalsChange: (value: boolean) => void;
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
  coach: ReturnType<typeof usePlannerCoach>;
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
  selectedEventDraftEdit:
    | {
        label?: string | null;
        scheduledDate?: string | null;
        scheduledTimeOverride?: string | null;
      }
    | undefined;
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
    showTasksInsteadOfGoals,
    onShowTasksInsteadOfGoalsChange,
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
    coach,
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
    selectedEventDraftEdit,
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
  const dayChecklist = usePlanDayChecklistModel({
    isActive: true,
    viewDate: focusedDay,
    searchQuery,
    asOfDate: context?.asOfDate ?? null,
    timezone: context?.timezone ?? null,
    endMonthFilters: effectiveEndMonthFilters,
    viewMode,
    plannerShowCompletedGoals: showCompletedGoals,
  });
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
        canOpenSettings={Boolean(context?.preferences)}
        linkedTargetDetails={eligibilityNotices.linkedTargetDetails}
        searchQuery={searchQuery}
        referenceMonth={month ?? focusedDay.slice(0, 7)}
        endMonthFilters={endMonthFilters}
        onEndMonthFiltersChange={setEndMonthFilters}
        onSave={savePlan}
        onDiscardDraftChanges={discardDraftChanges}
        onViewModeChange={setCalendarViewMode}
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
      ) : error ? (
        <div className="rounded-xl border bg-card p-6 text-sm text-destructive">
          {error}
        </div>
      ) : month ? (
        <>
          <PlannerCalendarBoard
            loading={loading}
            viewMode={viewMode}
            showTasksInsteadOfGoals={showTasksInsteadOfGoals}
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
              setSelectedEventEntryKey(entry.key);
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
              setSelectedEventEntryKey(entry.key);
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
            pinchDisabled={
              filtersOpen ||
              settingsOpen ||
              Boolean(moveDialogDay) ||
              Boolean(selectedEventEntry)
            }
          />

          <PlannerCoachPanel coach={coach} />
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
          setSelectedEventEntryKey(entry.key);
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
        selectedEventEntry={selectedEventEntry}
        selectedEventLinkedTargets={selectedEventLinkedTargets}
        goalTitles={context?.goalTitles ?? {}}
        scopeMonth={context?.scopeMonth ?? month ?? "1970-01"}
        selectedEventDraftEdit={selectedEventDraftEdit}
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
        showTasksInsteadOfGoals={showTasksInsteadOfGoals}
        onShowTasksInsteadOfGoalsChange={onShowTasksInsteadOfGoalsChange}
        tasksToggleDisabled={plannerReadOnly}
        categoryFilters={categoryFilters}
        onCategoryFiltersChange={setCategoryFilters}
        categoryOptions={categoryOptions}
        goalIdFilters={goalIdFilters}
        onGoalIdFiltersChange={setGoalIdFilters}
        goalFilterOptions={goalFilterOptions}
        endMonthFilters={effectiveEndMonthFilters}
        onEndMonthFiltersChange={setEndMonthFilters}
        endMonthOptions={endMonthOptions}
        showCompletedGoals={showCompletedGoals}
        onShowCompletedGoalsChange={setShowCompletedGoals}
        dayFilters={
          viewMode === "day" && dayChecklist
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
