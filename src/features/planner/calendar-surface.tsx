"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { allCategoriesValue } from "@/features/goals/goal-filters";
import {
  buildWeekdayLabels,
  getEntryGoalFirstTitleWithTime,
  normalizeWeekStartsOn,
} from "@/features/planner/calendar-format";
import { useCompletionMutation } from "@/features/planner/use-completion-mutation";
import { useCalendarDraftState } from "@/features/planner/use-calendar-draft-moves";
import { useCalendarSurfaceCoachSession } from "@/features/planner/use-calendar-surface-coach-session";
import {
  useCalendarSurfaceDayEntryViews,
  useCalendarSurfaceSelectedEventState,
  useEffectiveMoveDialogSourceEntryKey,
} from "@/features/planner/use-calendar-surface-derived-state";
import { useCalendarSurfaceMoveSession } from "@/features/planner/use-calendar-surface-move-session";
import { useCalendarSurfacePresentation } from "@/features/planner/use-calendar-surface-presentation";
import {
  useCalendarSurfaceInteractionRefs,
  useCalendarSurfaceUiEffects,
} from "@/features/planner/use-calendar-surface-ui-effects";
import { getDateInTimezone, resolveUserTimezone } from "@/lib/dates/timezone";
import {
  invalidatePlannerRelatedTabCaches,
} from "@/lib/cache/planner-tab-cache";
import { usePlannerTabCacheInvalidation } from "@/lib/cache/use-planner-tab-cache-invalidation";
import type {
  CalendarSurfaceProps,
  DayPreviewState,
  PlannerContextPayload,
} from "@/features/planner/calendar-surface.types";
import {
  getNonPublishablePreviewMessage,
} from "@/features/planner/planner-save-availability";
import { buildMoveSourceOptions } from "@/features/planner/planner-move-source-options";
import { buildPlannerResetGoalOptions } from "@/features/planner/planner-reset-goal-options";
import { useCalendarCompletionControls } from "@/features/planner/use-calendar-completion-controls";
import { usePlannerCalendarModel } from "@/features/planner/use-planner-calendar-model";
import { useCalendarPlannerTasks } from "@/features/planner/use-calendar-planner-tasks";
import {
  buildCalendarVisibleDateWindow,
  selectCalendarViewWindowProjection,
} from "@/features/planner/calendar-view-projection";
import { usePlannerPersistenceActions } from "@/features/planner/use-planner-persistence-actions";
import { usePlannerDraftCommands } from "@/features/planner/use-planner-draft-commands";
import { usePlannerCalendarDnd } from "@/features/planner/use-planner-calendar-dnd";
import { getApiErrorMessage } from "@/lib/api/client";
import { toast } from "sonner";
import { plannerTaskIdFromEntry } from "@/features/planner/calendar-task-entries";
import { usePlannerContextLoader } from "@/features/planner/use-planner-context-loader";
import { usePlannerSetup } from "@/features/planner/use-planner-setup";
import { usePlannerPreviewSession } from "@/features/planner/use-planner-preview-session";
import { usePlannerDayPreviewInteractions } from "@/features/planner/use-planner-day-preview-interactions";
import { useCalendarScrollBehavior } from "@/features/planner/use-calendar-scroll-behavior";
import {
  useCalendarEventDetail,
  useCalendarViewNavigation,
} from "@/features/planner/use-calendar-view-navigation";
import { PlannerCalendarSurfaceLayout } from "@/features/planner/planner-calendar-surface-layout";


