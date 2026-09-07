"use client";

import { useMemo, type ReactNode } from "react";
import { selectChecklistListModel } from "@/features/today/checklist-list-model";
import { useChecklistCompletionActions } from "@/features/today/use-checklist-completion-actions";
import { useChecklistData } from "@/features/today/use-checklist-data";
import { useChecklistFilters } from "@/features/today/use-checklist-filters";
import { groupCompletionsByGoalId } from "@/lib/goals/completion-grouping";

export function usePlanDayChecklistModel({
  enabled,
  viewDate,
  searchQuery,
}: {
  enabled: boolean;
  viewDate: string;
  searchQuery: string;
}) {
  const filters = useChecklistFilters();
  const { data, loading, loadData, redirectToLogin, todayLocalDate } =
    useChecklistData({
      isActive: enabled,
      viewDate,
    });
  const listModel = useMemo(
    () =>
      selectChecklistListModel({
        data,
        viewDate,
        todayLocalDate,
        categoryFilters: filters.categoryFilters,
        recurrenceFilters: filters.recurrenceFilters,
        searchQuery,
        todayEndMonths: filters.todayEndMonths,
        todaySort: filters.todaySort,
        showTargetAchievedGoals: filters.showTargetAchievedGoals,
        showSuppressedLinkedTargets: filters.showSuppressedLinkedTargets,
      }),
    [
      data,
      filters.categoryFilters,
      filters.recurrenceFilters,
      filters.showSuppressedLinkedTargets,
      filters.showTargetAchievedGoals,
      filters.todayEndMonths,
      filters.todaySort,
      searchQuery,
      todayLocalDate,
      viewDate,
    ]
  );
  const completionsByGoal = useMemo(
    () => groupCompletionsByGoalId(data.completions),
    [data.completions]
  );
  const { savingGoalId, toggleCompletion } = useChecklistCompletionActions({
    readOnly: false,
    viewDate,
    todayLocalDate,
    completionsByGoal,
    loadData,
    redirectToLogin,
  });
  const ready = enabled && data.userId.length > 0;
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
      label: "Show completed goals",
      count: listModel.targetAchievedGoalIds.size,
      checked: filters.showTargetAchievedGoals,
      onChange: filters.setShowTargetAchievedGoals,
    },
    {
      label: "Show suppressed linked goals",
      count: listModel.hiddenLinkedTargetGoalIds.size,
      checked: filters.showSuppressedLinkedTargets,
      onChange: filters.setShowSuppressedLinkedTargets,
    },
  ];
  const quickCategories = filters.quickCategoryOptions(data.goals);
  const filterFormProps = {
    categoryFilterOptions: filters.categoryFilterOptions,
    categoryFilters: filters.categoryFilters,
    onCategoryFiltersChange: filters.setCategoryFilters,
    recurrenceQuickFilters: filters.recurrenceQuickFilters,
    recurrenceFilters: filters.recurrenceFilters,
    onRecurrenceFiltersChange: filters.setRecurrenceFilters,
    completableGoals: listModel.completableGoals,
    checklistFilterStartMonth: viewDate.slice(0, 7),
    effectiveTodayEndMonths: listModel.effectiveEndMonths,
    onTodayEndMonthsChange: filters.setTodayEndMonths,
    todaySort: filters.todaySort,
    onTodaySortChange: filters.setTodaySort,
    visibilityOptions,
  };

  return {
    enabled,
    ready,
    loading,
    data,
    todayLocalDate,
    filters,
    listModel,
    visibilityOptions,
    quickCategories,
    filterFormProps,
    savingGoalId,
    toggleCompletion,
    visibleGoalIds: ready ? listModel.filteredTodayGoalIds : null,
  };
}

export type PlanDayChecklistModel = ReturnType<typeof usePlanDayChecklistModel>;

export function PlanDayChecklistProvider({
  viewDate,
  searchQuery,
  children,
}: {
  viewDate: string;
  searchQuery: string;
  children: (model: PlanDayChecklistModel) => ReactNode;
}) {
  const model = usePlanDayChecklistModel({
    enabled: true,
    viewDate,
    searchQuery,
  });
  return children(model);
}
