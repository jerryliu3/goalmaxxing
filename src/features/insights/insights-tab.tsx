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
import {
  CalendarRange,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { type TouchEventHandler, useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AnchoredPopupCard } from "@/components/ui/anchored-popup-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingCard } from "@/components/ui/loading-card";
import { InsightsPeriodStepper } from "@/features/insights/insights-period-controls";
import { InsightsGoalStatsFilters } from "@/features/insights/insights-goal-stats-filters";
import { MilestonePills } from "@/features/goals/milestone-pills";
import { ProgressGoalList } from "@/features/insights/progress-goal-list";
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
import { getApiErrorMessage } from "@/lib/api/client";
import { resolveUserTimezone } from "@/lib/dates/timezone";
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
import { resolveInsightsCompletionIntent } from "@/lib/planner/completion-intent";
import { useCompletionMutation } from "@/features/planner/use-completion-mutation";
import { withPlannerRefreshTimeout } from "@/lib/planner/refresh-timeout";
import { useOutsidePointerDismiss } from "@/lib/ui/use-outside-pointer-dismiss";
import { captureViewportRect } from "@/lib/xp/events";
import { createClient } from "@/lib/supabase/client";

export type HeatmapViewMode = "month" | "year";
export type InsightsTabContentMode =
  | "full"
  | "overall-only"
  | "goal-stats-only"
  | "goals-only";

const MAX_VISIBLE_MILESTONES = 5;
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
  const [goalStatsFiltersOpen, setGoalStatsFiltersOpen] = useState(false);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[] | null>(null);
  const [aggregateDrilldownDate, setAggregateDrilldownDate] = useState<string | null>(null);
  const [aggregateDrilldownPosition, setAggregateDrilldownPosition] = useState<
    ReturnType<typeof computeDayPreviewPosition> | null
  >(null);
  const [pendingRetroDate, setPendingRetroDate] = useState<string | null>(null);
  const [milestoneNameDrafts, setMilestoneNameDrafts] = useState<Record<string, string[]>>({});
  const [savingMilestoneNamesGoalId, setSavingMilestoneNamesGoalId] = useState<string | null>(
    null
  );
  const monthSwipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const aggregateHeatmapRef = useRef<HTMLDivElement | null>(null);
  const aggregateDrilldownRef = useRef<HTMLDivElement | null>(null);
  const runCompletionMutation = useCompletionMutation();
  const selectedYear = useMemo(() => format(monthCursor, "yyyy"), [monthCursor]);
  const { state, loading, laneError, loadData, redirectToLogin } = useInsightsData({
    subjectUserId,
    selectedYear,
    failClosed: Boolean(readOnly && subjectUserId),
  });
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
          color: goal.color ?? "var(--muted-foreground)",
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
      const localToday = toLocalDateString();
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

      setPendingRetroDate(completionDate);
      const currentScrollY = window.scrollY;
      const { decision, mutation } = intent;

      const result = await runCompletionMutation({
        decision,
        desiredFactState: mutation.desiredFactState,
        goalId: mutation.goalId,
        date: mutation.date,
        timezone: resolveUserTimezone(),
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
    [pendingRetroDate, readOnly, refreshInsightsInBackground, runCompletionMutation]
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

      const localToday = toLocalDateString();
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

      setPendingRetroDate(completionDate);
      const currentScrollY = window.scrollY;
      const { decision, mutation } = intent;

      const result = await runCompletionMutation({
        decision,
        desiredFactState: mutation.desiredFactState,
        goalId: mutation.goalId,
        date: mutation.date,
        timezone: resolveUserTimezone(),
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
    [pendingRetroDate, readOnly, refreshInsightsInBackground, runCompletionMutation]
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

      setSavingMilestoneNamesGoalId(goal.id);
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
      } finally {
        setSavingMilestoneNamesGoalId(null);
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
  const showHeatmap =
    contentMode === "full" || contentMode === "overall-only";
  const showGoalStatsSection =
    contentMode === "full" || contentMode === "goal-stats-only";
  const showGoalsSection =
    contentMode === "full" || contentMode === "goals-only";
  // Duo both owns one shared stepper in InsightsShell.
  const showGoalStatsStepper = !sharedPeriod;
  const todayLocal = toLocalDateString();
  const heatmapEditable = ledgerMode === "edit" && !readOnly && Boolean(editableGoal);
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
  const milestoneNamesChanged = !areMilestoneNamesEqual(
    draftMilestoneNames,
    persistedMilestoneNames
  );
  const mappedMilestoneDates =
    editableProgress?.milestoneDates ??
    getSortedCompletionDates(editableCompletions).slice(0, milestoneTargetCount);

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
        <section className="border-b border-border pb-4" data-onboarding="insights.goal-stats">
          <div className="pb-3">
            <div
              data-title-date-row="true"
              className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <CalendarRange className="size-4 shrink-0 text-primary" />
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  Goal ledger
                </h2>
              </div>
              <div className="flex items-center gap-2 justify-self-center">
                {showGoalStatsStepper ? (
                  <InsightsPeriodStepper
                    monthCursor={monthCursor}
                    onMonthCursorChange={setMonthCursor}
                    perGoalViewMode={perGoalViewMode}
                  />
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="shrink-0"
                  aria-label="Open Progress filters"
                  title="Open Progress filters"
                  onClick={() => setGoalStatsFiltersOpen(true)}
                >
                  <SlidersHorizontal />
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <InsightsGoalStatsFilters
              goals={personalGoals}
              referenceMonth={goalFilterStartMonth}
              endMonths={effectiveGoalEndMonths}
              onEndMonthsChange={setGoalEndMonths}
              sort={goalSort}
              onSortChange={setGoalSort}
              viewMode={perGoalViewMode}
              onViewModeChange={setPerGoalViewMode}
              showEndedGoals={showHistoricalGoals}
              endedGoalCount={historicalGoals.length}
              onShowEndedGoalsChange={setShowHistoricalGoals}
              open={goalStatsFiltersOpen}
              onOpenChange={setGoalStatsFiltersOpen}
            />
            <Input
              value={goalSearchQuery}
              onChange={(event) => setGoalSearchQuery(event.target.value)}
              placeholder="Search goals..."
              className="h-8"
            />
          </div>
        </section>
      ) : null}

      {showGoalsSection || showHeatmap ? (
        <div className="flex flex-col-reverse gap-6 md:grid md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:items-start">
          {showGoalsSection ? (
            <ProgressGoalList
              goals={ledgerGoalItems}
              selectedGoalIds={selectedLedgerIdSet}
              readOnly={readOnly}
              onToggleGoal={(goalId) => {
                setSelectedGoalIds((current) =>
                  toggleLedgerGoalSelection(visibleGoalIds, current, goalId)
                );
              }}
            />
          ) : null}

          {showHeatmap ? (
        <div
          ref={aggregateHeatmapRef}
          className="space-y-3"
          data-onboarding="insights.overall"
          data-no-swipe="true"
          onTouchStart={
            perGoalViewMode === "month" ? onMonthSectionTouchStart : undefined
          }
          onTouchEnd={
            perGoalViewMode === "month" ? onMonthSectionTouchEnd : undefined
          }
        >
          <p className="text-sm text-muted-foreground">
            {progressLedgerCaption(
              ledgerMode,
              selectedLedgerGoalIds.length,
              editableGoal?.frequency_type === "fixed_milestones"
                ? "milestone"
                : "completion"
            )}
          </p>
          {ledgerMode === "empty" ? null : perGoalViewMode === "month" ? (
            <MonthHeatmap
              month={monthCursor}
              countsByDate={ledgerCountsByDate}
              interactive
              pendingDate={pendingRetroDate}
              isDayDisabled={
                heatmapEditable
                  ? (date) => !isLedgerHeatmapDayMutable(date, todayLocal)
                  : undefined
              }
              onDayClick={(date, sourceElement) =>
                handleLedgerDayClick(date, sourceElement)
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
                  const selectedDate = value?.date;
                  if (!selectedDate) {
                    return;
                  }
                  handleLedgerDayClick(selectedDate);
                }}
              />
            </div>
          )}
          {editableGoal?.frequency_type === "fixed_milestones" ? (
            <MilestonePills
              targetCount={milestoneTargetCount}
              completionDates={mappedMilestoneDates}
              milestoneNames={draftMilestoneNames}
              maxVisible={MAX_VISIBLE_MILESTONES}
            />
          ) : null}
          {heatmapEditable && editableGoal?.frequency_type === "fixed_milestones" ? (
            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Milestone names</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {Array.from({ length: milestoneTargetCount }).map((_, index) => (
                  <Input
                    key={`${editableGoal.id}-milestone-name-${index + 1}`}
                    value={draftMilestoneNames[index] ?? defaultMilestoneName(index)}
                    onChange={(event) =>
                      setMilestoneNameDrafts((previous) => {
                        const nextGoalNames = [
                          ...(previous[editableGoal.id] ?? persistedMilestoneNames),
                        ];
                        nextGoalNames[index] = event.target.value;
                        return {
                          ...previous,
                          [editableGoal.id]: nextGoalNames,
                        };
                      })
                    }
                    placeholder={defaultMilestoneName(index)}
                  />
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                disabled={
                  !milestoneNamesChanged ||
                  savingMilestoneNamesGoalId === editableGoal.id
                }
                onClick={() => {
                  void saveMilestoneNames(
                    editableGoal,
                    buildMilestoneNames(milestoneTargetCount, draftMilestoneNames)
                  );
                }}
              >
                {savingMilestoneNamesGoalId === editableGoal.id
                  ? "Saving..."
                  : "Save names"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
        </div>
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
                mutationLoading={false}
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
