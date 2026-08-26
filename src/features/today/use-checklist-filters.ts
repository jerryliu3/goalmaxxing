"use client";

import { useCallback, useMemo, useState } from "react";
import { toLocalDateString } from "@/lib/dates/day";
import {
  INITIAL_GROUP_EXPANDED,
  recurrenceFilterOptions,
  type RecurrenceGroup,
} from "@/features/today/checklist-selectors";
import {
  DEFAULT_GOAL_CATEGORIES,
  resolveCategoryKey,
} from "@/lib/goals/category";
import type { GoalDateSort } from "@/lib/goals/list-view";
import type { Goal } from "@/lib/goals/types";

export interface ChecklistSharedFilters {
  viewDate: string;
  setViewDate: (value: string) => void;
  showEndedGoals: boolean;
  setShowEndedGoals: (value: boolean) => void;
  showUpcomingGoals: boolean;
  setShowUpcomingGoals: (value: boolean) => void;
  showArchivedGoals: boolean;
  setShowArchivedGoals: (value: boolean) => void;
  showTargetAchievedGoals: boolean;
  setShowTargetAchievedGoals: (value: boolean) => void;
  categoryFilters: string[];
  setCategoryFilters: (value: string[]) => void;
  recurrenceFilters: RecurrenceGroup[];
  setRecurrenceFilters: (value: RecurrenceGroup[]) => void;
  todayGoalSearchQuery: string;
  setTodayGoalSearchQuery: (value: string) => void;
  todayEndMonths: string[];
  setTodayEndMonths: (value: string[]) => void;
  todaySort: GoalDateSort;
  setTodaySort: (value: GoalDateSort) => void;
}

