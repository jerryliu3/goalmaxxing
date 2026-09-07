import {
  selectActiveGoals,
  selectArchivedGoals,
  selectEndedGoals,
  selectFilteredTodayGoals,
  selectTargetAchievedGoalIdsFromPresentations,
  selectUpcomingGoals,
  type RecurrenceGroup,
} from "@/features/today/checklist-selectors";
import type { TodayData } from "@/features/today/fetch-checklist-data";
import {
  buildCompletableGoalIds,
  selectCompletableGoals,
} from "@cadence/shared/goals/completable-goals";
import { projectChecklistPresentationsByGoalId } from "@/lib/goals/checklist-presentation";
import { groupCompletionsByGoalId } from "@/lib/goals/completion-grouping";
import { getGoalLifecycle } from "@/lib/goals/lifecycle";
import {
  filterGoalsByEndMonths,
  resolveEffectiveEndMonths,
  sortGoalsByDate,
  type GoalDateSort,
} from "@/lib/goals/list-view";
import { createChecklistTemporalContext } from "@/lib/goals/period-domain";
import { progressSummaryMap } from "@/lib/goals/progress-context";
import type { Goal } from "@/lib/goals/types";
import { selectSuppressedGoalIdsOnDate } from "@/lib/planner/link-suppression";
import { normalizeWeekStartsOn } from "@/lib/dates/week-start";

export interface ChecklistListModel {
  completableGoals: Goal[];
  activeGoals: Goal[];
  filteredTodayGoals: Goal[];
  filteredTodayGoalIds: Set<string>;
  upcoming: Goal[];
  pastGoals: Goal[];
  archivedGoals: Goal[];
  targetAchievedGoalIds: Set<string>;
  hiddenLinkedTargetGoalIds: ReadonlySet<string>;
  effectiveEndMonths: string[];
  presentationByGoalId: ReturnType<typeof projectChecklistPresentationsByGoalId>;
}

export function selectChecklistListModel({
  data,
  viewDate,
  todayLocalDate,
  categoryFilters,
  recurrenceFilters,
  searchQuery,
  todayEndMonths,
  todaySort,
  showTargetAchievedGoals,
  showSuppressedLinkedTargets,
}: {
  data: TodayData;
  viewDate: string;
  todayLocalDate: string;
  categoryFilters: string[];
  recurrenceFilters: RecurrenceGroup[];
  searchQuery: string;
  todayEndMonths: string[];
  todaySort: GoalDateSort;
  showTargetAchievedGoals: boolean;
  showSuppressedLinkedTargets: boolean;
}): ChecklistListModel {
  const completionsByGoal = groupCompletionsByGoalId(data.completions);
  const progressByGoal = progressSummaryMap(data.progress);
  const weeklyAnchor = {
    weekStartsOn: normalizeWeekStartsOn(data.progress?.weekStartsOn),
  };
  const completableGoalIds = buildCompletableGoalIds({
    goals: data.goals,
    userId: data.userId,
    memberTeamIds: data.memberTeamIds,
  });
  const completableGoals = selectCompletableGoals(data.goals, completableGoalIds);
  const lifecycleByGoalAtViewDate = new Map(
    data.goals.map((goal) => [
      goal.id,
      getGoalLifecycle(goal, { asOfDate: viewDate }),
    ])
  );
  const activeGoals = selectActiveGoals({
    completableGoals,
    lifecycleByGoalAtViewDate,
  });
  const effectiveEndMonths = resolveEffectiveEndMonths(
    todayEndMonths,
    viewDate.slice(0, 7)
  );
  const presentationByGoalId = projectChecklistPresentationsByGoalId({
    goals: activeGoals,
    completionsByGoal,
    progressByGoal,
    temporal: createChecklistTemporalContext({
      selectedDate: viewDate,
      asOfDate: todayLocalDate,
      weeklyAnchor,
    }),
  });
  const targetAchievedGoalIds =
    selectTargetAchievedGoalIdsFromPresentations(presentationByGoalId);
  const hiddenLinkedTargetGoalIds = selectSuppressedGoalIdsOnDate({
    goals: completableGoals,
    links: data.links,
    ownerId: data.userId,
    date: viewDate,
  });
  const hiddenForFilter = showSuppressedLinkedTargets
    ? new Set<string>()
    : hiddenLinkedTargetGoalIds;
  const filteredTodayGoals = selectFilteredTodayGoals({
    activeGoals,
    todayDate: viewDate,
    categoryFilters,
    recurrenceFilters,
    searchQuery,
    endMonths: effectiveEndMonths,
    targetAchievedGoalIds,
    showTargetAchievedGoals,
    hiddenLinkedTargetGoalIds: hiddenForFilter,
  });
  const prepareSupplementalGoals = (goals: Goal[]) =>
    sortGoalsByDate(filterGoalsByEndMonths(goals, effectiveEndMonths), todaySort);

  return {
    completableGoals,
    activeGoals,
    filteredTodayGoals,
    filteredTodayGoalIds: new Set(filteredTodayGoals.map((goal) => goal.id)),
    upcoming: prepareSupplementalGoals(
      selectUpcomingGoals(activeGoals, viewDate).filter(
        (goal) => !hiddenForFilter.has(goal.id)
      )
    ),
    pastGoals: prepareSupplementalGoals(
      selectEndedGoals({
        completableGoals,
        lifecycleByGoalAtViewDate,
      })
    ),
    archivedGoals: prepareSupplementalGoals(selectArchivedGoals(completableGoals)),
    targetAchievedGoalIds,
    hiddenLinkedTargetGoalIds,
    effectiveEndMonths,
    presentationByGoalId,
  };
}
