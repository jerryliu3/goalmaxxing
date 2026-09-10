"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useChecklistCompletionActions } from "@/features/today/use-checklist-completion-actions";
import { useChecklistData } from "@/features/today/use-checklist-data";
import { useChecklistProjection } from "@/features/today/use-checklist-projection";
import { useCompletionCreditMove } from "@/features/planner/completion-credit-move";
import { planUnscheduledLedgerControlMode } from "@/features/planner/completion-entry-dispatch";
import {
  placedGoalIdsForDay,
  selectUnplannedGoals,
  selectVisibleUnplannedGoals,
} from "@/features/planner/plan-day-unplanned";
import {
  PlanLedgerCompletionControl,
  type PlanLedgerCompletionMode,
} from "@/features/planner/plan-ledger-completion-control";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import type { PlanDayChecklistModel } from "@/features/planner/use-plan-day-checklist-model";
import { planLedgerTitleClass } from "@/features/planner/calendar-day-chrome";
import {
  buildCompletableGoalIds,
  selectCompletableGoals,
} from "@cadence/shared/goals/completable-goals";
import { groupCompletionsByGoalId } from "@/lib/goals/completion-grouping";
import { progressSummaryMap } from "@/lib/goals/progress-context";
import { normalizeWeekStartsOn } from "@/lib/dates/week-start";
import type { Goal } from "@/lib/goals/types";
import { applyOptimisticChecklistPresentations } from "@/lib/planner/optimistic-completion-facts";
import { CompletionTitle } from "@/components/ui/completion-title";
import { cn } from "@/lib/utils";

export function PlanDayUnplannedPanel({
  day,
  placedEntries,
  checklist = null,
}: {
  day: string;
  placedEntries: PlannerDayDetailEntry[];
  checklist?: PlanDayChecklistModel | null;
}) {
  const placedGoalIds = useMemo(
    () => placedGoalIdsForDay(placedEntries),
    [placedEntries]
  );

  return checklist ? (
    <PlanDayUnplannedFromChecklist
      day={day}
      placedGoalIds={placedGoalIds}
      checklist={checklist}
    />
  ) : (
    <PlanDayUnplannedList
      day={day}
      placedGoalIds={placedGoalIds}
    />
  );
}

function PlanDayUnplannedFromChecklist({
  day,
  placedGoalIds,
  checklist,
}: {
  day: string;
  placedGoalIds: ReadonlySet<string>;
  checklist: PlanDayChecklistModel;
}) {
  const unplannedGoals = useMemo(
    () =>
      selectVisibleUnplannedGoals({
        goals: checklist.listModel.completableGoals,
        placedGoalIds,
        viewDate: day,
        visibleGoalIds: checklist.visibleGoalIds,
      }),
    [checklist.listModel.completableGoals, checklist.visibleGoalIds, day, placedGoalIds]
  );
  const loading = checklist.loading && checklist.data.goals.length === 0;

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading unscheduled work...</p>;
  }

  return (
    <PlanDayUnplannedRows
      day={day}
      asOfDate={checklist.todayLocalDate}
      goals={unplannedGoals}
      presentationByGoalId={checklist.listModel.presentationByGoalId}
      savingGoalId={checklist.savingGoalId}
      onToggle={checklist.toggleCompletion}
    />
  );
}

function PlanDayUnplannedList({
  day,
  placedGoalIds,
}: {
  day: string;
  placedGoalIds: ReadonlySet<string>;
}) {
  const { data, loading, loadData, redirectToLogin, todayLocalDate } = useChecklistData({
    isActive: true,
    viewDate: day,
  });
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
  const completableGoals = useMemo(() => {
    const completableGoalIds = buildCompletableGoalIds({
      goals: data.goals,
      userId: data.userId,
      memberTeamIds: data.memberTeamIds,
    });
    return selectCompletableGoals(data.goals, completableGoalIds);
  }, [data.goals, data.memberTeamIds, data.userId]);
  const unplannedGoals = useMemo(
    () =>
      selectUnplannedGoals({
        goals: completableGoals,
        placedGoalIds,
        viewDate: day,
      }),
    [completableGoals, day, placedGoalIds]
  );
  const { presentationByGoalId: projectedPresentationByGoalId } = useChecklistProjection({
    goals: unplannedGoals,
    completionsByGoal,
    progressByGoal,
    selectedDate: day,
    asOfDate: todayLocalDate,
    weeklyAnchor,
  });
  const { savingGoalId, toggleCompletion, optimisticFacts } = useChecklistCompletionActions({
    readOnly: false,
    viewDate: day,
    todayLocalDate,
    completionsByGoal,
    loadData,
    redirectToLogin,
  });
  const presentationByGoalId = useMemo(
    () =>
      applyOptimisticChecklistPresentations(
        projectedPresentationByGoalId,
        optimisticFacts,
        day
      ),
    [day, optimisticFacts, projectedPresentationByGoalId]
  );
  const loadingEmpty = loading && data.goals.length === 0;

  if (loadingEmpty) {
    return <p className="text-sm text-muted-foreground">Loading unscheduled work...</p>;
  }

  return (
    <PlanDayUnplannedRows
      day={day}
      asOfDate={todayLocalDate}
      goals={unplannedGoals}
      presentationByGoalId={presentationByGoalId}
      savingGoalId={savingGoalId}
      onToggle={toggleCompletion}
    />
  );
}

function PlanDayUnplannedRows({
  day,
  asOfDate,
  goals,
  presentationByGoalId,
  savingGoalId,
  onToggle,
}: {
  day: string;
  asOfDate: string | null;
  goals: Goal[];
  presentationByGoalId: PlanDayChecklistModel["listModel"]["presentationByGoalId"];
  savingGoalId: string | null;
  onToggle: (goal: Goal, sourceElement: HTMLButtonElement) => void;
}) {
  const creditMove = useCompletionCreditMove();
  if (goals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nothing unscheduled for this day.</p>
    );
  }

  return (
    <div className="divide-y">
      {goals.map((goal) => {
        const presentation = presentationByGoalId.get(goal.id);
        const completed = Boolean(presentation?.exactDateCompleted);
        const completionMode: PlanLedgerCompletionMode = planUnscheduledLedgerControlMode({
          currentlyCredited: completed,
          selectedDate: day,
          asOfDate,
          canMoveScheduledSession: Boolean(
            !completed && creditMove?.goalRequiresMove(goal.id, day)
          ),
        });
        return (
          <div
            key={goal.id}
            className="flex items-center gap-3 py-3"
            data-plan-work-row="ledger"
          >
            <PlanLedgerCompletionControl
              completed={completed}
              pending={savingGoalId === goal.id}
              mode={completionMode}
              label={goal.title}
              onToggle={(sourceElement) => onToggle(goal, sourceElement)}
            />
            <Link
              href={`/goals/${goal.id}`}
              className={cn(planLedgerTitleClass, "min-w-0 flex-1 hover:underline")}
            >
              <CompletionTitle completed={completed}>{goal.title}</CompletionTitle>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
