"use client";

import { useState } from "react";
import {
  recurrenceFilterOptions,
  type RecurrenceGroup,
} from "@/features/today/checklist-selectors";
import type { GoalDateSort } from "@/lib/goals/list-view";

const recurrenceQuickFilters = recurrenceFilterOptions.filter(
  (option): option is { value: RecurrenceGroup; label: string } => option.value !== "all"
);

/** The Day checklist's own filters; Category, Goal, and End month are the planner's. */
export function useChecklistFilters() {
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [pastPanelOpen, setPastPanelOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [showEndedGoals, setShowEndedGoals] = useState(false);
  const [showUpcomingGoals, setShowUpcomingGoals] = useState(false);
  const [showArchivedGoals, setShowArchivedGoals] = useState(false);
  const [showTargetAchievedGoals, setShowTargetAchievedGoals] = useState(false);
  const [showSuppressedLinkedTargets, setShowSuppressedLinkedTargets] = useState(false);
  const [recurrenceFilters, setRecurrenceFilters] = useState<RecurrenceGroup[]>([]);
  const [todaySort, setTodaySort] = useState<GoalDateSort>("earliest_end");

  return {
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
    showSuppressedLinkedTargets,
    setShowSuppressedLinkedTargets,
    recurrenceFilters,
    setRecurrenceFilters,
    todaySort,
    setTodaySort,
    recurrenceQuickFilters,
  };
}
