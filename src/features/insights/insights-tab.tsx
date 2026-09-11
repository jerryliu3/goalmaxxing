"use client";

import {
  addMonths,
  format,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
  endOfYear,
} from "date-fns";
import { X } from "lucide-react";
import { type TouchEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useReportAppSurfaceReady } from "@/components/layout/app-boot-ready";
import { AnchoredPopupCard } from "@/components/ui/anchored-popup-card";
import { Button } from "@/components/ui/button";
import { LoadingCard } from "@/components/ui/loading-card";
import { InsightsTrackerHeader } from "@/features/insights/insights-tracker-header";
import { ProgressGoalList } from "@/features/insights/progress-goal-list";
import { InsightsOverallStatsTiles } from "@/features/insights/insights-overall-stats-card";
import { ProgressMilestoneRunway } from "@/features/insights/progress-milestone-runway";
import {
  isLedgerHeatmapDayMutable,
  progressLedgerCaption,
  resolveProgressLedgerMode,
  resolveSelectedLedgerGoalIds,
  toggleLedgerGoalSelection,
} from "@/features/insights/progress-ledger-selection";
import {
  selectSearchedGoals,
  selectVisiblePerGoalHeatmaps,
  selectYearHeatmapValues,
} from "@/features/insights/insights-selectors";
import { MonthHeatmap } from "@/features/insights/month-heatmap";
import { useInsightsData } from "@/features/insights/use-insights-data";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { CalendarDayPreviewList } from "@/features/planner/calendar-day-preview-list";
import { computeDayPreviewPosition } from "@/features/planner/day-preview-popup";
import { getGoalVisual } from "@/features/planner/goal-visuals";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  countCompletionsByDate,
  groupCompletionTitlesByDate,
  getSortedCompletionDates,
  groupCompletionsByGoalId,
} from "@/lib/goals/completion-grouping";
import {
  buildCompletableGoalIds,
  filterCompletionsForGoalIds,
  selectCompletableGoals,
} from "@cadence/shared/goals/completable-goals";
import { toLocalDateString } from "@/lib/dates/day";
import {
  resolveEffectiveEndMonths,
  type GoalDateSort,
} from "@/lib/goals/list-view";
import {
  areMilestoneNamesEqual,
  buildMilestoneNames,
  defaultMilestoneName,
} from "@/lib/goals/milestones";
import { getHeatmapScaleClass } from "@/lib/goals/heatmap";
import type { GoalProgressSnapshot } from "@/lib/goals/progress";
import {
  cadencePeriodTarget,
  isDeadlineTotalGoal,
  isPeriodCadenceGoal,
} from "@/lib/goals/target-basis";
import {
  isProgressContextAuthenticationError,
  progressSummaryMap,
} from "@/lib/goals/progress-context";
import type { Goal } from "@/lib/goals/types";
import { useCompletionCreditMove } from "@/features/planner/completion-credit-move";
import { resolveInsightsCompletionIntent } from "@/lib/planner/completion-intent";
import { useCompletionMutation } from "@/features/planner/use-completion-mutation";
import { withPlannerRefreshTimeout } from "@/lib/planner/refresh-timeout";
import { useOutsidePointerDismiss } from "@/lib/ui/use-outside-pointer-dismiss";
import { captureViewportRect } from "@/lib/xp/events";
import { createClient } from "@/lib/supabase/client";

export type HeatmapViewMode = "month" | "year";
export type InsightsTabContentMode = "full" | "lane";

const AGGREGATE_DRILLDOWN_DAY_CLASS_PREFIX = "aggregate-drilldown-day-";
const aggregateWeekdayLabels: [string, string, string, string, string, string, string] = [
  "Su",
  "M",
  "T",
  "W",
  "Th",
  "F",
  "S",
];

function getAggregateDrilldownDayClass(date: string | null | undefined): string {
  return date ? `${AGGREGATE_DRILLDOWN_DAY_CLASS_PREFIX}${date}` : "";
}

function getCompletionCountLabel(
  goal: Goal,
  completionCount: number,
  progress?: GoalProgressSnapshot
): string {
  if (
    goal.frequency_type === "fixed_milestones" ||
    isDeadlineTotalGoal(goal)
  ) {
    return `${completionCount}/${goal.target_count ?? 0} ${
      goal.frequency_type === "fixed_milestones" ? "milestones" : "completions"
    }`;
  }

  if (isPeriodCadenceGoal(goal) && progress) {
    const target = progress.currentPeriodTarget ?? cadencePeriodTarget(goal);
    if (target > 1) {
      return `${progress.currentPeriodCompletionCount}/${target} this period · ${completionCount} total`;
    }
  }

  return `${completionCount} completion${completionCount === 1 ? "" : "s"}`;
}

