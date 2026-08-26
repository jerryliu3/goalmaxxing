"use client";

import { addDays, format, parseISO, subDays } from "date-fns";
import { SlidersHorizontal } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingCard } from "@/components/ui/loading-card";
import { ChecklistFiltersDialog } from "@/features/today/checklist-filters-dialog";
import { ChecklistPastPanels } from "@/features/today/checklist-past-panels";
import {
  groupGoalsByRecurrence,
  selectActiveGoals,
  selectArchivedGoals,
  selectTargetAchievedGoalIdsFromPresentations,
  selectEndedGoals,
  selectFilteredTodayGoals,
  selectUpcomingGoals,
  type RecurrenceGroup,
} from "@/features/today/checklist-selectors";
import { ChecklistTodayGroups } from "@/features/today/checklist-today-groups";
import { TodayHeaderCard } from "@/features/today/today-header-card";
import { GoalCard } from "@/features/today/goal-card";
import { useChecklistCompletionActions } from "@/features/today/use-checklist-completion-actions";
import {
  useChecklistFilters,
  type ChecklistSharedFilters,
} from "@/features/today/use-checklist-filters";
import { useChecklistData } from "@/features/today/use-checklist-data";
import { PlannerTasksPanel } from "@/features/tasks/planner-tasks-panel";
import {
  buildCompletableGoalIds,
  selectCompletableGoals,
} from "@cadence/shared/goals/completable-goals";
import { normalizeWeekStartsOn } from "@/lib/dates/week-start";
import { getGoalLifecycle } from "@/lib/goals/lifecycle";
import {
  filterGoalsByEndMonths,
  resolveEffectiveEndMonths,
  sortGoalsByDate,
} from "@/lib/goals/list-view";
import { groupCompletionsByGoalId } from "@/lib/goals/completion-grouping";
import { useChecklistProjection } from "@/features/today/use-checklist-projection";
import { progressSummaryMap } from "@/lib/goals/progress-context";
import type { Goal } from "@/lib/goals/types";

export type { ChecklistSharedFilters };
export type ChecklistTabContentMode = "full" | "filters-only" | "goals-only";

interface TodayTabProps {
  isActive?: boolean;
  subjectUserId?: string;
  readOnly?: boolean;
  sharedFilters?: ChecklistSharedFilters;
  showFiltersSection?: boolean;
  contentMode?: ChecklistTabContentMode;
}

