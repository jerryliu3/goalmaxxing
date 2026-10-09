import {
  matchesChecklistFilters,
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
  effectiveEndMonths: string[];
  presentationByGoalId: ReturnType<typeof projectChecklistPresentationsByGoalId>;
}

export function selectChecklistListModel({
  data,
  viewDate,
  todayLocalDate,
  categoryFilters,
  recurrenceFilters,
  goalIdFilters = [],
  searchQuery,
  todayEndMonths,
  todaySort,
  showTargetAchievedGoals,
}: {
  data: TodayData;
  viewDate: string;
  todayLocalDate: string;
  categoryFilters: string[];
  recurrenceFilters: RecurrenceGroup[];
  goalIdFilters?: string[];
  searchQuery: string;
  todayEndMonths: string[];
  todaySort: GoalDateSort;
  showTargetAchievedGoals: boolean;
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
  const filteredTodayGoals = selectFilteredTodayGoals({
    activeGoals,
    todayDate: viewDate,
    categoryFilters,
    recurrenceFilters,
    goalIdFilters,
    searchQuery,
    endMonths: effectiveEndMonths,
    targetAchievedGoalIds,
    showTargetAchievedGoals,
  });
  const prepareSupplementalGoals = (goals: Goal[]) =>
    sortGoalsByDate(
      filterGoalsByEndMonths(
        goals.filter((goal) =>
          matchesChecklistFilters({
            goal,
            categoryFilters,
            recurrenceFilters,
            goalIdFilters,
            searchQuery,
          })
        ),
        effectiveEndMonths
      ),
      todaySort
    );

  return {
    completableGoals,
    activeGoals,
    filteredTodayGoals,
    filteredTodayGoalIds: new Set(filteredTodayGoals.map((goal) => goal.id)),
    upcoming: prepareSupplementalGoals(
      selectUpcomingGoals(activeGoals, viewDate)
    ),
    pastGoals: prepareSupplementalGoals(
      selectEndedGoals({
        completableGoals,
        lifecycleByGoalAtViewDate,
      })
    ),
    archivedGoals: prepareSupplementalGoals(selectArchivedGoals(completableGoals)),
    targetAchievedGoalIds,
    effectiveEndMonths,
    presentationByGoalId,
  };
}