interface AggregateDrilldownCompletionMarker {
  key: string;
  goalTitle: string;
  scheduledDate: string | null;
}

interface InsightsTabProps {
  subjectUserId?: string;
  readOnly?: boolean;
  /**
   * Supplied only when the lanes share one period cursor (duo `both` scope).
   * Presence means "the shell owns and renders the controls", so there is no
   * separate flag that can contradict the handlers.
   */
  sharedPeriod?: {
    monthCursor: Date;
    onMonthCursorChange: (next: Date) => void;
    perGoalViewMode: HeatmapViewMode;
    onPerGoalViewModeChange: (mode: HeatmapViewMode) => void;
  };
  sharedGoalFilters?: InsightsSharedGoalFilters;
  contentMode?: InsightsTabContentMode;
  onPersonalGoalsChange?: (goals: Goal[]) => void;
}

export interface InsightsSharedGoalFilters {
  goalSearchQuery: string;
  setGoalSearchQuery: (value: string) => void;
  goalEndMonths: string[];
  setGoalEndMonths: (value: string[]) => void;
  goalSort: GoalDateSort;
  setGoalSort: (value: GoalDateSort) => void;
  showHistoricalGoals: boolean;
  setShowHistoricalGoals: (value: boolean) => void;
}

export function InsightsTab({
  subjectUserId,
  readOnly = false,
  sharedPeriod,
  sharedGoalFilters,
  contentMode = "full",
  onPersonalGoalsChange,
}: InsightsTabProps = {}) {
  const [internalMonthCursor, setInternalMonthCursor] = useState(new Date());
  const [internalPerGoalViewMode, setInternalPerGoalViewMode] =
    useState<HeatmapViewMode>("month");
  const monthCursor = sharedPeriod?.monthCursor ?? internalMonthCursor;
  const setMonthCursor = useCallback(
    (next: Date | ((previous: Date) => Date)) => {
      if (sharedPeriod) {
        sharedPeriod.onMonthCursorChange(
          typeof next === "function" ? next(monthCursor) : next
        );
        return;
      }
      setInternalMonthCursor(next);
    },
    [monthCursor, sharedPeriod]
  );
  const perGoalViewMode = sharedPeriod?.perGoalViewMode ?? internalPerGoalViewMode;
  const setPerGoalViewMode =
    sharedPeriod?.onPerGoalViewModeChange ?? setInternalPerGoalViewMode;
  const [internalGoalSearchQuery, setInternalGoalSearchQuery] = useState("");
  const [internalGoalEndMonths, setInternalGoalEndMonths] = useState<string[]>([]);
  const [internalGoalSort, setInternalGoalSort] = useState<GoalDateSort>("earliest_end");
  const [internalShowHistoricalGoals, setInternalShowHistoricalGoals] = useState(false);
  const goalSearchQuery = sharedGoalFilters?.goalSearchQuery ?? internalGoalSearchQuery;
  const setGoalSearchQuery = sharedGoalFilters?.setGoalSearchQuery ?? setInternalGoalSearchQuery;
  const goalEndMonths = sharedGoalFilters?.goalEndMonths ?? internalGoalEndMonths;
  const setGoalEndMonths = sharedGoalFilters?.setGoalEndMonths ?? setInternalGoalEndMonths;
  const goalSort = sharedGoalFilters?.goalSort ?? internalGoalSort;
  const setGoalSort = sharedGoalFilters?.setGoalSort ?? setInternalGoalSort;
  const showHistoricalGoals =
    sharedGoalFilters?.showHistoricalGoals ?? internalShowHistoricalGoals;
  const setShowHistoricalGoals =
    sharedGoalFilters?.setShowHistoricalGoals ?? setInternalShowHistoricalGoals;
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[] | null>(null);
  const [aggregateDrilldownDate, setAggregateDrilldownDate] = useState<string | null>(null);
  const [aggregateDrilldownPosition, setAggregateDrilldownPosition] = useState<
    ReturnType<typeof computeDayPreviewPosition> | null
  >(null);
  const [pendingRetroDate, setPendingRetroDate] = useState<string | null>(null);
  const [focusedLedgerDate, setFocusedLedgerDate] = useState<string | null>(null);
  const [milestoneNameDrafts, setMilestoneNameDrafts] = useState<Record<string, string[]>>({});
  const monthSwipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const aggregateHeatmapRef = useRef<HTMLDivElement | null>(null);
  const aggregateDrilldownRef = useRef<HTMLDivElement | null>(null);
  const runCompletionMutation = useCompletionMutation();
  const creditMove = useCompletionCreditMove();
  const selectedYear = useMemo(() => format(monthCursor, "yyyy"), [monthCursor]);
  const { state, loading, laneError, loadData, redirectToLogin } = useInsightsData({
    subjectUserId,
    selectedYear,
    failClosed: Boolean(readOnly && subjectUserId),
  });
  useReportAppSurfaceReady(!(loading && !state.userId));
  const todayLocal = state.asOfDate || toLocalDateString();
  const completionTimezone = state.timezone || "UTC";
  const supabase = useMemo(() => createClient(), []);

  const completableGoalIds = useMemo(
    () =>
      buildCompletableGoalIds({
        goals: state.goals,
        userId: state.userId,
        memberTeamIds: state.memberTeamIds,
      }),
    [state.goals, state.memberTeamIds, state.userId]
  );

  const personalGoals = useMemo(
    () => selectCompletableGoals(state.goals, completableGoalIds),
    [completableGoalIds, state.goals]
  );

  useEffect(() => {
    onPersonalGoalsChange?.(personalGoals);
  }, [onPersonalGoalsChange, personalGoals]);

  useEffect(() => {
    return () => onPersonalGoalsChange?.([]);
  }, [onPersonalGoalsChange]);

  const personalCompletions = useMemo(
    () => filterCompletionsForGoalIds(state.completions, completableGoalIds),
    [completableGoalIds, state.completions]
  );

  const completionsByGoal = useMemo(
    () => groupCompletionsByGoalId(personalCompletions),
    [personalCompletions]
  );
  const progressByGoal = useMemo(
    () => progressSummaryMap(state.progress),
    [state.progress]
  );

  const goalTitleById = useMemo(
    () =>
      new Map(
        personalGoals.map((goal) => [goal.id, goal.title])
      ),
    [personalGoals]
  );

  const selectedYearStart = useMemo(() => startOfYear(monthCursor), [monthCursor]);
  const selectedYearEnd = useMemo(() => endOfYear(monthCursor), [monthCursor]);
  const visiblePeriodStart = useMemo(
    () =>
      format(
        perGoalViewMode === "month" ? startOfMonth(monthCursor) : startOfYear(monthCursor),
        "yyyy-MM-dd"
      ),
    [monthCursor, perGoalViewMode]
  );
  const goalFilterStartMonth = visiblePeriodStart.slice(0, 7);
  const effectiveGoalEndMonths = resolveEffectiveEndMonths(
    goalEndMonths,
    goalFilterStartMonth
  );
  const searchedPersonalGoals = useMemo(
    () => selectSearchedGoals(personalGoals, goalSearchQuery),
    [goalSearchQuery, personalGoals]
  );
  const { historicalGoals, visiblePerGoalHeatmaps } = useMemo(
    () =>
      selectVisiblePerGoalHeatmaps({
        goals: searchedPersonalGoals,
        visiblePeriodStart,
        endMonths: effectiveGoalEndMonths,
        showHistoricalGoals,
        sort: goalSort,
      }),
    [
      effectiveGoalEndMonths,
      goalSort,
      searchedPersonalGoals,
      showHistoricalGoals,
      visiblePeriodStart,
    ]
  );

  const visibleGoalIds = useMemo(
    () => visiblePerGoalHeatmaps.map((goal) => goal.id),
    [visiblePerGoalHeatmaps]
  );
  const selectedLedgerGoalIds = useMemo(
    () => resolveSelectedLedgerGoalIds(visibleGoalIds, selectedGoalIds),
    [selectedGoalIds, visibleGoalIds]
  );
  const selectedLedgerIdSet = useMemo(
    () => new Set(selectedLedgerGoalIds),
    [selectedLedgerGoalIds]
  );
  const ledgerMode = resolveProgressLedgerMode({
    selectedCount: selectedLedgerGoalIds.length,
    visibleCount: visibleGoalIds.length,
  });
  const editableGoal =
    ledgerMode === "edit"
      ? (visiblePerGoalHeatmaps.find((goal) => goal.id === selectedLedgerGoalIds[0]) ??
        null)
      : null;
  const ledgerCompletions = useMemo(
    () => filterCompletionsForGoalIds(personalCompletions, selectedLedgerIdSet),
    [personalCompletions, selectedLedgerIdSet]
  );
  const ledgerCountsByDate = useMemo(
    () => countCompletionsByDate(ledgerCompletions),
    [ledgerCompletions]
  );
  const ledgerCompletionItemsByDate = useMemo(
    () => groupCompletionTitlesByDate(ledgerCompletions, goalTitleById),
    [goalTitleById, ledgerCompletions]
  );
  const ledgerHeatmapData = useMemo(
    () => selectYearHeatmapValues(monthCursor, ledgerCountsByDate),
    [ledgerCountsByDate, monthCursor]
  );
  const ledgerGoalItems = useMemo(
    () =>
      visiblePerGoalHeatmaps.map((goal) => {
        const progress = progressByGoal.get(goal.id);
        const completionCount = progress?.admissibleCompletionCount ?? 0;
        return {
          id: goal.id,
          title: goal.title,
          color: getGoalVisual({
            goalId: goal.id,
            color: goal.color,
            category: goal.category,
          }).color,
          rateLabel: getCompletionCountLabel(goal, completionCount, progress),
        };
      }),
    [progressByGoal, visiblePerGoalHeatmaps]
  );

  const refreshInsightsInBackground = useCallback(
    (scrollY: number) => {
      void loadData({ showLoading: false, forceRefresh: true })
        .then(() => {
          requestAnimationFrame(() => {
            window.scrollTo({ top: scrollY, behavior: "auto" });
          });
        })
        .catch((error) => {
          if (isProgressContextAuthenticationError(error)) {
            redirectToLogin();
            return;
          }
          const timeoutLike =
            error instanceof Error &&
            error.message.toLowerCase().includes("timed out");
          toast.error(
            timeoutLike
              ? "Completion updated, but calendar refresh timed out. Please refresh the page."
              : "Completion updated, but calendar refresh failed. Please refresh the page."
          );
        });
    },
    [loadData, redirectToLogin]
  );

  const toggleMilestoneDateSelection = useCallback(
    async (
      goal: Goal,
      completionDate: string,
      selectedDates: string[],
      milestoneLimit: number,
      creditedCount: number,
      sourceElement?: HTMLButtonElement
    ) => {
      if (readOnly) {
        return;
      }
      if (pendingRetroDate !== null) {
        return;
      }

      const isSelected = selectedDates.includes(completionDate);
      const localToday = todayLocal;
      if (completionDate > localToday && !isSelected) {
        toast.error("You can only select today or past dates.");
        return;
      }

      if (!isSelected && creditedCount >= milestoneLimit) {
        toast.error(`Select up to ${milestoneLimit} milestone dates.`);
        return;
      }

      const intent = resolveInsightsCompletionIntent({
        goal,
        completionDate,
        hasCompletionOnDate: isSelected,
        temporal: {
          selectedDate: completionDate,
          asOfDate: localToday,
        },
      });

      if (!intent.allowed) {
        toast.error(
          intent.disabledReason === "future_creation"
            ? "You can only select today or past dates."
            : "This completion cannot be changed from this date."
        );
        return;
      }

      if (!isSelected && creditMove) {
        const openedMoveDialog = await creditMove.requestMoveBeforeComplete(
          goal,
          completionDate
        );
        if (openedMoveDialog) {
          return;
        }
      }

      setPendingRetroDate(completionDate);
      const currentScrollY = window.scrollY;
      const { decision, mutation } = intent;

      const result = await runCompletionMutation({
        decision,
        desiredFactState: mutation.desiredFactState,
        goalId: mutation.goalId,
        date: mutation.date,
        timezone: completionTimezone,
        sourceRect: sourceElement
          ? captureViewportRect(sourceElement)
          : undefined,
        blockedMessage:
          decision.reason === "future_creation"
            ? "You can only select today or past dates."
            : "This completion cannot be changed from this date.",
        fallbackErrorMessage: "Completion update failed.",
      });

      if (!result.ok) {
        toast.error(result.message ?? "Completion update failed.");
        setPendingRetroDate(null);
        return;
      }

      toast.success(isSelected ? `Removed ${completionDate}.` : `Selected ${completionDate}.`);
      setPendingRetroDate(null);
      refreshInsightsInBackground(currentScrollY);
    },
    [completionTimezone, creditMove, pendingRetroDate, readOnly, refreshInsightsInBackground, runCompletionMutation, todayLocal]
  );

  const toggleRecurringDateSelection = useCallback(
    async (
      goal: Goal,
      completionDate: string,
      hasCompletionOnDate: boolean,
      sourceElement?: HTMLButtonElement
    ) => {
      if (readOnly) {
        return;
      }
      if (pendingRetroDate !== null) {
        return;
      }

      const localToday = todayLocal;
      if (completionDate > localToday && !hasCompletionOnDate) {
        toast.error("You can only select today or past dates.");
        return;
      }

      const intent = resolveInsightsCompletionIntent({
        goal,
        completionDate,
        hasCompletionOnDate,
        temporal: {
          selectedDate: completionDate,
          asOfDate: localToday,
        },
      });

      if (!intent.allowed) {
        toast.error(
          intent.disabledReason === "future_creation"
            ? "You can only select today or past dates."
            : "This completion cannot be changed from this date."
        );
        return;
      }

      if (!hasCompletionOnDate && creditMove) {
        const openedMoveDialog = await creditMove.requestMoveBeforeComplete(
          goal,
          completionDate
        );
        if (openedMoveDialog) {
          return;
        }
      }

      setPendingRetroDate(completionDate);
      const currentScrollY = window.scrollY;
      const { decision, mutation } = intent;

      const result = await runCompletionMutation({
        decision,
        desiredFactState: mutation.desiredFactState,
        goalId: mutation.goalId,
        date: mutation.date,
        timezone: completionTimezone,
        sourceRect: sourceElement
          ? captureViewportRect(sourceElement)
          : undefined,
        blockedMessage:
          decision.reason === "future_creation"
            ? "You can only select today or past dates."
            : "This completion cannot be changed from this date.",
        fallbackErrorMessage: "Completion update failed.",
      });

      if (!result.ok) {
        toast.error(result.message ?? "Completion update failed.");
        setPendingRetroDate(null);
        return;
      }

      toast.success(hasCompletionOnDate ? `Removed ${completionDate}.` : `Selected ${completionDate}.`);
      setPendingRetroDate(null);
      refreshInsightsInBackground(currentScrollY);
    },
    [completionTimezone, creditMove, pendingRetroDate, readOnly, refreshInsightsInBackground, runCompletionMutation, todayLocal]
  );

  const saveMilestoneNames = useCallback(
    async (goal: Goal, names: string[]) => {
      if (readOnly) {
        return false;
      }
      if (goal.owner_id !== state.userId) {
        toast.error("Only the goal owner can rename milestones.");
        return false;
      }

      const currentScrollY = window.scrollY;
      try {
        const { error } = await supabase.rpc("set_goal_milestone_names", {
          p_goal_id: goal.id,
          p_milestone_names: names,
        });
        if (error) {
          toast.error(error.message);
          return false;
        }

        toast.success("Milestone names updated.");
        await withPlannerRefreshTimeout({
          operation: loadData({ showLoading: false, forceRefresh: true }),
          timeoutMessage: "Insights refresh timed out. Please refresh to sync.",
        });
        requestAnimationFrame(() => {
          window.scrollTo({ top: currentScrollY, behavior: "auto" });
        });
        return true;
      } catch (error) {
        if (isProgressContextAuthenticationError(error)) {
          redirectToLogin();
          return false;
        }
        toast.error(
          getApiErrorMessage(error, "Milestone names update failed.")
        );
        return false;
      }
    },
    [loadData, readOnly, redirectToLogin, state.userId, supabase]
  );

  const onMonthSectionTouchStart: TouchEventHandler<HTMLDivElement> = (event) => {
    if (event.touches.length !== 1) {
      monthSwipeStartRef.current = null;
      return;
    }

    const target = event.target as HTMLElement | null;
    const isInteractiveElement = target?.closest(
      "button,a,input,textarea,select,label,[role='button']"
    );
    if (isInteractiveElement) {
      monthSwipeStartRef.current = null;
      return;
    }

    const touch = event.touches[0];
    monthSwipeStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  };

  const onMonthSectionTouchEnd: TouchEventHandler<HTMLDivElement> = (event) => {
    const swipeStart = monthSwipeStartRef.current;
    monthSwipeStartRef.current = null;

    if (!swipeStart || event.changedTouches.length === 0) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - swipeStart.x;
    const deltaY = touch.clientY - swipeStart.y;

    if (Math.abs(deltaX) < 70 || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    setMonthCursor((previous) => (deltaX < 0 ? addMonths(previous, 1) : subMonths(previous, 1)));
  };

  const aggregateDrilldownItems = useMemo(
    () =>
      aggregateDrilldownDate
        ? ledgerCompletionItemsByDate[aggregateDrilldownDate] ?? []
        : [],
    [aggregateDrilldownDate, ledgerCompletionItemsByDate]
  );
  const aggregateDrilldownMarkers = useMemo<AggregateDrilldownCompletionMarker[]>(
    () =>
      aggregateDrilldownItems.map((title, index) => ({
        key: `${aggregateDrilldownDate ?? "none"}-${title}-${index}`,
        goalTitle: title,
        scheduledDate: aggregateDrilldownDate,
      })),
    [aggregateDrilldownDate, aggregateDrilldownItems]
  );
  const clearAggregateDrilldown = useCallback(() => {
    setAggregateDrilldownDate(null);
    setAggregateDrilldownPosition(null);
  }, []);

  useOutsidePointerDismiss({
    enabled: aggregateDrilldownDate !== null,
    containerRef: aggregateDrilldownRef,
    onDismiss: clearAggregateDrilldown,
  });
  const showHeatmap = contentMode === "full" || contentMode === "lane";
  const showGoalStatsSection = contentMode === "full";
  const showGoalsSection = contentMode === "full" || contentMode === "lane";
  const stackLedgerAndHeatmap = contentMode !== "full";
  const heatmapEditable = ledgerMode === "edit" && !readOnly && Boolean(editableGoal);
  const heatmapAllowsDrilldown = ledgerMode === "aggregate" && !readOnly;
  const heatmapDayClickEnabled = heatmapEditable || heatmapAllowsDrilldown;
  const milestoneTargetCount =
    editableGoal?.frequency_type === "fixed_milestones"
      ? Math.max(editableGoal.target_count ?? 0, 1)
      : 0;
  const editableCompletions = editableGoal
    ? (completionsByGoal.get(editableGoal.id) ?? [])
    : [];
  const editableProgress = editableGoal ? progressByGoal.get(editableGoal.id) : undefined;
  const persistedMilestoneNames =
    editableGoal?.frequency_type === "fixed_milestones"
      ? buildMilestoneNames(milestoneTargetCount, editableGoal.milestone_names)
      : [];
  const draftMilestoneNames =
    editableGoal && milestoneNameDrafts[editableGoal.id]
      ? milestoneNameDrafts[editableGoal.id]
      : persistedMilestoneNames;
  const mappedMilestoneDates =
    editableProgress?.milestoneDates ??
    getSortedCompletionDates(editableCompletions).slice(0, milestoneTargetCount);
  const milestoneStops =
    editableGoal?.frequency_type === "fixed_milestones"
      ? Array.from({ length: milestoneTargetCount }, (_, index) => ({
          name: draftMilestoneNames[index] ?? defaultMilestoneName(index),
          date: mappedMilestoneDates[index] ?? null,
        }))
      : [];
  const milestonePinDates = useMemo(() => {
    const dates = new Set<string>();
    for (const goal of visiblePerGoalHeatmaps) {
      if (!selectedLedgerIdSet.has(goal.id) || goal.frequency_type !== "fixed_milestones") {
        continue;
      }
      const progress = progressByGoal.get(goal.id);
      const goalDates =
        progress?.milestoneDates ??
        getSortedCompletionDates(completionsByGoal.get(goal.id) ?? []);
      for (const date of goalDates) {
        dates.add(date);
      }
    }
    return dates;
  }, [completionsByGoal, progressByGoal, selectedLedgerIdSet, visiblePerGoalHeatmaps]);
  const showOverallStats =
    Boolean(state.insightsStats?.overall) &&
    (contentMode === "full" || contentMode === "lane");
  const ledgerCaption = progressLedgerCaption(
    ledgerMode,
    selectedLedgerGoalIds.length,
    editableGoal?.frequency_type === "fixed_milestones"
      ? "milestone"
      : "completion",
    heatmapEditable
  );
  const ledgerHelp = (
    <p className="text-sm text-muted-foreground">{ledgerCaption}</p>
  );

  const openLedgerDrilldown = (
    date: string,
    sourceElement?: HTMLButtonElement
  ) => {
    setAggregateDrilldownDate(date);
    if (sourceElement) {
      const rect = sourceElement.getBoundingClientRect();
      setAggregateDrilldownPosition(
        computeDayPreviewPosition({
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
        })
      );
      return;
    }
    const tile = aggregateHeatmapRef.current?.querySelector(
      `.${getAggregateDrilldownDayClass(date)}`
    );
    if (tile instanceof Element) {
      const rect = tile.getBoundingClientRect();
      setAggregateDrilldownPosition(
        computeDayPreviewPosition({
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
        })
      );
      return;
    }
    setAggregateDrilldownPosition(null);
  };

  const handleLedgerDayClick = (
    date: string,
    sourceElement?: HTMLButtonElement
  ) => {
    setFocusedLedgerDate(date);
    if (heatmapEditable && editableGoal) {
      if (!isLedgerHeatmapDayMutable(date, todayLocal)) {
        toast.error("You can only select today or past dates.");
        return;
      }
      if (editableGoal.frequency_type === "fixed_milestones") {
        void toggleMilestoneDateSelection(
          editableGoal,
          date,
          getSortedCompletionDates(editableCompletions),
          milestoneTargetCount,
          editableProgress?.creditedUnitCount ?? 0,
          sourceElement
        );
        return;
      }
      void toggleRecurringDateSelection(
        editableGoal,
        date,
        (ledgerCountsByDate[date] ?? 0) > 0,
        sourceElement
      );
      return;
    }
    openLedgerDrilldown(date, sourceElement);
  };

  if (loading && !state.userId) {
    return (
      <LoadingCard
        title="Loading progress..."
        description="Crunching your completion history."
      />
    );
  }

  if (laneError) {
    return (
      <p className="px-1 text-sm text-muted-foreground">{laneError}</p>
    );
  }

  return (
    <div className="space-y-5">
      {showGoalStatsSection ? (
        <InsightsTrackerHeader
          goals={personalGoals}
          monthCursor={monthCursor}
          onMonthCursorChange={(next) => setMonthCursor(next)}
          perGoalViewMode={perGoalViewMode}
          onPerGoalViewModeChange={setPerGoalViewMode}
          goalSearchQuery={goalSearchQuery}
          onGoalSearchQueryChange={setGoalSearchQuery}
          goalEndMonths={goalEndMonths}
          onGoalEndMonthsChange={setGoalEndMonths}
          goalSort={goalSort}
          onGoalSortChange={setGoalSort}
          showHistoricalGoals={showHistoricalGoals}
          onShowHistoricalGoalsChange={setShowHistoricalGoals}
        />
      ) : null}

      {showGoalsSection || showHeatmap ? (
        <div
          data-testid="progress-ledger-layout"
          className={
            stackLedgerAndHeatmap
              ? "space-y-3"
              : "flex flex-col gap-6 md:grid md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:items-start"
          }
        >
          {showHeatmap ? (
              <div
                ref={aggregateHeatmapRef}
                className={
                  stackLedgerAndHeatmap
                    ? "space-y-1"
                    : "md:col-start-2 md:row-start-1"
                }
                data-onboarding="insights.overall"
                data-no-swipe="true"
                onTouchStart={
                  perGoalViewMode === "month" ? onMonthSectionTouchStart : undefined
                }
                onTouchEnd={
                  perGoalViewMode === "month" ? onMonthSectionTouchEnd : undefined
                }
              >
                {ledgerHelp}
                {ledgerMode === "empty" ? null : perGoalViewMode === "month" ? (
                <MonthHeatmap
                  month={monthCursor}
                  countsByDate={ledgerCountsByDate}
                  interactive={heatmapEditable}
                  pendingDate={pendingRetroDate}
                  milestoneDates={milestonePinDates}
                  showMonthLabel={false}
                  isDayDisabled={
                    heatmapEditable
                      ? (date) => !isLedgerHeatmapDayMutable(date, todayLocal)
                      : undefined
                  }
                  onDayClick={
                    heatmapDayClickEnabled
                      ? (date, sourceElement) =>
                          handleLedgerDayClick(date, sourceElement)
                      : undefined
                  }
                />
              ) : (
                <div className="overflow-x-auto py-1">
                  <CalendarHeatmap
                    startDate={selectedYearStart}
                    endDate={selectedYearEnd}
                    values={ledgerHeatmapData}
                    showWeekdayLabels
                    weekdayLabels={aggregateWeekdayLabels}
                    classForValue={(value) =>
                      `${getHeatmapScaleClass(value?.count ?? 0)} cursor-pointer ${getAggregateDrilldownDayClass(value?.date)}`
                    }
                    titleForValue={(value) => {
                      const count = value?.count ?? 0;
                      const unit =
                        editableGoal?.frequency_type === "fixed_milestones"
                          ? count === 1
                            ? "milestone"
                            : "milestones"
                          : count === 1
                            ? "completion"
                            : "completions";
                      return `${value?.date ?? "N/A"}: ${count} ${unit}`;
                    }}
                    onClick={(value?: { date?: string }) => {
                      if (!heatmapDayClickEnabled) {
                        return;
                      }
                      const selectedDate = value?.date;
                      if (!selectedDate) {
                        return;
                      }
                      handleLedgerDayClick(selectedDate);
                    }}
                  />
                </div>
              )}
            </div>
          ) : null}

          {showGoalsSection ? (
            <div className={stackLedgerAndHeatmap ? undefined : "md:col-start-1 md:row-start-1"}>
              <ProgressGoalList
                goals={ledgerGoalItems}
                selectedGoalIds={selectedLedgerIdSet}
                onboarding={!readOnly}
                onSelectAll={() => setSelectedGoalIds(null)}
                onClearAll={() => setSelectedGoalIds([])}
                onSelectOnly={(goalId) => setSelectedGoalIds([goalId])}
                onToggleGoal={(goalId) => {
                  setSelectedGoalIds((current) =>
                    toggleLedgerGoalSelection(visibleGoalIds, current, goalId)
                  );
                }}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {showHeatmap && editableGoal?.frequency_type === "fixed_milestones" ? (
        <ProgressMilestoneRunway
          title={editableGoal.title}
          countLabel={getCompletionCountLabel(
            editableGoal,
            editableProgress?.admissibleCompletionCount ?? mappedMilestoneDates.length,
            editableProgress
          )}
          stops={milestoneStops}
          activeDate={focusedLedgerDate}
          onSelect={(stop) => {
            if (stop.date) {
              handleLedgerDayClick(stop.date);
            }
          }}
          onNameChange={
            heatmapEditable
              ? (index, name) => {
                  setMilestoneNameDrafts((previous) => {
                    const nextGoalNames = [
                      ...(previous[editableGoal.id] ?? persistedMilestoneNames),
                    ];
                    nextGoalNames[index] = name;
                    return {
                      ...previous,
                      [editableGoal.id]: nextGoalNames,
                    };
                  });
                }
              : undefined
          }
          onNameCommit={
            heatmapEditable
              ? (index, name) => {
                  const nextNames = [...draftMilestoneNames];
                  nextNames[index] = name;
                  const names = buildMilestoneNames(milestoneTargetCount, nextNames);
                  if (areMilestoneNamesEqual(names, persistedMilestoneNames)) {
                    return;
                  }
                  void saveMilestoneNames(editableGoal, names);
                }
              : undefined
          }
        />
      ) : null}

      {showOverallStats && state.insightsStats ? (
        <section className="rounded-[12px] border border-border p-4">
          <h2 className="mb-3 font-display text-base font-semibold tracking-tight">
            Overall stats
          </h2>
          <InsightsOverallStatsTiles overallStats={state.insightsStats.overall} />
        </section>
      ) : null}

      {showHeatmap && aggregateDrilldownDate && !heatmapEditable ? (
        <AnchoredPopupCard
          popupRef={aggregateDrilldownRef}
          position={aggregateDrilldownPosition}
          fallbackTop={16}
          fallbackLeft={16}
          fallbackWidth={320}
          title={`Completions on ${format(parseISO(aggregateDrilldownDate), "MMM d, yyyy")}`}
          actions={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={clearAggregateDrilldown}
              aria-label="Close drilldown"
            >
              <X className="size-3" />
            </Button>
          }
        >
          <p className="text-xs text-muted-foreground">
            {ledgerCountsByDate[aggregateDrilldownDate] ?? 0} completion
            {(ledgerCountsByDate[aggregateDrilldownDate] ?? 0) === 1 ? "" : "s"}
          </p>
          <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">
            {aggregateDrilldownItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No completed items on this date.
              </p>
            ) : (
              <CalendarDayPreviewList
                day={aggregateDrilldownDate}
                entries={[]}
                completionFactMarkers={aggregateDrilldownMarkers}
                mutationLoadingKey={null}
                getEntryDisplayTitle={() => ""}
                getEntrySubtitle={() => null}
                isEntryCredited={() => false}
                isEntryImmovableForDraft={() => true}
                getCompletionToggleState={() => ({
                  currentlyCredited: false,
                  disabledReasonCopy: "View-only completion history.",
                })}
                onEntryOpen={() => undefined}
                onToggleCompletion={() => undefined}
                onEntryPointerStart={() => undefined}
                onEntryPointerEnd={() => undefined}
                density="expanded"
              />
            )}
          </div>
        </AnchoredPopupCard>
      ) : null}
    </div>
  );
}
