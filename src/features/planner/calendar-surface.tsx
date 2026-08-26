"use client";

import { format, isValid, parse } from "date-fns";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { allCategoriesValue } from "@/features/goals/goal-filters";
import {
  buildWeekdayLabels,
  getEntryGoalFirstTitleWithTime,
} from "@/features/planner/calendar-format";
import { usePlannerCoach } from "@/features/planner/coach/use-planner-coach";
import type { PlannerCoachBindings } from "@/features/planner/coach/coach-types";
import {
  buildPlannerCoachBindings,
  refreshPlannerAfterCoachGoalsCreated,
} from "@/features/planner/planner-coach-surface-bindings";
import { useCompletionMutation } from "@/features/planner/use-completion-mutation";
import { useCalendarDraftState } from "@/features/planner/use-calendar-draft-moves";
import { resolveUserTimezone } from "@/lib/dates/timezone";
import {
  invalidatePlannerRelatedTabCaches,
} from "@/lib/cache/planner-tab-cache";
import { usePlannerTabCacheInvalidation } from "@/lib/cache/use-planner-tab-cache-invalidation";
import {
  type PlannerPolicy,
} from "@/lib/planner/policy";
import type {
  CalendarSurfaceProps,
  DayPreviewState,
  PlannerContextPayload,
} from "@/features/planner/calendar-surface.types";
import {
  getNonPublishablePreviewMessage,
} from "@/features/planner/planner-save-availability";
import { buildMoveSourceOptions } from "@/features/planner/planner-move-source-options";
import { PlannerRollingWeekStrip } from "@/features/planner/planner-rolling-week-strip";
import { useCalendarCompletionControls } from "@/features/planner/use-calendar-completion-controls";
import { usePlannerCalendarModel } from "@/features/planner/use-planner-calendar-model";
import { usePlannerPersistenceActions } from "@/features/planner/use-planner-persistence-actions";
import { usePlannerDraftCommands } from "@/features/planner/use-planner-draft-commands";
import { usePlannerCalendarDnd } from "@/features/planner/use-planner-calendar-dnd";
import { usePlannerMoveSessionDialog } from "@/features/planner/use-planner-move-session-dialog";
import { usePlannerCalendarDayCellRenderer } from "@/features/planner/use-planner-calendar-day-cell-renderer";
import { usePlannerContextLoader } from "@/features/planner/use-planner-context-loader";
import { usePlannerSetup } from "@/features/planner/use-planner-setup";
import { usePlannerPreviewSession } from "@/features/planner/use-planner-preview-session";
import { usePlannerDayPreviewInteractions } from "@/features/planner/use-planner-day-preview-interactions";
import { useCalendarScrollBehavior } from "@/features/planner/use-calendar-scroll-behavior";
import {
  useCalendarEventDetail,
  useCalendarViewNavigation,
} from "@/features/planner/use-calendar-view-navigation";
import {
  buildCalendarSurfaceLayoutProps,
  PlannerCalendarSurfaceLayout,
} from "@/features/planner/planner-calendar-surface-layout";
import {
  buildPlannerSettingsForm,
  usePlannerEventDetailCallbacks,
} from "@/features/planner/planner-calendar-overlay-bindings";


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
  const draftPolicyRef = useRef<PlannerPolicy | null>(null);
  const hoverPreviewTimerRef = useRef<number | null>(null);
  const hoverPreviewCloseTimerRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pointerPressActiveRef = useRef(false);
  const pointerInsideDayPreviewRef = useRef(false);
  const lastTouchTapRef = useRef<{ day: string; at: number } | null>(null);
  const suppressDayCellClickRef = useRef<{ day: string; active: boolean } | null>(null);
  const calendarPreparedRef = useRef(false);
  const skipInvalidationReloadRef = useRef(false);
  const dayPreviewRef = useRef<HTMLDivElement | null>(null);
  const rollingWeekStripRef = useRef<HTMLDivElement | null>(null);
  const calendarGridViewportRef = useRef<HTMLDivElement | null>(null);
  const multiMonthGridScrollRef = useRef<HTMLDivElement | null>(null);
  const monthScrollAlignmentKeyRef = useRef<string | null>(null);
  const calendarHorizontalAlignmentKeyRef = useRef<string | null>(null);
  const isDayPreviewSurfaceTarget = (target: Element) =>
    Boolean(target.closest('[data-day-cell="true"]')) ||
    Boolean(dayPreviewRef.current?.contains(target));

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
  const selectedEventEntry = selectedEventEntryKey
    ? entryByKey.get(selectedEventEntryKey) ?? null
    : null;
  const selectedEventDraftEdit = selectedEventEntry
    ? effectiveDraftItemEdits[selectedEventEntry.key]
    : undefined;
  const selectedEventBaselineUnit = selectedEventEntry
    ? draftWindowUnitByEntryKey.get(selectedEventEntry.key) ?? null
    : null;
  const selectedEventDraftScheduledDate =
    selectedEventDraftEdit?.scheduledDate ??
    selectedEventEntry?.activeItem?.scheduled_date ??
    effectiveSelectedDay ??
    null;

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

  const selectedEventDraftTimeInputValue =
    selectedEventDraftEdit?.scheduledTimeOverride === null
      ? ""
      : selectedEventDraftEdit?.scheduledTimeOverride ??
        selectedEventBaselineUnit?.scheduledTimeOverride ??
        "";
  const focusedDayEntries = useMemo(
    () => getOrderedEntriesForDay(focusedDay),
    [focusedDay, getOrderedEntriesForDay]
  );
  const focusedDayCompletionFactMarkers = useMemo(
    () => getCompletionFactMarkersForDay(focusedDay),
    [focusedDay, getCompletionFactMarkersForDay]
  );
  const previewDayEntries = useMemo(
    () => getOrderedEntriesForDay(dayPreview?.day ?? null),
    [dayPreview?.day, getOrderedEntriesForDay]
  );
  const previewDayCompletionFactMarkers = useMemo(
    () => getCompletionFactMarkersForDay(dayPreview?.day ?? null),
    [dayPreview?.day, getCompletionFactMarkersForDay]
  );
  const expandedPreviewEntries = useMemo(
    () => getOrderedEntriesForDay(expandedPreviewDay),
    [expandedPreviewDay, getOrderedEntriesForDay]
  );
  const expandedPreviewCompletionFactMarkers = useMemo(
    () => getCompletionFactMarkersForDay(expandedPreviewDay),
    [expandedPreviewDay, getCompletionFactMarkersForDay]
  );
  const moveDialogEntriesForTargetDay = useMemo(
    () => getOrderedEntriesForDay(moveDialogDay),
    [getOrderedEntriesForDay, moveDialogDay]
  );
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
  const effectiveMoveDialogSourceEntryKey = useMemo(() => {
    if (
      moveDialogSourceEntryKey &&
      moveDialogSourceOptions.some(
        (option) => option.entryKey === moveDialogSourceEntryKey
      )
    ) {
      return moveDialogSourceEntryKey;
    }
    return moveDialogSourceOptions[0]?.entryKey ?? "";
  }, [moveDialogSourceEntryKey, moveDialogSourceOptions]);
  const selectedEventLinkedTargets = useMemo(
    () =>
      selectedEventEntry
        ? linkedTargetIndexes.linksBySourceGoalId.get(
            selectedEventEntry.originalGoalId
          ) ?? []
        : [],
    [linkedTargetIndexes.linksBySourceGoalId, selectedEventEntry]
  );
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
  const previousWarningSeverityRef = useRef(plannerWarningSeverity);
  useEffect(() => {
    if (
      plannerWarningSeverity === "actionable" &&
      previousWarningSeverityRef.current !== "actionable"
    ) {
      setWarningsDismissed(false);
    }
    previousWarningSeverityRef.current = plannerWarningSeverity;
  }, [plannerWarningSeverity]);
  useEffect(
    () => () => {
      if (hoverPreviewTimerRef.current) {
        window.clearTimeout(hoverPreviewTimerRef.current);
      }
      if (hoverPreviewCloseTimerRef.current) {
        window.clearTimeout(hoverPreviewCloseTimerRef.current);
      }
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    const clearPointerPress = () => {
      pointerPressActiveRef.current = false;
    };
    window.addEventListener("pointerup", clearPointerPress);
    window.addEventListener("pointercancel", clearPointerPress);
    window.addEventListener("blur", clearPointerPress);
    return () => {
      window.removeEventListener("pointerup", clearPointerPress);
      window.removeEventListener("pointercancel", clearPointerPress);
      window.removeEventListener("blur", clearPointerPress);
    };
  }, []);

  useEffect(() => {
    if (!dayPreview) {
      pointerInsideDayPreviewRef.current = false;
    }
  }, [dayPreview]);

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
  const handleCoachGoalsCreated = useCallback(async () => {
    await refreshPlannerAfterCoachGoalsCreated({
      handlePlannerMutation,
      loadContext,
    });
  }, [handlePlannerMutation, loadContext]);
  const coachBindings: PlannerCoachBindings = buildPlannerCoachBindings({
    refreshDraftPreview,
    applyPolicyReplanMoves,
    queueDraftMoveCommand,
    clearDraftMoveCommands,
    setDraftPolicy,
    setSetupRestWeekdays,
    draftSaveWindow,
    nonPublishablePreviewMessage,
  });
  const coach = usePlannerCoach({
    activeTab,
    context,
    entriesByDate,
    effectivePreview,
    effectiveDraftPolicy,
    hasDraftSession,
    onGoalsCreated: handleCoachGoalsCreated,
    ...coachBindings,
  });

  const isValidIsoDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }
    const parsed = parse(value, "yyyy-MM-dd", new Date());
    return isValid(parsed) && format(parsed, "yyyy-MM-dd") === value;
  };

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
    });

  const closeMoveDialog = () => {
    setMoveDialogDay(null);
    setMoveDialogSourceEntryKey("");
  };

  const { submitMoveDialog } = usePlannerMoveSessionDialog({
    moveDialogDay,
    effectiveMoveDialogSourceEntryKey,
    moveDialogSourceOptions,
    queueDraftMoveCommand,
    isValidIsoDate,
    closeMoveDialog,
  });

  const contractExpandedPreview = () => {
    if (!expandedPreviewDay) {
      return;
    }
    const day = expandedPreviewDay;
    const dayCell = document.querySelector(
      `[data-day-cell="true"][data-day="${day}"]`
    );
    if (dayCell instanceof HTMLElement) {
      dayPreviewInteractions.openDayPreview({
        day,
        pinned: true,
        target: dayCell,
      });
    }
    setExpandedPreviewDay(null);
  };

  const {
    saveLoading,
    resetLoading,
    fullResetLoading,
    rebuildLoading,
    savePlan,
    resetPlan,
    resetPlanFully,
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

  const showBlockingLoading = loading && context === null;
  const jumpToToday = useCallback(
    () => jumpToTodayBase(queueTodayShortcutVisibilitySync),
    [jumpToTodayBase, queueTodayShortcutVisibilitySync]
  );
  const moveViewWindow = (direction: -1 | 1) => {
    moveViewWindowBase(direction, resolvedFocusedDay, stepDays);
  };
  const saveButtonLabel = saveLoading ? "Saving..." : "Save plan";
  const renderCalendarDayCell = usePlannerCalendarDayCellRenderer({
    viewMode,
    expandedMonthRows,
    draggingEntryKey,
    calendarToday,
    focusedDay,
    plannerReadOnly,
    onSelectedDayChange,
    setLocalSelectedDay,
    setSelectedEventEntryKey,
    setDayPreview,
    canMutateEntryOnDay,
    getOrderedEntriesForDay,
    getCompletionFactMarkersForDay,
    visibleCells: viewMode === "month" ? cells : focusedWeekCells,
    dayPreviewInteractions,
  });
  const rollingWeekStrip = (
    <PlannerRollingWeekStrip
      rollingWeekStripRef={rollingWeekStripRef}
      viewMode={viewMode}
      focusedWeekDays={focusedWeekDays}
      focusedWeekCells={focusedWeekCells}
      renderCalendarDayCell={renderCalendarDayCell}
    />
  );

  const plannerSettingsForm = buildPlannerSettingsForm({
    setupRestWeekdays,
    setSetupRestWeekdays,
    setupLoading,
    plannerReadOnly,
    recoverLoading,
    loading,
    saveLoading,
    canRecoverPastSessions,
    canResetPlan,
    resetLoading,
    rebuildLoading,
    hasDraftSession,
    canShowSaveAction,
    rebuildBlockedMessage,
    fullResetLoading,
    submitSetup,
    recoverPastSessions,
    resetPlan,
    rebuildSchedule,
    resetPlanFully,
  });
  const eventDetailCallbacks = usePlannerEventDetailCallbacks({
    setSelectedEventEntryKey,
    setLocalSelectedDay,
    updateDraftLabel,
    updateDraftScheduledDate,
    updateDraftScheduledTimeOverride,
    toggleItemLock,
    navigateToOpenInstance,
    selectedGoalOpenInstances,
    selectedGoalOpenInstanceIndex,
  });


  const layoutProps = buildCalendarSurfaceLayoutProps({

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
  });

  return <PlannerCalendarSurfaceLayout {...layoutProps} />;