export function TodayTab({
  isActive = true,
  subjectUserId,
  readOnly = false,
  sharedFilters,
  showFiltersSection = true,
  contentMode = "full",
}: TodayTabProps = {}) {
  const filters = useChecklistFilters(sharedFilters);
  const {
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
  } = filters;

  const { data, loading, laneError, loadData, redirectToLogin, todayLocalDate } =
    useChecklistData({
      subjectUserId,
      isActive,
      viewDate,
      failClosed: Boolean(readOnly && subjectUserId),
    });

  const viewDateObj = useMemo(() => parseISO(viewDate), [viewDate]);
  const viewingToday = viewDate === todayLocalDate;

  const completionsByGoal = useMemo(
    () => groupCompletionsByGoalId(data.completions),
    [data.completions]
  );
  const progressByGoal = useMemo(
    () => progressSummaryMap(data.progress),
    [data.progress]
  );
  const weeklyAnchor = useMemo(
    () => ({
      weekStartsOn: normalizeWeekStartsOn(data.progress?.weekStartsOn),
    }),
    [data.progress?.weekStartsOn]
  );
  const lifecycleByGoalAtViewDate = useMemo(
    () =>
      new Map(
        data.goals.map((goal) => [
          goal.id,
          getGoalLifecycle(goal, { asOfDate: viewDate }),
        ])
      ),
    [data.goals, viewDate]
  );

  const completableGoalIds = useMemo(
    () =>
      buildCompletableGoalIds({
        goals: data.goals,
        userId: data.userId,
        memberTeamIds: data.memberTeamIds,
      }),
    [data.goals, data.memberTeamIds, data.userId]
  );

  const completableGoals = useMemo(
    () => selectCompletableGoals(data.goals, completableGoalIds),
    [completableGoalIds, data.goals]
  );
  const linkedCountByGoalId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const link of data.links) {
      counts.set(link.source_goal_id, (counts.get(link.source_goal_id) ?? 0) + 1);
    }
    return counts;
  }, [data.links]);

  const activeGoals = useMemo(
    () =>
      selectActiveGoals({
        completableGoals,
        lifecycleByGoalAtViewDate,
      }),
    [completableGoals, lifecycleByGoalAtViewDate]
  );

  const todayDate = viewDate;
  const checklistFilterStartMonth = viewDate.slice(0, 7);
  const effectiveTodayEndMonths = resolveEffectiveEndMonths(
    todayEndMonths,
    checklistFilterStartMonth
  );
  const { presentationByGoalId, greenGoalIds } = useChecklistProjection({
    goals: activeGoals,
    completionsByGoal,
    progressByGoal,
    selectedDate: viewDate,
    asOfDate: todayLocalDate,
    weeklyAnchor,
  });
  const targetAchievedGoalIds = useMemo(
    () => selectTargetAchievedGoalIdsFromPresentations(presentationByGoalId),
    [presentationByGoalId]
  );

  const { savingGoalId, recentlyCompletedGoalId, toggleCompletion } =
    useChecklistCompletionActions({
      readOnly,
      viewDate,
      todayLocalDate,
      weeklyAnchor,
      completionsByGoal,
      loadData,
      redirectToLogin,
    });

  const filteredTodayGoals = useMemo(
    () =>
      selectFilteredTodayGoals({
        activeGoals,
        todayDate,
        categoryFilters,
        recurrenceFilters,
        searchQuery: todayGoalSearchQuery,
        endMonths: effectiveTodayEndMonths,
        targetAchievedGoalIds,
        showTargetAchievedGoals,
      }),
    [
      activeGoals,
      categoryFilters,
      targetAchievedGoalIds,
      effectiveTodayEndMonths,
      recurrenceFilters,
      showTargetAchievedGoals,
      todayDate,
      todayGoalSearchQuery,
    ]
  );

  const prioritizeIncompleteGoals = useCallback(
    (goals: Goal[]) => {
      const byDate = sortGoalsByDate(goals, todaySort);
      return [...byDate].sort((left, right) => {
        const leftCompleted =
          greenGoalIds.has(left.id) && left.id !== recentlyCompletedGoalId;
        const rightCompleted =
          greenGoalIds.has(right.id) && right.id !== recentlyCompletedGoalId;
        if (leftCompleted === rightCompleted) {
          return 0;
        }
        return leftCompleted ? 1 : -1;
      });
    },
    [greenGoalIds, recentlyCompletedGoalId, todaySort]
  );

  const todayGoalsSorted = useMemo(
    () => prioritizeIncompleteGoals(filteredTodayGoals),
    [filteredTodayGoals, prioritizeIncompleteGoals]
  );

  const groupedTodayGoalsForAll = useMemo(
    () =>
      recurrenceFilters.length === 0
        ? groupGoalsByRecurrence(filteredTodayGoals, todaySort).map((group) => ({
            ...group,
            goals: prioritizeIncompleteGoals(group.goals),
          }))
        : [],
    [filteredTodayGoals, prioritizeIncompleteGoals, recurrenceFilters, todaySort]
  );

  const prepareSupplementalGoals = useCallback(
    (goals: Goal[]) =>
      sortGoalsByDate(
        filterGoalsByEndMonths(goals, effectiveTodayEndMonths),
        todaySort
      ),
    [effectiveTodayEndMonths, todaySort]
  );

  const upcoming = useMemo(
    () => prepareSupplementalGoals(selectUpcomingGoals(activeGoals, todayDate)),
    [activeGoals, prepareSupplementalGoals, todayDate]
  );

  const pastGoals = useMemo(
    () =>
      prepareSupplementalGoals(
        selectEndedGoals({
          completableGoals,
          lifecycleByGoalAtViewDate,
        })
      ),
    [completableGoals, lifecycleByGoalAtViewDate, prepareSupplementalGoals]
  );

  const archivedGoals = useMemo(
    () => prepareSupplementalGoals(selectArchivedGoals(completableGoals)),
    [completableGoals, prepareSupplementalGoals]
  );

  const renderGoalCard = useCallback(
    (goal: Goal, options?: { archived?: boolean; key?: string }) => {
      const archived = options?.archived ?? false;
      return (
        <GoalCard
          key={options?.key ?? goal.id}
          goal={goal}
          completions={completionsByGoal.get(goal.id) ?? []}
          progress={progressByGoal.get(goal.id)}
          presentation={presentationByGoalId.get(goal.id)}
          linkedCount={linkedCountByGoalId.get(goal.id) ?? 0}
          imageUrl={data.photoUrls[goal.id]}
          disabled={archived || savingGoalId === goal.id}
          archived={archived}
          selectedDate={viewDate}
          referenceDate={viewDateObj}
          weeklyAnchor={weeklyAnchor}
          {...(readOnly
            ? { readOnly: true as const }
            : {
                readOnly: false as const,
                onToggle: (sourceElement: HTMLButtonElement) =>
                  toggleCompletion(goal, sourceElement),
              })}
        />
      );
    },
    [
      completionsByGoal,
      data.photoUrls,
      linkedCountByGoalId,
      progressByGoal,
      presentationByGoalId,
      readOnly,
      savingGoalId,
      toggleCompletion,
      viewDate,
      viewDateObj,
      weeklyAnchor,
    ]
  );

  const quickCategories = quickCategoryOptions(data.goals);
  const filterVisibilityOptions = [
    {
      label: "Show past goals",
      count: pastGoals.length,
      checked: showEndedGoals,
      onChange: setShowEndedGoals,
    },
    {
      label: "Show upcoming goals",
      count: upcoming.length,
      checked: showUpcomingGoals,
      onChange: setShowUpcomingGoals,
    },
    {
      label: "Show archived goals",
      count: archivedGoals.length,
      checked: showArchivedGoals,
      onChange: setShowArchivedGoals,
    },
    {
      label: "Show completed goals",
      count: targetAchievedGoalIds.size,
      checked: showTargetAchievedGoals,
      onChange: setShowTargetAchievedGoals,
    },
  ];

  const showFilterContainer =
    showFiltersSection && (contentMode === "full" || contentMode === "filters-only");
  const showGoalSections = contentMode === "full" || contentMode === "goals-only";

  if (loading) {
    return (
      <div className="space-y-5">
        <LoadingCard
          title="Loading your goals..."
          description="Pulling your latest status."
        />
      </div>
    );
  }

  if (laneError) {
    return <p className="px-1 text-sm text-muted-foreground">{laneError}</p>;
  }

  return (
    <div className="space-y-5">
      {showFilterContainer ? (
        <TodayHeaderCard
          viewDate={viewDate}
          todayLocalDate={todayLocalDate}
          viewingToday={viewingToday}
          onViewDateChange={setViewDate}
          onGoToPreviousDate={() =>
            setViewDate(format(subDays(viewDateObj, 1), "yyyy-MM-dd"))
          }
          onGoToNextDate={() =>
            setViewDate(format(addDays(viewDateObj, 1), "yyyy-MM-dd"))
          }
          onResetToToday={() => setViewDate(todayLocalDate)}
          datePickerControls={
            <>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={() => setTodayFiltersOpen(true)}
                aria-label="Open checklist filters"
                title="Open checklist filters"
              >
                <SlidersHorizontal className="size-3.5" />
              </Button>
              <ChecklistFiltersDialog
                open={todayFiltersOpen}
                onOpenChange={setTodayFiltersOpen}
                categoryFilterOptions={categoryFilterOptions}
                categoryFilters={categoryFilters}
                onCategoryFiltersChange={setCategoryFilters}
                recurrenceQuickFilters={recurrenceQuickFilters}
                recurrenceFilters={recurrenceFilters}
                onRecurrenceFiltersChange={setRecurrenceFilters}
                completableGoals={completableGoals}
                checklistFilterStartMonth={checklistFilterStartMonth}
                effectiveTodayEndMonths={effectiveTodayEndMonths}
                onTodayEndMonthsChange={setTodayEndMonths}
                todaySort={todaySort}
                onTodaySortChange={setTodaySort}
                visibilityOptions={filterVisibilityOptions}
              />
            </>
          }
          searchControls={
            <Input
              value={todayGoalSearchQuery}
              onChange={(event) => setTodayGoalSearchQuery(event.target.value)}
              placeholder="Search checklist goals..."
              className="h-8 w-full"
            />
          }
          quickFilterControls={
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1">
              <Button
                key="recurrence-quick-all"
                type="button"
                variant={recurrenceFilters.length === 0 ? "default" : "outline"}
                size="sm"
                className="h-8 shrink-0 rounded-full px-3 text-xs"
                onClick={() => setRecurrenceFilters([])}
              >
                All types
              </Button>
              {recurrenceQuickFilters.map((option) => (
                <Button
                  key={`recurrence-quick-${option.value}`}
                  type="button"
                  variant={
                    recurrenceFilters.includes(option.value) ? "default" : "outline"
                  }
                  size="sm"
                  className="h-8 shrink-0 rounded-full px-3 text-xs"
                  onClick={() => toggleRecurrenceFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
              <Button
                key="category-quick-all"
                type="button"
                variant={categoryFilters.length === 0 ? "default" : "outline"}
                size="sm"
                className="h-8 shrink-0 rounded-full px-3 text-xs"
                onClick={() => setCategoryFilters([])}
              >
                All categories
              </Button>
              {quickCategories.map((category) => (
                <Button
                  key={`category-quick-${category.key}`}
                  type="button"
                  variant={
                    categoryFilters.includes(category.key) ? "default" : "outline"
                  }
                  size="sm"
                  className="h-8 shrink-0 rounded-full px-3 text-xs"
                  onClick={() => toggleCategoryFilter(category.key)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          }
        />
      ) : null}

      {showGoalSections ? (
        <ChecklistTodayGroups
          selectedRecurrenceFilters={recurrenceFilters}
          groups={groupedTodayGoalsForAll}
          sortedGoals={todayGoalsSorted}
          expandedGroups={expandedGroups}
          onToggleGroup={(group) =>
            setExpandedGroups((previous) => ({
              ...previous,
              [group]: !previous[group],
            }))
          }
          renderGoal={renderGoalCard}
        />
      ) : null}

      {showGoalSections && !readOnly ? (
        <div className="pt-3">
          <PlannerTasksPanel
            title="Tasks"
            description={null}
            scheduledDate={viewDate}
            allowCreate={false}
            hideWhenEmpty
          />
        </div>
      ) : null}

      {showGoalSections &&
      (showUpcomingGoals || showEndedGoals || showArchivedGoals) ? (
        <ChecklistPastPanels
          upcoming={upcoming}
          pastGoals={pastGoals}
          archivedGoals={archivedGoals}
          showUpcoming={showUpcomingGoals}
          showEnded={showEndedGoals}
          showArchived={showArchivedGoals}
          upcomingOpen={upcomingOpen}
          pastPanelOpen={pastPanelOpen}
          archiveOpen={archiveOpen}
          onUpcomingOpenChange={setUpcomingOpen}
          onPastPanelOpenChange={setPastPanelOpen}
          onArchiveOpenChange={setArchiveOpen}
          renderGoal={renderGoalCard}
        />
      ) : null}
    </div>
  );
}