export function CalendarSurface({
  activeTab,
  month,
  selectedDay,
  viewMode,
  onMonthChange,
  onSelectedDayChange,
  onPlannerMutation,
  duoScope = "me",
  partnerCompletionMarkersByDate,
  partnerOverlayError,
}: CalendarSurfaceProps) {
  const [context, setContext] = useState<PlannerContextPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(allCategoriesValue);
  const [endMonthFilter, setEndMonthFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const {
    draftPolicy,
    setDraftPolicy,
    draftPreview,
    setDraftPreview,
    draftPreviewWindow,
    setDraftPreviewWindow,
    draftCommandState,
    dispatchDraftCommand,
    draftPolicyRef,
    clearDraftSession,
  } = useCalendarDraftState();
  const [selectedEventEntryKey, setSelectedEventEntryKey] = useState<string | null>(
    null
  );
  const [dayPreview, setDayPreview] = useState<DayPreviewState | null>(null);
  const [expandedPreviewDay, setExpandedPreviewDay] = useState<string | null>(null);
  const [moveDialogDay, setMoveDialogDay] = useState<string | null>(null);
  const [moveDialogSourceEntryKey, setMoveDialogSourceEntryKey] = useState<string>("");
  const [warningsOpen, setWarningsOpen] = useState(false);
  // Intentionally session-scoped for now; dismissal resets on page reload.
  const [warningsDismissed, setWarningsDismissed] = useState(false);
  const [localSelectedDay, setLocalSelectedDay] = useState<string | null>(null);
  const [expandedMonthRows, setExpandedMonthRows] = useState(false);
  const [previewEntryOrderByDay, setPreviewEntryOrderByDay] = useState<
    Record<string, string[]>
  >({});
  const [mutationLoadingKey, setMutationLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [setupTimezone, setSetupTimezone] = useState(resolveUserTimezone());
  const [setupWeekStartsOn, setSetupWeekStartsOn] = useState(1);
  const [setupRestWeekdays, setSetupRestWeekdays] = useState<number[]>([]);
  // Session-scoped like warning dismissal; default off until the user opts in.
  const [showTasksInsteadOfGoals, setShowTasksInsteadOfGoals] = useState(false);
  const {
    hoverPreviewTimerRef,
    hoverPreviewCloseTimerRef,
    longPressTimerRef,
    longPressTriggeredRef,
    pointerPressActiveRef,
    pointerInsideDayPreviewRef,
    lastTouchTapRef,
    suppressDayCellClickRef,
    calendarPreparedRef,
    skipInvalidationReloadRef,
    dayPreviewRef,
    rollingWeekStripRef,
    calendarGridViewportRef,
    multiMonthGridScrollRef,
    monthScrollAlignmentKeyRef,
    calendarHorizontalAlignmentKeyRef,
    isDayPreviewSurfaceTarget,
  } = useCalendarSurfaceInteractionRefs();

  const loadContext = usePlannerContextLoader({
    activeTab,
    month,
    selectedDay,
    viewMode,
    setupTimezone,
    setupWeekStartsOn,
    onMonthChange,
    setContext,
    setLoading,
    setError,
    setSetupTimezone,
    setSetupWeekStartsOn,
    setSetupRestWeekdays,
    draftPolicyRef,
    calendarPreparedRef,
  });

  useEffect(() => {
    if (activeTab !== "calendar") {
      calendarPreparedRef.current = false;
    }
  }, [activeTab]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadContext();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadContext]);

  const handlePlannerMutation = useCallback(() => {
    skipInvalidationReloadRef.current = true;
    invalidatePlannerRelatedTabCaches();
    onPlannerMutation();
  }, [onPlannerMutation]);

  const additionalProjectionDays = useMemo(
    () =>
      [
        localSelectedDay,
        expandedPreviewDay,
        moveDialogDay,
        dayPreview?.day ?? null,
      ].filter((day): day is string => Boolean(day)),
    [dayPreview?.day, expandedPreviewDay, localSelectedDay, moveDialogDay]
  );
  const calendarTodayForTasks =
    context?.asOfDate ??
    getDateInTimezone(new Date(), context?.timezone ?? setupTimezone);
  const calendarTaskQueryWindow = useMemo(() => {
    const projection = selectCalendarViewWindowProjection({
      month,
      selectedDay,
      calendarToday: calendarTodayForTasks,
      weekStartsOn: normalizeWeekStartsOn(
        context?.preferences?.defaultPolicy.weekStartsOn
      ),
      viewMode,
    });
    return buildCalendarVisibleDateWindow([
      ...projection.visibleDays,
      ...additionalProjectionDays,
    ]);
  }, [
    additionalProjectionDays,
    calendarTodayForTasks,
    context?.preferences?.defaultPolicy.weekStartsOn,
    month,
    selectedDay,
    viewMode,
  ]);
  const { taskEntriesByDate, completeTask, rescheduleTask } = useCalendarPlannerTasks({
    enabled: showTasksInsteadOfGoals && duoScope !== "partner",
    from: calendarTaskQueryWindow?.start ?? null,
    to: calendarTaskQueryWindow?.end ?? null,
  });
  const {
    currentScopeMonth,
    weekStartsOn,
    calendarToday,
    viewProjection,
    warningModel,
    draftSession,
    dayAccessors,
    saveAvailability,
    viewWindow,
    eligibilityNotices,
    linkedTargetIndexes,
  } = usePlannerCalendarModel({
    context,
    draftPreview,
    draftPolicy,
    draftCommandState,
    month,
    selectedDay,
    viewMode,
    setupTimezone,
    duoScope,
    categoryFilter,
    endMonthFilter,
    searchQuery,
    partnerCompletionMarkersByDate,
    previewEntryOrderByDay,
    additionalProjectionDays,
    calendarTaskEntriesByDate: taskEntriesByDate,
    showTasksInsteadOfGoals,
  });
  const {
    cells,
    cellByDate,
    focusedDay,
    focusedWeekDays,
    focusedWeekCells,
  } = viewProjection;
  const weekdayLabels = useMemo(
    () => buildWeekdayLabels(weekStartsOn),
    [weekStartsOn]
  );
  const {
    effectiveDraftPolicy,
    effectivePreview,
    draftSaveCommands,
    hasDraftSession,
    draftWindowWorkUnits,
    draftWindowUnitByEntryKey,
    draftSaveWindowResult,
    draftSaveWindow,
  } = draftSession;
  usePlannerTabCacheInvalidation(() => {
    if (activeTab !== "calendar") {
      return;
    }
    if (skipInvalidationReloadRef.current) {
      skipInvalidationReloadRef.current = false;
      return;
    }
    void loadContext({
      showLoading: false,
      forcePrepare: !hasDraftSession,
    });
  });
  const {
    entriesByDate,
    entryByKey,
    entryDayByKey,
    effectiveDraftItemEdits,
    unplaceableGoalSummaries,
    totalUnplacedCount,
    invalidLockGoalCount,
    capacityWarningGoalCount,
    categoryOptions,
    endMonthOptions,
    effectiveEndMonthFilter,
    getEntriesForDay,
    getCompletionFactMarkersForDay,
    getOrderedEntriesForDay,
    canMutateEntryOnDay,
    plannerReadOnly,
  } = dayAccessors;
  const effectiveSelectedDay = localSelectedDay;
  const {
    selectedEventEntry,
    selectedEventDraftEdit,
    selectedEventBaselineUnit,
    selectedEventDraftScheduledDate,
    selectedEventDraftTimeInputValue,
    selectedEventLinkedTargets,
  } = useCalendarSurfaceSelectedEventState({
    selectedEventEntryKey,
    entryByKey,
    effectiveDraftItemEdits,
    draftWindowUnitByEntryKey,
    effectiveSelectedDay,
    linkedTargetIndexes,
  });

  const {
    pendingMonthAlignment,
    setPendingMonthAlignment,
    monthScrollAnchorDay,
    resolveMonthScopedTopRowDay,
    resolveWeekdayAlignedAnchorDay,
    navigateToOpenInstance,
    jumpToToday: jumpToTodayBase,
    moveViewWindow: moveViewWindowBase,
    setCalendarViewMode,
  } = useCalendarViewNavigation({
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
    multiMonthGridScrollRef,
    monthScrollAlignmentKeyRef,
    calendarHorizontalAlignmentKeyRef,
  });

  const {
    showTodayShortcut,
    queueTodayShortcutVisibilitySync,
    handleMonthScopedGridScroll,
    handleCalendarGridViewportScroll,
  } = useCalendarScrollBehavior({
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
  });

  const {
    selectedGoalOpenInstances,
    selectedGoalOpenInstanceIndex,
    canNavigateToFirstOpenInstance,
    canNavigateToPreviousOpenInstance,
    canNavigateToNextOpenInstance,
    canNavigateToLastOpenInstance,
  } = useCalendarEventDetail({
    selectedEventEntry,
    selectedEventEntryKey,
    entriesByDate,
  });

  const {
    focusedDayEntries,
    focusedDayCompletionFactMarkers,
    previewDayEntries,
    previewDayCompletionFactMarkers,
    expandedPreviewEntries,
    expandedPreviewCompletionFactMarkers,
    moveDialogEntriesForTargetDay,
  } = useCalendarSurfaceDayEntryViews({
    focusedDay,
    dayPreviewDay: dayPreview?.day ?? null,
    expandedPreviewDay,
    moveDialogDay,
    getOrderedEntriesForDay,
    getCompletionFactMarkersForDay,
  });
  const scopeMonth = context?.scopeMonth ?? null;
  const {
    queueDraftMoveCommand,
    updateDraftLabel,
    updateDraftScheduledDate,
    updateDraftScheduledTimeOverride,
  } = usePlannerDraftCommands({
    context,
    scopeMonth,
    currentScopeMonth,
    draftWindowWorkUnits,
    draftWindowUnitByEntryKey,
    effectiveDraftItemEdits,
    draftSaveCommands,
    draftCommandState,
    dispatchDraftCommand,
  });
  const moveDialogSourceOptions = useMemo(
    () =>
      buildMoveSourceOptions({
        targetDay: moveDialogDay,
        scopeMonth,
        moveDialogEntriesForTargetDay,
        entriesByDate,
        draftWindowUnitByEntryKey,
        canMutateEntryOnDay,
        getEntryGoalFirstTitleWithTime,
      }),
    [
      canMutateEntryOnDay,
      draftWindowUnitByEntryKey,
      entriesByDate,
      moveDialogDay,
      moveDialogEntriesForTargetDay,
      scopeMonth,
    ]
  );
  const effectiveMoveDialogSourceEntryKey = useEffectiveMoveDialogSourceEntryKey({
    moveDialogSourceEntryKey,
    moveDialogSourceOptions,
  });
  const {
    warningSuggestedNextSteps,
    hasPlannerWarnings,
    plannerWarningSeverity,
    plannerWarningBannerCopy,
  } = warningModel;
  const {
    draftSaveBlocked,
    draftSaveBlockedMessage,
    rebuildBlockedMessage,
    canResetPlan,
    canRecoverPastSessions,
    hasUnsavedPlannerChanges,
    canShowSaveAction,
  } = saveAvailability;
  const {
    resolvedFocusedDay,
    viewHeading,
    fixedViewHeadingWidthCh,
    previousWindowAriaLabel,
    nextWindowAriaLabel,
    stepDays,
  } = viewWindow;
  useCalendarSurfaceUiEffects({
    plannerWarningSeverity,
    dayPreview,
    hoverPreviewTimerRef,
    hoverPreviewCloseTimerRef,
    longPressTimerRef,
    pointerPressActiveRef,
    pointerInsideDayPreviewRef,
    setWarningsDismissed,
  });

  const dayPreviewInteractions = usePlannerDayPreviewInteractions({
    dayPreview,
    setDayPreview,
    setExpandedPreviewDay,
    setMoveDialogDay,
    setMoveDialogSourceEntryKey,
    setSelectedEventEntryKey,
    setLocalSelectedDay,
    onSelectedDayChange,
    hoverPreviewTimerRef,
    hoverPreviewCloseTimerRef,
    longPressTimerRef,
    longPressTriggeredRef,
    pointerPressActiveRef,
    pointerInsideDayPreviewRef,
    lastTouchTapRef,
    suppressDayCellClickRef,
    dayPreviewRef,
    isDayPreviewSurfaceTarget,
  });
  const {
    clearHoverPreviewTimer,
    clearHoverPreviewCloseTimer,
    openMoveDialogForDay,
  } = dayPreviewInteractions;

  const {
    recoverLoading,
    requestPreviewForWindow,
    refreshDraftPreview,
    applyPolicyReplanMoves,
    recoverPastSessions,
    clearDraftMoveCommands,
    cacheDraftPreviewForWindow,
  } = usePlannerPreviewSession({
    context,
    effectivePreview,
    effectiveDraftPolicy,
    draftSaveWindow,
    draftSaveWindowResult,
    draftWindowWorkUnits,
    draftCommandState,
    draftSaveCommands,
    dispatchDraftCommand,
    setDraftPreview,
    setDraftPreviewWindow,
  });

  const nonPublishablePreviewMessage = useCallback(
    (preview: NonNullable<PlannerContextPayload["preview"]>) =>
      getNonPublishablePreviewMessage({
        preview,
        context,
        draftSaveWindow,
      }),
    [context, draftSaveWindow]
  );
  const { setupLoading, submitSetup } = usePlannerSetup({
    setupTimezone,
    setupWeekStartsOn,
    setupRestWeekdays,
    month,
    onMonthChange,
    clearDraftSession,
    handlePlannerMutation,
    loadContext,
    setSettingsOpen,
  });

  const runCompletionMutation = useCompletionMutation();
  const coach = useCalendarSurfaceCoachSession({
    activeTab,
    context,
    entriesByDate,
    effectivePreview,
    effectiveDraftPolicy,
    hasDraftSession,
    handlePlannerMutation,
    loadContext,
    refreshDraftPreview,
    applyPolicyReplanMoves,
    queueDraftMoveCommand,
    clearDraftMoveCommands,
    setDraftPolicy,
    setSetupRestWeekdays,
    draftSaveWindow,
    nonPublishablePreviewMessage,
  });

  const {
    draggingEntryKey,
    getDragEntryLabel,
    getDragDayLabel,
    renderEntryDragOverlay,
    handleDndEntryDragStart,
    handleDndEntryDragEnd,
    handleDndEntryDragCancel,
  } = usePlannerCalendarDnd({
    entryByKey,
    entryDayByKey,
    getEntriesForDay,
    getEntryGoalFirstTitleWithTime,
    setPreviewEntryOrderByDay,
    queueDraftMoveCommand,
    rescheduleCalendarTask: async (entry, nextDate) => {
      const taskId = plannerTaskIdFromEntry(entry);
      if (!taskId) {
        return;
      }
      try {
        await rescheduleTask(taskId, nextDate);
        handlePlannerMutation();
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not reschedule the task."));
      }
    },
    clearHoverPreviewTimer,
    pointerPressActiveRef,
  });
  const { canMutatePlanItems, toggleItemLock, toggleDateFact } =
    useCalendarCompletionControls({
      context,
      hasDraftSession,
      draftSaveCommands,
      effectiveDraftPolicy,
      effectiveDraftItemEdits,
      effectiveSelectedDay,
      setMutationLoadingKey,
      runCompletionMutation,
      handlePlannerMutation,
      loadContext,
      refreshDraftPreview,
      completePlannerTask: completeTask,
    });

  const { closeMoveDialog, submitMoveDialog, contractExpandedPreview } =
    useCalendarSurfaceMoveSession({
      moveDialogDay,
      setMoveDialogDay,
      setMoveDialogSourceEntryKey,
      effectiveMoveDialogSourceEntryKey,
      moveDialogSourceOptions,
      queueDraftMoveCommand,
      expandedPreviewDay,
      setExpandedPreviewDay,
      dayPreviewInteractions,
    });

  const {
    saveLoading,
    resetLoading,
    fullResetLoading,
    goalResetLoading,
    rebuildLoading,
    savePlan,
    resetPlan,
    resetPlanFully,
    resetPlanForGoals,
    rebuildSchedule,
    discardDraftChanges,
  } = usePlannerPersistenceActions({
      context,
      month,
      hasDraftSession,
      draftSaveWindow,
      draftSaveWindowResult,
      draftSaveCommands,
      effectiveDraftPolicy,
      draftPreview,
      draftPreviewWindow,
      clearDraftSession,
      handlePlannerMutation,
      loadContext,
      cacheDraftPreviewForWindow,
      requestPreviewForWindow,
      coachActions: coach.actions,
    });

  const resetGoalOptions = useMemo(
    () =>
      buildPlannerResetGoalOptions(context?.activePlan?.goals, context?.asOfDate ?? ""),
    [context?.activePlan?.goals, context?.asOfDate]
  );
  const layoutProps = useCalendarSurfacePresentation({
    saveLoading,
    jumpToTodayBase,
    queueTodayShortcutVisibilitySync,
    moveViewWindowBase,
    resolvedFocusedDay,
    stepDays,
    expandedMonthRows,
    draggingEntryKey,
    calendarToday,
    plannerReadOnly,
    onSelectedDayChange,
    setLocalSelectedDay,
    setSelectedEventEntryKey,
    setDayPreview,
    canMutateEntryOnDay,
    getOrderedEntriesForDay,
    getCompletionFactMarkersForDay,
    cells,
    focusedWeekCells,
    dayPreviewInteractions,
    rollingWeekStripRef,
    focusedWeekDays,
    setupRestWeekdays,
    setSetupRestWeekdays,
    showTasksInsteadOfGoals,
    onShowTasksInsteadOfGoalsChange: setShowTasksInsteadOfGoals,
    setupLoading,
    recoverLoading,
    canRecoverPastSessions,
    rebuildBlockedMessage,
    fullResetLoading,
    goalResetLoading,
    openGoals: resetGoalOptions,
    submitSetup,
    recoverPastSessions,
    rebuildSchedule,
    resetPlanFully,
    resetPlanForGoals,
    updateDraftLabel,
    updateDraftScheduledDate,
    updateDraftScheduledTimeOverride,
    toggleItemLock,
    navigateToOpenInstance,
    selectedGoalOpenInstances,
    selectedGoalOpenInstanceIndex,
    hasPlannerWarnings,
    warningsDismissed,
    setWarningsDismissed,
    showBlockingLoading: loading && context === null,
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
    canResetPlan,
    resetLoading,
    loading,
    resetPlan,
    setSettingsOpen,
    hasDraftSession,
    canShowSaveAction,
    draftSaveBlockedMessage,
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
    setExpandedMonthRows,
    getDragEntryLabel,
    getDragDayLabel,
    renderEntryDragOverlay,
    handleDndEntryDragStart,
    handleDndEntryDragEnd,
    handleDndEntryDragCancel,
    focusedDay,
    focusedDayEntries,
    focusedDayCompletionFactMarkers,
    mutationLoadingKey,
    canMutatePlanItems,
    toggleDateFact,
    pointerPressActiveRef,
    calendarGridViewportRef,
    handleCalendarGridViewportScroll,
    weekdayLabels,
    multiMonthGridScrollRef,
    handleMonthScopedGridScroll,
    dayPreview,
    dayPreviewRef,
    pointerInsideDayPreviewRef,
    previewDayEntries,
    previewDayCompletionFactMarkers,
    openMoveDialogForDay,
    setExpandedPreviewDay,
    clearHoverPreviewTimer,
    clearHoverPreviewCloseTimer,
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
    filtersOpen,
    categoryFilter,
    setCategoryFilter,
    categoryOptions,
    effectiveEndMonthFilter,
    setEndMonthFilter,
    endMonthOptions,
    settingsOpen,
    rebuildLoading,
  });

  return <PlannerCalendarSurfaceLayout {...layoutProps} />;
}
