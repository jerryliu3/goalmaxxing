"use client";

import { format, isValid, parse } from "date-fns";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { LoadingCard } from "@/components/ui/loading-card";
import { allCategoriesValue } from "@/features/goals/goal-filters";
import {
  buildWeekdayLabels,
  getEntryGoalFirstTitleWithTime,
} from "@/features/planner/calendar-format";
import { PlannerCoachPanel } from "@/features/planner/coach/planner-coach-panel";
import { usePlannerCoach } from "@/features/planner/coach/use-planner-coach";
import type { PlannerCoachBindings } from "@/features/planner/coach/coach-types";
import {
  buildPlannerCoachBindings,
  refreshPlannerAfterCoachGoalsCreated,
} from "@/features/planner/planner-coach-surface-bindings";
import { useCompletionMutation } from "@/features/planner/use-completion-mutation";
import {
  draftCommandReducer,
  initialDraftCommandState,
} from "@/features/planner/draft-command-reducer";
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
import { PlannerWarningsPanel } from "@/features/planner/planner-warnings-panel";
import type { PlannerEventDetailDialogCallbacks } from "@/features/planner/planner-event-detail-dialog";
import { buildMoveSourceOptions } from "@/features/planner/planner-move-source-options";
import { PlannerCalendarBoard } from "@/features/planner/planner-calendar-board";
import { PlannerCalendarOverlays } from "@/features/planner/planner-calendar-overlays";
import { PlannerCalendarToolbar } from "@/features/planner/planner-calendar-toolbar";
import { PlannerSettingsForm } from "@/features/planner/planner-settings-form";
import {
  buildPlannerSettingsForm,
  usePlannerEventDetailCallbacks,
} from "@/features/planner/planner-calendar-overlay-bindings";
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
  const [draftPolicy, setDraftPolicy] = useState<PlannerPolicy | null>(null);
  const [draftPreview, setDraftPreview] = useState<
    NonNullable<PlannerContextPayload["preview"]> | null
  >(null);
  const [draftPreviewWindow, setDraftPreviewWindow] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [draftCommandState, dispatchDraftCommand] = useReducer(
    draftCommandReducer,
    initialDraftCommandState
  );
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

  useEffect(() => {
    draftPolicyRef.current = draftPolicy;
  }, [draftPolicy]);

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
  const clearDraftSession = useCallback(() => {
    setDraftPolicy(null);
    setDraftPreview(null);
    setDraftPreviewWindow(null);
    dispatchDraftCommand({
      type: "clear",
    });
  }, []);
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
