"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useReportAppSurfaceReady } from "@/components/layout/app-boot-ready";
import {
  buildWeekdayLabels,
  getEntryGoalFirstTitleWithTime,
  isEntryCredited,
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
import {
  CompletionCreditMoveProvider,
  type CreditMoveDraftArgs,
} from "@/features/planner/completion-credit-move";
import { useCalendarSurfaceMoveSession } from "@/features/planner/use-calendar-surface-move-session";
import { useCalendarSurfacePresentation } from "@/features/planner/use-calendar-surface-presentation";
import {
  useCalendarSurfaceInteractionRefs,
  useCalendarSurfaceUiEffects,
} from "@/features/planner/use-calendar-surface-ui-effects";
import { getDateInTimezone, resolveUserTimezone } from "@/lib/dates/timezone";
import {
  buildPlannerContextCacheKey,
  invalidatePlannerRelatedTabCaches,
} from "@/lib/cache/planner-tab-cache";
import { readTabDataCache } from "@/lib/cache/tab-data-cache";
import { usePlannerTabCacheInvalidation } from "@/lib/cache/use-planner-tab-cache-invalidation";
import type {
  CalendarSurfaceProps,
  DayPreviewState,
  PlannerContextPayload,
  PlannerDayDetailEntry,
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
import { persistImmediatePlannerMove } from "@/lib/planner/persist-immediate-move";
import { canConfirmDraftMove, resolveStagedDraftMove } from "@/features/planner/draft-move-confirm";
import {
  pruneOptimisticCompletionFacts,
  type OptimisticCompletionFacts,
} from "@/lib/planner/optimistic-completion-facts";


export function CalendarSurface({
  activeTab,
  month,
  selectedDay,
  viewMode: routeViewMode,
  onMonthChange,
  onSelectedDayChange,
  onPlannerMutation,
  duoScope = "me",
  partnerCompletionMarkersByDate,
  partnerOverlayError,
  partnerLabel = null,
  viewerSubject = null,
  partnerSubject = null,
}: CalendarSurfaceProps) {
  const [context, setContext] = useState<PlannerContextPayload | null>(() => {
    if (!month) {
      return null;
    }
    return readTabDataCache<PlannerContextPayload>(buildPlannerContextCacheKey(month));
  });
  useLayoutEffect(() => {
    if (!month) {
      return;
    }
    const cached = readTabDataCache<PlannerContextPayload>(
      buildPlannerContextCacheKey(month)
    );
    if (!cached) {
      return;
    }
    setContext(cached);
  }, [month]);
  const [loading, setLoading] = useState(() => {
    if (!month) {
      return false;
    }
    return (
      readTabDataCache<PlannerContextPayload>(buildPlannerContextCacheKey(month)) ===
      null
    );
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [goalIdFilters, setGoalIdFilters] = useState<string[]>([]);
  const [calendarFocusedGoalId, setCalendarFocusedGoalId] = useState<string | null>(
    null
  );
  const [endMonthFilters, setEndMonthFilters] = useState<string[]>([]);
  const [showCompletedGoals, setShowCompletedGoals] = useState(false);
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
  const [viewMode, setViewMode] = useState(routeViewMode);
  const committedViewModeRef = useRef(routeViewMode);
  const commitViewMode = useCallback((nextViewMode: typeof routeViewMode) => {
    committedViewModeRef.current = nextViewMode;
    setViewMode(nextViewMode);
  }, []);
  useEffect(() => {
    if (routeViewMode === committedViewModeRef.current) {
      return;
    }
    committedViewModeRef.current = routeViewMode;
    setViewMode(routeViewMode);
  }, [routeViewMode]);
  useEffect(() => {
    const resetTimer = window.setTimeout(() => setLocalSelectedDay(null), 0);
    return () => window.clearTimeout(resetTimer);
  }, [month, selectedDay, viewMode]);
  useEffect(() => {
    const resetTimer = window.setTimeout(() => setCalendarFocusedGoalId(null), 0);
    return () => window.clearTimeout(resetTimer);
  }, [month]);
  const [expandedMonthRows, setExpandedMonthRows] = useState(false);
  const [previewEntryOrderByDay, setPreviewEntryOrderByDay] = useState<
    Record<string, string[]>
  >({});
  const [mutationLoadingKey, setMutationLoadingKey] = useState<string | null>(null);
  const [optimisticCompletionFacts, setOptimisticCompletionFacts] =
    useState<OptimisticCompletionFacts>(() => new Map());
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
    selectedDay: localSelectedDay ?? selectedDay,
    viewMode,
    setupTimezone,
    duoScope,
    categoryFilters: viewMode === "day" ? [] : categoryFilters,
    goalIdFilters: viewMode === "day" ? [] : goalIdFilters,
    endMonthFilters,
    searchQuery,
    partnerCompletionMarkersByDate,
    previewEntryOrderByDay,
    additionalProjectionDays,
    calendarTaskEntriesByDate: taskEntriesByDate,
    showTasksInsteadOfGoals,
    showCompletedGoals: viewMode === "day" ? true : showCompletedGoals,
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
    goalFilterOptions,
    endMonthOptions,
    effectiveEndMonthFilters,
    getEntriesForDay,
    getCompletionFactMarkersForDay,
    getOrderedEntriesForDay,
    canMutateEntryOnDay,
    plannerReadOnly,
  } = dayAccessors;
  useEffect(() => {
    setOptimisticCompletionFacts((overlay) =>
      pruneOptimisticCompletionFacts(overlay, (goalId, date) => {
        const creditedOnDay = getOrderedEntriesForDay(date).some(
          (entry) => entry.originalGoalId === goalId && isEntryCredited(entry)
        );
        if (creditedOnDay) {
          return true;
        }
        return getCompletionFactMarkersForDay(date).some(
          (marker) => marker.originalGoalId === goalId && marker.owner !== "partner"
        );
      })
    );
  }, [getCompletionFactMarkersForDay, getOrderedEntriesForDay]);
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
    onRenderedViewModeChange: commitViewMode,
    multiMonthGridScrollRef,
    monthScrollAlignmentKeyRef,
    calendarHorizontalAlignmentKeyRef,
  });

  const {
    showTodayShortcut,
    handleMonthScopedGridScroll,
    handleCalendarGridViewportScroll,
  } = useCalendarScrollBehavior({
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
    handleDndEntryDragOver,
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
      setOptimisticCompletionFacts,
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
  const confirmStagedDraftMove = useCallback(
    async (entry: PlannerDayDetailEntry, day: string) => {
      if (!context) {
        toast.error("Planner context is unavailable.");
        return;
      }
      const resolvedMove = resolveStagedDraftMove(entry, day);
      if (!resolvedMove) {
        toast.error("This draft move is no longer available.");
        return;
      }
      setMutationLoadingKey(entry.key);
      try {
        await persistImmediatePlannerMove({
          context,
          goalId: entry.originalGoalId,
          unitKey: entry.unitKey,
          sourceDate: resolvedMove.sourceDate,
          scheduledDate: resolvedMove.scheduledDate,
        });
        handlePlannerMutation();
        const loaded = await loadContext({ showLoading: false, toastOnError: false });
        if (loaded) {
          dispatchDraftCommand({
            type: "remove_kind",
            kind: "move_item",
            goalId: entry.originalGoalId,
            unitKey: entry.unitKey,
          });
          setDraftPreview(null);
          setDraftPreviewWindow(null);
        }
        toast.success("Session move saved.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "The session could not be moved."
        );
      } finally {
        setMutationLoadingKey(null);
      }
    },
    [context, dispatchDraftCommand, handlePlannerMutation, loadContext]
  );
  const cancelStagedDraftMove = useCallback(
    (entry: PlannerDayDetailEntry) => {
      if (!canConfirmDraftMove(entry)) {
        toast.error("This draft move is no longer available.");
        return;
      }
      clearDraftMoveCommands([`${entry.originalGoalId}:${entry.unitKey}`]);
    },
    [clearDraftMoveCommands]
  );
  const layoutProps = useCalendarSurfacePresentation({
    saveLoading,
    jumpToTodayBase,
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
    selectedEventEntryKey,
    setCalendarFocusedGoalId,
    calendarFocusedGoalId,
    calendarAsOfDate: context?.asOfDate ?? calendarToday,
    setDayPreview,
    canMutateEntryOnDay,
    getOrderedEntriesForDay,
    getCompletionFactMarkersForDay,
    cells,
    focusedWeekCells,
    dayPreviewInteractions,
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
    partnerLabel,
    viewerSubject,
    partnerSubject,
    duoScope,
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
    handleDndEntryDragOver,
    handleDndEntryDragEnd,
    handleDndEntryDragCancel,
    focusedDay,
    focusedDayEntries,
    focusedDayCompletionFactMarkers,
    mutationLoadingKey,
    optimisticCompletionFacts,
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
    onConfirmDraftMove: confirmStagedDraftMove,
    onCancelDraftMove: cancelStagedDraftMove,
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
    categoryFilters,
    setCategoryFilters,
    goalIdFilters,
    setGoalIdFilters,
    categoryOptions,
    goalFilterOptions,
    effectiveEndMonthFilters,
    endMonthFilters,
    setEndMonthFilters,
    endMonthOptions,
    showCompletedGoals,
    setShowCompletedGoals,
    settingsOpen,
    rebuildLoading,
  });

  const queueCreditMoveDraft = useCallback(
    ({ goalId, unitKey, sourceDate, scheduledDate }: CreditMoveDraftArgs) => {
      const sameDay = entriesByDate.get(sourceDate) ?? [];
      const entry =
        sameDay.find(
          (candidate) =>
            candidate.originalGoalId === goalId &&
            candidate.unitKey === unitKey &&
            !candidate.draftGhost
        ) ??
        [...entriesByDate.values()]
          .flat()
          .find(
            (candidate) =>
              candidate.originalGoalId === goalId &&
              candidate.unitKey === unitKey &&
              !candidate.draftGhost
          );
      if (!entry) {
        toast.error("That planned session is not in this calendar window.");
        return false;
      }
      return queueDraftMoveCommand({
        entry,
        nextDate: scheduledDate,
        source: "date_input",
      });
    },
    [entriesByDate, queueDraftMoveCommand]
  );

  useReportAppSurfaceReady(Boolean(error) || (context !== null && !loading));

  return (
    <CompletionCreditMoveProvider
      context={context}
      viewMode={viewMode}
      onDraftMove={queueCreditMoveDraft}
      onMoved={async () => {
        handlePlannerMutation();
        await loadContext({ showLoading: false, toastOnError: false });
      }}
    >
      <PlannerCalendarSurfaceLayout {...layoutProps} />
    </CompletionCreditMoveProvider>
  );
}
