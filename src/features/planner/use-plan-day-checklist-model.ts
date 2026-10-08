"use client";

import { useMemo } from "react";
import { resolvePlannerShowTargetAchievedGoals } from "@/features/planner/calendar-filters";
import type { PlannerCalendarViewMode } from "@/features/planner/calendar-surface.types";
import { selectChecklistListModel } from "@/features/today/checklist-list-model";
import { getRecurrenceGroup, type RecurrenceGroup } from "@/features/today/checklist-selectors";
import { useChecklistCompletionActions } from "@/features/today/use-checklist-completion-actions";
import { useChecklistData } from "@/features/today/use-checklist-data";
import { useChecklistFilters } from "@/features/today/use-checklist-filters";
import { buildCategoryFilterOptions } from "@/lib/goals/category";
import { groupCompletionsByGoalId } from "@/lib/goals/completion-grouping";
import { applyOptimisticChecklistPresentations } from "@/lib/planner/optimistic-completion-facts";

const NO_RECURRENCE_FILTERS: RecurrenceGroup[] = [];

export function usePlanDayChecklistModel({
  isActive,
  viewDate,
  searchQuery,
  asOfDate = null,
  timezone = null,
  categoryFilters,
  onCategoryFiltersChange,
  goalIdFilters,
  endMonthFilters,
  onEndMonthFiltersChange,
  viewMode = "day",
  plannerShowCompletedGoals = false,
}: {
  isActive: boolean;
  viewDate: string;
  searchQuery: string;
  asOfDate?: string | null;
  timezone?: string | null;
  /** The planner's Category, Goal, and End month filters, shared by every view. */
  categoryFilters: string[];
  onCategoryFiltersChange: (value: string[]) => void;
  goalIdFilters: string[];
  endMonthFilters: string[];
  onEndMonthFiltersChange: (value: string[]) => void;
  viewMode?: PlannerCalendarViewMode;
  plannerShowCompletedGoals?: boolean;
}) {
  const filters = useChecklistFilters();
  const showTargetAchievedGoals = resolvePlannerShowTargetAchievedGoals({
    viewMode,
    dayFilterValue: filters.showTargetAchievedGoals,
    plannerShowCompletedGoals,
  });
  // Recurrence is a Day filter; Week and Month don't show it, so it doesn't apply there.
  const recurrenceFilters = viewMode === "day" ? filters.recurrenceFilters : NO_RECURRENCE_FILTERS;
  const { data, loading, todayLocalDate } =
    useChecklistData({
      isActive,
      viewDate,
      asOfDate,
      timezone,
    });
  const completionAsOfDate = asOfDate ?? todayLocalDate;
  const listModel = useMemo(
    () =>
      selectChecklistListModel({
        data,
        viewDate,
        todayLocalDate: completionAsOfDate,
        categoryFilters,
        recurrenceFilters,
        goalIdFilters,
        searchQuery,
        todayEndMonths: endMonthFilters,
        todaySort: filters.todaySort,
        showTargetAchievedGoals,
      }),
    [
      data,
      categoryFilters,
      recurrenceFilters,
      goalIdFilters,
      showTargetAchievedGoals,
      endMonthFilters,
      filters.todaySort,
      searchQuery,
      completionAsOfDate,
      viewDate,
    ]
  );
  const categoryOptions = useMemo(
    () => buildCategoryFilterOptions(data.goals),
    [data.goals]
  );
  const recurrenceGoalIds = useMemo(
    () =>
      recurrenceFilters.length === 0
        ? null
        : new Set(
            data.goals
              .filter((goal) => recurrenceFilters.includes(getRecurrenceGroup(goal)))
              .map((goal) => goal.id)
          ),
    [data.goals, recurrenceFilters]
  );
  const completionsByGoal = useMemo(
    () => groupCompletionsByGoalId(data.completions),
    [data.completions]
  );
  const { savingGoalId, toggleCompletion, optimisticFacts } = useChecklistCompletionActions({
    readOnly: false,
    viewDate,
    todayLocalDate: completionAsOfDate,
    timezone,
    completionsByGoal,
  });
  const mergedListModel = useMemo(
    () => ({
      ...listModel,
      presentationByGoalId: applyOptimisticChecklistPresentations(
        listModel.presentationByGoalId,
        optimisticFacts,
        viewDate
      ),
    }),
    [listModel, optimisticFacts, viewDate]
  );
  const ready = isActive && data.userId.length > 0;
  const visibilityOptions = [
    {
      label: "Show past goals",
      count: listModel.pastGoals.length,
      checked: filters.showEndedGoals,
      onChange: filters.setShowEndedGoals,
    },
    {
      label: "Show upcoming goals",
      count: listModel.upcoming.length,
      checked: filters.showUpcomingGoals,
      onChange: filters.setShowUpcomingGoals,
    },
    {
      label: "Show archived goals",
      count: listModel.archivedGoals.length,
      checked: filters.showArchivedGoals,
      onChange: filters.setShowArchivedGoals,
    },
    {
      label: "Show achieved goals",
      count: listModel.targetAchievedGoalIds.size,
      checked: showTargetAchievedGoals,
      onChange: filters.setShowTargetAchievedGoals,
    },
  ];
  const filterFormProps = {
    categoryFilterOptions: categoryOptions,
    categoryFilters,
    onCategoryFiltersChange,
    recurrenceQuickFilters: filters.recurrenceQuickFilters,
    recurrenceFilters: filters.recurrenceFilters,
    onRecurrenceFiltersChange: filters.setRecurrenceFilters,
    completableGoals: listModel.completableGoals,
    checklistFilterStartMonth: viewDate.slice(0, 7),
    effectiveTodayEndMonths: listModel.effectiveEndMonths,
    onTodayEndMonthsChange: onEndMonthFiltersChange,
    todaySort: filters.todaySort,
    onTodaySortChange: filters.setTodaySort,
    visibilityOptions,
  };

  return {
    ready,
    loading,
    data,
    todayLocalDate: completionAsOfDate,
    filters,
    listModel: mergedListModel,
    visibilityOptions,
    categoryOptions,
    /** Goals matching the Day Recurrence filter, or null when it is off. */
    recurrenceGoalIds,
    filterFormProps,
    savingGoalId,
    toggleCompletion,
    visibleGoalIds: ready ? listModel.filteredTodayGoalIds : null,
  };
}

export type PlanDayChecklistModel = ReturnType<typeof usePlanDayChecklistModel>;
