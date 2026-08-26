"use client";

import { LoadingCard } from "@/components/ui/loading-card";
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
  PlannerContextPayload,
  PlannerDayDetailEntry,
} from "@/features/planner/calendar-surface.types";
import type { PlannerMoveSourceOption } from "@/features/planner/planner-move-source-options";
import type { PlannerWorkUnit } from "@cadence/shared/planner/context";
import type { ReactNode, RefObject } from "react";

export interface PlannerCalendarSurfaceLayoutProps {
  hasPlannerWarnings: boolean;
  warningsDismissed: boolean;
  showBlockingLoading: boolean;
  error: string | null;
  plannerWarningBannerCopy: string | null;
  warningsOpen: boolean;
  setWarningsOpen: (open: boolean) => void;
  unplaceableGoalSummaries: Array<{ goalId: string; title: string }>;
  invalidLockGoalCount: number;
  capacityWarningGoalCount: number;
  totalUnplacedCount: number;
  warningSuggestedNextSteps: string[];
  eligibilityNotices: {
    linkedTargetDetails: unknown;
  };
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
  searchQuery: string;
  savePlan: () => void;
  discardDraftChanges: () => void;
  setCalendarViewMode: (mode: PlannerCalendarViewMode) => void;
  setFiltersOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  partnerOverlayError?: string | null;
  month: string | null;
  previousWindowAriaLabel: string;
  nextWindowAriaLabel: string;
  fixedViewHeadingWidthCh: number;
  viewHeading: string;
  showTodayShortcut: boolean;
  expandedMonthRows: boolean;
  moveViewWindow: (direction: -1 | 1) => void;
  jumpToToday: () => void;
  setExpandedMonthRows: React.Dispatch<React.SetStateAction<boolean>>;
  getDragEntryLabel: (entryKey: string) => string;
  getDragDayLabel: (day: string) => string;
  renderEntryDragOverlay: () => ReactNode;
  handleDndEntryDragStart: (entryKey: string, day: string) => void;
  handleDndEntryDragEnd: (entryKey: string, day: string) => void;
  handleDndEntryDragCancel: () => void;
  rollingWeekStrip: ReactNode;
  focusedDay: string;
  focusedDayEntries: PlannerDayDetailEntry[];
  focusedDayCompletionFactMarkers: PlannerContextPayload["preview"] extends never
    ? never
    : unknown[];
  mutationLoadingKey: string | null;
  canMutatePlanItems: boolean;
  canMutateEntryOnDay: (entry: PlannerDayDetailEntry, day: string) => boolean;
  setLocalSelectedDay: (day: string | null) => void;
  setSelectedEventEntryKey: (key: string | null) => void;
  toggleDateFact: (
    entry: PlannerDayDetailEntry,
    day: string,
    sourceElement?: HTMLElement | null
  ) => Promise<void>;
  pointerPressActiveRef: RefObject<boolean>;
  calendarGridViewportRef: RefObject<HTMLDivElement | null>;
  handleCalendarGridViewportScroll: () => void;
  weekdayLabels: string[];
  multiMonthGridScrollRef: RefObject<HTMLDivElement | null>;
  handleMonthScopedGridScroll: () => void;
  cells: Array<{ date: string }>;
  renderCalendarDayCell: (day: string) => ReactNode;
  focusedWeekCells: Array<{ date: string }>;
  dayPreview: DayPreviewState | null;
  dayPreviewRef: RefObject<HTMLDivElement | null>;
  previewDayEntries: PlannerDayDetailEntry[];
  previewDayCompletionFactMarkers: unknown[];
  openMoveDialogForDay: (day: string) => void;
  setExpandedPreviewDay: (day: string | null) => void;
  setDayPreview: React.Dispatch<React.SetStateAction<DayPreviewState | null>>;
  clearHoverPreviewTimer: () => void;
  clearHoverPreviewCloseTimer: () => void;
  pointerInsideDayPreviewRef: RefObject<boolean>;
  coach: ReturnType<typeof usePlannerCoach>;
  expandedPreviewDay: string | null;
  expandedPreviewEntries: PlannerDayDetailEntry[];
  expandedPreviewCompletionFactMarkers: unknown[];
  contractExpandedPreview: () => void;
  moveDialogDay: string | null;
  effectiveMoveDialogSourceEntryKey: string;
  moveDialogSourceOptions: PlannerMoveSourceOption[];
  closeMoveDialog: () => void;
  setMoveDialogSourceEntryKey: (key: string) => void;
  submitMoveDialog: () => void;
  selectedEventEntry: PlannerDayDetailEntry | null;
  selectedEventLinkedTargets: unknown[];
  selectedEventDraftEdit:
    | { scheduledDate?: string | null; scheduledTimeOverride?: string | null }
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
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  categoryOptions: string[];
  effectiveEndMonthFilter: string | null;
  setEndMonthFilter: (value: string | null) => void;
  endMonthOptions: string[];
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
    searchQuery,
    savePlan,
    discardDraftChanges,
    setCalendarViewMode,
    setFiltersOpen,
    setSearchQuery,
    partnerOverlayError,
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
    handleDndEntryDragEnd,
    handleDndEntryDragCancel,
    rollingWeekStrip,
    focusedDay,
    focusedDayEntries,
    focusedDayCompletionFactMarkers,
    mutationLoadingKey,
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
    categoryFilter,
    setCategoryFilter,
    categoryOptions,
    effectiveEndMonthFilter,
    setEndMonthFilter,
    endMonthOptions,
    settingsOpen,
    plannerSettingsForm,
  } = props;

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
            previousWindowAriaLabel={previousWindowAriaLabel}
            nextWindowAriaLabel={nextWindowAriaLabel}
            fixedViewHeadingWidthCh={fixedViewHeadingWidthCh}
            viewHeading={viewHeading}
            showTodayShortcut={showTodayShortcut}
            expandedMonthRows={expandedMonthRows}
            onMoveViewWindow={moveViewWindow}
            onJumpToToday={jumpToToday}
            onToggleExpandedMonthRows={() =>
              setExpandedMonthRows((current) => !current)
            }
            getDragEntryLabel={getDragEntryLabel}
            getDragDayLabel={getDragDayLabel}
            renderEntryDragOverlay={renderEntryDragOverlay}
            onEntryDragStart={handleDndEntryDragStart}
            onEntryDragEnd={handleDndEntryDragEnd}
            onEntryDragCancel={handleDndEntryDragCancel}
            rollingWeekStrip={rollingWeekStrip}
            focusedDay={focusedDay}
            focusedDayEntries={focusedDayEntries}
            focusedDayCompletionFactMarkers={focusedDayCompletionFactMarkers}
            mutationLoadingKey={mutationLoadingKey}
            asOfDate={context?.asOfDate ?? null}
            canMutatePlanItems={canMutatePlanItems}
            canMutateEntryOnDay={canMutateEntryOnDay}
            onFocusedDayEntryOpen={(entryKey) => {
              const entry = focusedDayEntries.find(
                (candidate) => candidate.key === entryKey
              );
              if (!entry || !canMutateEntryOnDay(entry, focusedDay)) {
                return;
              }
              setLocalSelectedDay(focusedDay);
              setSelectedEventEntryKey(entry.key);
            }}
            onToggleCompletion={(entry, day, sourceElement) => {
              void toggleDateFact(entry, day, sourceElement);
            }}
            onEntryPointerStart={(immovable) => {
              void immovable;
              pointerPressActiveRef.current = true;
            }}
            onEntryPointerEnd={() => {
              pointerPressActiveRef.current = false;
            }}
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
              if (!entry || !canMutateEntryOnDay(entry, day)) {
                return;
              }
              setLocalSelectedDay(day);
              setSelectedEventEntryKey(entry.key);
            }}
            onPreviewToggleCompletion={(entry, day, sourceElement) => {
              if (!canMutateEntryOnDay(entry, day)) {
                return;
              }
              void toggleDateFact(entry, day, sourceElement);
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
          if (!entry || !canMutateEntryOnDay(entry, day)) {
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
          void toggleDateFact(entry, day, sourceElement);
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
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        categoryOptions={categoryOptions}
        endMonthFilter={effectiveEndMonthFilter}
        onEndMonthFilterChange={setEndMonthFilter}
        endMonthOptions={endMonthOptions}
        settingsOpen={settingsOpen}
        onSettingsOpenChange={setSettingsOpen}
        plannerSettingsForm={plannerSettingsForm}
      />
    </div>

  );
}
