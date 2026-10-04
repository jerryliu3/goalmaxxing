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
import { useCalendarSurfaceMoveSession } from "@/features/planner/use-calendar-surface-move-session";
import { useCalendarSurfacePresentation } from "@/features/planner/use-calendar-surface-presentation";
import {
  useCalendarSurfaceInteractionRefs,
  useCalendarSurfaceUiEffects,
} from "@/features/planner/use-calendar-surface-ui-effects";
import { buildGoalViewSessions, buildGoalViewWindow } from "@/features/planner/goal-view/goal-view-model";
import { useGoalViewProjection } from "@/features/planner/goal-view/use-goal-view-projection";
import { getDateInTimezone, resolveUserTimezone } from "@/lib/dates/timezone";
import {
  buildPlannerContextCacheKey,
  invalidatePlannerRelatedTabCaches,
} from "@/lib/cache/planner-tab-cache";
import { readTabDataCache, writeTabDataCache } from "@/lib/cache/tab-data-cache";
import { usePlannerTabCacheInvalidation } from "@/lib/cache/use-planner-tab-cache-invalidation";
import type {
  CalendarSurfaceProps,
  DayPreviewState,
  PlannerContextPayload,
  PlannerDayDetailEntry,
} from "@/features/planner/calendar-surface.types";
import {
  canOpenPlannerEventDetails,
  isPlannerTaskCalendarEntry,
} from "@/features/planner/calendar-task-entries";
import { PLANNER_CHECKLIST_PANE_TEST_ID } from "@/features/planner/planner-checklist-scroll";
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
import { applySavedPlannerCommands } from "@/features/planner/planner-saved-context";
import type { SavedPlannerItem } from "@cadence/shared/planner/context";
import { usePlannerDraftCommands } from "@/features/planner/use-planner-draft-commands";
import { usePlannerCalendarDnd } from "@/features/planner/use-planner-calendar-dnd";
import { getApiErrorMessage, getJson } from "@/lib/api/client";
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
  selectUnscheduledDraftMove,
  UnscheduledDraftMoveProvider,
  type UnscheduledDraftMoveRequest,
} from "@/features/planner/unscheduled-draft-move";
import {
  getScopeDateRange,
  countDateWindowDays,
  monthFromDate,
  nextMonth,
} from "@/lib/planner/dates";
import { MAX_PLANNER_WINDOW_DAYS } from "@/lib/planner/contracts/bounds";
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
  // Read the browser-only cache after hydration. Reading sessionStorage in the
  // initial render makes the client tree differ from the server's loading tree
  // and React can discard a user's first interaction while rebuilding it.
  const [context, setContext] = useState<PlannerContextPayload | null>(null);
  const [loading, setLoading] = useState(Boolean(month));
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
    setLoading(false);
  }, [month]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [goalIdFilters, setGoalIdFilters] = useState<string[]>([]);
  const [calendarFocusedGoalId, setCalendarFocusedGoalId] = useState<string | null>(
    null
  );
  const [endMonthFilters, setEndMonthFilters] = useState<string[]>([]);
  const [showCompletedGoals, setShowCompletedGoals] = useState(false);
  // Goal View is a lens on the same planner context, not a calendar view mode.
  const [goalViewOpen, setGoalViewOpen] = useState(false);
  // Starts with the calendar window and expands after its background read.
  const [goalViewWindow, setGoalViewWindow] = useState<{ start: string; end: string } | null>(null);
  const [showPastSessions, setShowPastSessions] = useState(false);
  const [goalViewPreviewOpen, setGoalViewPreviewOpen] = useState(false);
  const goalViewVisible = goalViewOpen && goalViewWindow !== null;
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
  const resetPlannerEntrySelection = useCallback((options?: { clearGoalFocus?: boolean }) => {
    setSelectedEventEntryKey(null);
    if (options?.clearGoalFocus !== false) {
      setCalendarFocusedGoalId(null);
    }
  }, []);
  const togglePlannerGoalSelection = useCallback(
    (
      entry: PlannerDayDetailEntry,
      options: {
        applyGoalFocus: boolean;
      }
    ) => {
      if (!canOpenPlannerEventDetails(entry)) {
        return;
      }
      const isActive =
        selectedEventEntryKey === entry.key &&
        (!options.applyGoalFocus ||
          isPlannerTaskCalendarEntry(entry) ||
          calendarFocusedGoalId === entry.originalGoalId);
      if (isActive) {
        resetPlannerEntrySelection({ clearGoalFocus: options.applyGoalFocus });
        return;
      }
      setSelectedEventEntryKey(entry.key);
      if (options.applyGoalFocus && !isPlannerTaskCalendarEntry(entry)) {
        setCalendarFocusedGoalId(entry.originalGoalId);
      } else if (!options.applyGoalFocus) {
        setCalendarFocusedGoalId(null);
      }
    },
    [calendarFocusedGoalId, resetPlannerEntrySelection, selectedEventEntryKey]
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
    const resetTimer = window.setTimeout(() => resetPlannerEntrySelection(), 0);
    return () => window.clearTimeout(resetTimer);
  }, [month, resetPlannerEntrySelection]);
  useEffect(() => {
    if (!selectedEventEntryKey) {
      return;
    }
    // pointerdown (not click) so outside dismiss runs before the next entry click handler.
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      // Checklist chrome (todos, drag, section toggles) should not dismiss the
      // open session editor; entry clicks still update selection via click.
      if (
        target.closest(`[data-testid="${PLANNER_CHECKLIST_PANE_TEST_ID}"]`)
      ) {
        return;
      }
      if (target.closest("[data-planner-entry-key]")) {
        return;
      }
      if (target.closest("[data-plan-entry-editor='true']")) {
        return;
      }
      resetPlannerEntrySelection();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [resetPlannerEntrySelection, selectedEventEntryKey]);
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
    goalViewOpen,
    setGoalViewWindow,
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
  const { goalViewDays, projectionDays: modelProjectionDays } = useGoalViewProjection({
    open: goalViewOpen,
    window: goalViewWindow,
    baseProjectionDays: additionalProjectionDays,
  });
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
    additionalProjectionDays: modelProjectionDays,
    calendarTaskEntriesByDate: taskEntriesByDate,
    showTasksInsteadOfGoals,
    // Goal View is a list lens, so it follows the Filters toggle even over Day.
    showCompletedGoals:
      viewMode === "day" && !goalViewOpen ? true : showCompletedGoals,
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
      forcePrepare: true,
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
    getCompletionFactMarkersForDay,
    getOrderedEntriesForDay,
    canMutateEntryOnDay,
    plannerReadOnly,
  } = dayAccessors;
  const goalViewSessions = useMemo(
    () => buildGoalViewSessions(goalViewDays, getOrderedEntriesForDay),
    [getOrderedEntriesForDay, goalViewDays]
  );
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
  const queueUnscheduledDraftMove = useCallback(
    async ({
      goalId,
      targetDate,
      goalStartDate,
      goalEndDate,
      localMove,
    }: UnscheduledDraftMoveRequest) => {
      let move = localMove;
      const localEntry = move
        ? [...entriesByDate.values()].flat().find(
            (candidate) =>
              candidate.originalGoalId === goalId &&
              candidate.unitKey === move?.unitKey &&
              !candidate.draftGhost
          )
        : null;
      let expandedContext: PlannerContextPayload | null = null;
      // A visible preview may invent a placement for a session whose persisted
      // source is outside this window. Discover that source before staging it.
      const goalSpansOtherMonths = Boolean(goalEndDate && (
        monthFromDate(goalStartDate) !== context?.scopeMonth ||
        monthFromDate(goalEndDate) !== context?.scopeMonth
      ));
      if (!move || !localEntry?.activeItem || goalSpansOtherMonths) {
        if (!context) {
          toast.error("Planner context is unavailable.");
          return false;
        }
        let discoveryEndMonth = monthFromDate(targetDate);
        for (let index = 1; index < 12; index += 1) {
          discoveryEndMonth = nextMonth(discoveryEndMonth);
        }
        const goalWindow = {
          start: getScopeDateRange(monthFromDate(goalStartDate < targetDate ? goalStartDate : targetDate)).start,
          end: getScopeDateRange(goalEndDate && goalEndDate > targetDate ? monthFromDate(goalEndDate) : monthFromDate(targetDate)).end,
        };
        // Include earlier months for bounded lifetime goals: their earliest
        // incomplete session can be overdue rather than upcoming.
        const discoveryWindow = goalEndDate && countDateWindowDays(goalWindow) <= MAX_PLANNER_WINDOW_DAYS
          ? goalWindow
          : {
              start: getScopeDateRange(monthFromDate(targetDate)).start,
              end: getScopeDateRange(discoveryEndMonth).end,
            };
        try {
          expandedContext = await getJson<PlannerContextPayload>(
            "/api/planner/context",
            {
              query: {
                scopeMonth: context.scopeMonth,
                visibleStart: discoveryWindow.start,
                visibleEnd: discoveryWindow.end,
              },
            }
          );
        } catch (error) {
          toast.error(
            getApiErrorMessage(error, "Planned sessions could not be loaded.")
          );
          return false;
        }
        move = selectUnscheduledDraftMove({
          goalId,
          targetDate,
          workUnits: expandedContext.preview?.workUnits ?? [],
        });
      }
      if (!move) {
        toast.error("This goal has no incomplete planned session available to move here.");
        return false;
      }
      if (expandedContext) {
        const loadedContext = expandedContext;
        const activeGoal = loadedContext.activePlan?.goals.find(
          (goal) => goal.original_goal_id === goalId
        );
        const activeItem = activeGoal
          ? loadedContext.activePlan?.items.find(
              (item) =>
                item.plan_goal_id === activeGoal.id &&
                item.unit_key === move.unitKey
            )
          : null;
        if (!activeItem) {
          toast.error("That planned session is no longer available.");
          return false;
        }
        setContext(loadedContext);
        writeTabDataCache(
          buildPlannerContextCacheKey(loadedContext.scopeMonth),
          loadedContext
        );
        dispatchDraftCommand({
          type: "upsert_move",
          goalId: move.goalId,
          unitKey: move.unitKey,
          sourceDate: activeItem.scheduled_date ?? move.sourceDate,
          scheduledDate: move.scheduledDate,
        });
        return true;
      }
      if (!localEntry?.activeItem) {
        toast.error("That planned session is not available in this calendar draft.");
        return false;
      }
      return queueDraftMoveCommand({
        entry: localEntry,
        nextDate: move.scheduledDate,
        source: "date_input",
      });
    },
    [context, dispatchDraftCommand, entriesByDate, queueDraftMoveCommand]
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
    getEntriesForDay: getOrderedEntriesForDay,
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

  const acceptPlannerScheduleDigest = useCallback(
    (scheduleDigest: string | null, savedItems: SavedPlannerItem[] | null) => {
      if (!scheduleDigest || !context || !draftSaveWindow) {
        return;
      }
      const savedContext = applySavedPlannerCommands(context, draftSaveCommands, scheduleDigest, savedItems, draftSaveWindow);
      // loadContext reads even a stale cache before fetching. Update both
      // baselines so a failed fetch cannot restore the old digest or source date.
      writeTabDataCache(buildPlannerContextCacheKey(savedContext.scopeMonth), savedContext, 0);
      if (goalViewOpen) {
        writeTabDataCache(
          buildPlannerContextCacheKey(savedContext.scopeMonth, buildGoalViewWindow(savedContext.asOfDate)),
          savedContext,
          0
        );
      }
      setContext(savedContext);
    },
    [context, draftSaveCommands, draftSaveWindow, goalViewOpen]
  );

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
      onScheduleDigestChange: acceptPlannerScheduleDigest,
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
    togglePlannerGoalSelection,
    resetPlannerEntrySelection,
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
    goalViewOpen,
    goalViewVisible,
    onGoalViewOpenChange: setGoalViewOpen,
    showPastSessions,
    setShowPastSessions,
    goalViewPreviewOpen,
    setGoalViewPreviewOpen,
    goalViewSessions,
    goalViewWindow,
    onGoalViewMoveSession: updateDraftScheduledDate,
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

  useReportAppSurfaceReady(Boolean(error) || (context !== null && !loading));

  return (
    <UnscheduledDraftMoveProvider
      workUnits={draftWindowWorkUnits}
      asOfDate={context?.asOfDate ?? null}
      onDraftMove={queueUnscheduledDraftMove}
    >
      <PlannerCalendarSurfaceLayout {...layoutProps} />
    </UnscheduledDraftMoveProvider>
  );
}