export function useChecklistFilters(sharedFilters?: ChecklistSharedFilters) {
  const [expandedGroups, setExpandedGroups] =
    useState<Record<RecurrenceGroup, boolean>>(INITIAL_GROUP_EXPANDED);
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [pastPanelOpen, setPastPanelOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [internalShowEndedGoals, setInternalShowEndedGoals] = useState(false);
  const [internalShowUpcomingGoals, setInternalShowUpcomingGoals] = useState(false);
  const [internalShowArchivedGoals, setInternalShowArchivedGoals] = useState(false);
  const [internalShowTargetAchievedGoals, setInternalShowTargetAchievedGoals] =
    useState(false);
  const [internalCategoryFilters, setInternalCategoryFilters] = useState<string[]>([]);
  const [internalRecurrenceFilters, setInternalRecurrenceFilters] = useState<
    RecurrenceGroup[]
  >([]);
  const [internalTodayGoalSearchQuery, setInternalTodayGoalSearchQuery] = useState("");
  const [todayFiltersOpen, setTodayFiltersOpen] = useState(false);
  const [internalViewDate, setInternalViewDate] = useState(toLocalDateString());
  const [internalTodayEndMonths, setInternalTodayEndMonths] = useState<string[]>([]);
  const [internalTodaySort, setInternalTodaySort] =
    useState<GoalDateSort>("earliest_end");

  const showEndedGoals = sharedFilters?.showEndedGoals ?? internalShowEndedGoals;
  const setShowEndedGoals =
    sharedFilters?.setShowEndedGoals ?? setInternalShowEndedGoals;
  const showUpcomingGoals =
    sharedFilters?.showUpcomingGoals ?? internalShowUpcomingGoals;
  const setShowUpcomingGoals =
    sharedFilters?.setShowUpcomingGoals ?? setInternalShowUpcomingGoals;
  const showArchivedGoals =
    sharedFilters?.showArchivedGoals ?? internalShowArchivedGoals;
  const setShowArchivedGoals =
    sharedFilters?.setShowArchivedGoals ?? setInternalShowArchivedGoals;
  const showTargetAchievedGoals =
    sharedFilters?.showTargetAchievedGoals ?? internalShowTargetAchievedGoals;
  const setShowTargetAchievedGoals =
    sharedFilters?.setShowTargetAchievedGoals ?? setInternalShowTargetAchievedGoals;
  const categoryFilters = sharedFilters?.categoryFilters ?? internalCategoryFilters;
  const setCategoryFilters =
    sharedFilters?.setCategoryFilters ?? setInternalCategoryFilters;
  const recurrenceFilters =
    sharedFilters?.recurrenceFilters ?? internalRecurrenceFilters;
  const setRecurrenceFilters =
    sharedFilters?.setRecurrenceFilters ?? setInternalRecurrenceFilters;
  const todayGoalSearchQuery =
    sharedFilters?.todayGoalSearchQuery ?? internalTodayGoalSearchQuery;
  const setTodayGoalSearchQuery =
    sharedFilters?.setTodayGoalSearchQuery ?? setInternalTodayGoalSearchQuery;
  const viewDate = sharedFilters?.viewDate ?? internalViewDate;
  const setViewDate = sharedFilters?.setViewDate ?? setInternalViewDate;
  const todayEndMonths = sharedFilters?.todayEndMonths ?? internalTodayEndMonths;
  const setTodayEndMonths =
    sharedFilters?.setTodayEndMonths ?? setInternalTodayEndMonths;
  const todaySort = sharedFilters?.todaySort ?? internalTodaySort;
  const setTodaySort = sharedFilters?.setTodaySort ?? setInternalTodaySort;

  const availableCategories = useMemo(
    () =>
      [...DEFAULT_GOAL_CATEGORIES]
        .sort((left, right) => {
          if (left.sortOrder !== right.sortOrder) {
            return left.sortOrder - right.sortOrder;
          }
          return left.label.localeCompare(right.label);
        })
        .map((category) => ({ key: category.key, label: category.label })),
    []
  );

  const quickCategoryOptions = useCallback(
    (goals: Goal[]) => {
      const userKeys = new Set(
        goals.map((goal) => resolveCategoryKey(goal.category_key ?? goal.category))
      );
      const fromUser = availableCategories.filter((category) =>
        userKeys.has(category.key)
      );
      const picked = [...fromUser];
      for (const preset of availableCategories) {
        if (picked.length >= 4) {
          break;
        }
        if (!picked.some((option) => option.key === preset.key)) {
          picked.push(preset);
        }
      }
      return picked.slice(0, 4);
    },
    [availableCategories]
  );

  const categoryFilterOptions = useMemo(
    () =>
      availableCategories.map((category) => ({
        value: category.key,
        label: category.label,
      })),
    [availableCategories]
  );

  const recurrenceQuickFilters = useMemo(
    () =>
      recurrenceFilterOptions.filter(
        (option): option is { value: RecurrenceGroup; label: string } =>
          option.value !== "all"
      ),
    []
  );

  const toggleCategoryFilter = useCallback(
    (categoryKey: string) => {
      setCategoryFilters(
        categoryFilters.includes(categoryKey)
          ? categoryFilters.filter((key) => key !== categoryKey)
          : [...categoryFilters, categoryKey]
      );
    },
    [categoryFilters, setCategoryFilters]
  );

  const toggleRecurrenceFilter = useCallback(
    (recurrence: RecurrenceGroup) => {
      setRecurrenceFilters(
        recurrenceFilters.includes(recurrence)
          ? recurrenceFilters.filter((value) => value !== recurrence)
          : [...recurrenceFilters, recurrence]
      );
    },
    [recurrenceFilters, setRecurrenceFilters]
  );

  return {
    expandedGroups,
    setExpandedGroups,
    upcomingOpen,
    setUpcomingOpen,
    pastPanelOpen,
    setPastPanelOpen,
    archiveOpen,
    setArchiveOpen,
    showEndedGoals,
    setShowEndedGoals,
    showUpcomingGoals,
    setShowUpcomingGoals,
    showArchivedGoals,
    setShowArchivedGoals,
    showTargetAchievedGoals,
    setShowTargetAchievedGoals,
    categoryFilters,
    setCategoryFilters,
    recurrenceFilters,
    setRecurrenceFilters,
    todayGoalSearchQuery,
    setTodayGoalSearchQuery,
    viewDate,
    setViewDate,
    todayEndMonths,
    setTodayEndMonths,
    todaySort,
    setTodaySort,
    todayFiltersOpen,
    setTodayFiltersOpen,
    categoryFilterOptions,
    recurrenceQuickFilters,
    quickCategoryOptions,
    toggleCategoryFilter,
    toggleRecurrenceFilter,
  };
}
