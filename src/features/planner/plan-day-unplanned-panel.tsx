"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { GoalCard } from "@/features/today/goal-card";
import { useChecklistCompletionActions } from "@/features/today/use-checklist-completion-actions";
import { useChecklistData } from "@/features/today/use-checklist-data";
import { useChecklistProjection } from "@/features/today/use-checklist-projection";
import {
  placedGoalIdsForDay,
  selectUnplannedGoals,
} from "@/features/planner/plan-day-unplanned";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import {
  buildCompletableGoalIds,
  selectCompletableGoals,
} from "@cadence/shared/goals/completable-goals";
import { groupCompletionsByGoalId } from "@/lib/goals/completion-grouping";
import { progressSummaryMap } from "@/lib/goals/progress-context";
import { normalizeWeekStartsOn } from "@/lib/dates/week-start";

export function PlanDayUnplannedPanel({
  day,
  placedEntries,
}: {
  day: string;
  placedEntries: PlannerDayDetailEntry[];
}) {
  const [showUnplanned, setShowUnplanned] = useState(false);
  const placedGoalIds = useMemo(
    () => placedGoalIdsForDay(placedEntries),
    [placedEntries]
  );

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-pressed={showUnplanned}
        onClick={() => setShowUnplanned((open) => !open)}
      >
        Show unplanned
      </Button>
      {showUnplanned ? (
        <PlanDayUnplannedList day={day} placedGoalIds={placedGoalIds} />
      ) : null}
    </div>
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
  const { presentationByGoalId } = useChecklistProjection({
    goals: unplannedGoals,
    completionsByGoal,
    progressByGoal,
    selectedDate: day,
    asOfDate: todayLocalDate,
    weeklyAnchor,
  });
  const { savingGoalId, toggleCompletion } = useChecklistCompletionActions({
    readOnly: false,
    viewDate: day,
    todayLocalDate,
    completionsByGoal,
    loadData,
    redirectToLogin,
  });
  const linkedCountByGoalId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const link of data.links) {
      counts.set(link.source_goal_id, (counts.get(link.source_goal_id) ?? 0) + 1);
    }
    return counts;
  }, [data.links]);

  if (loading && data.goals.length === 0) {
    return <p className="text-sm text-muted-foreground">Loading unplanned work...</p>;
  }

  if (unplannedGoals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nothing unplanned for this day.</p>
    );
  }

  return (
    <div className="space-y-2">
      {unplannedGoals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          completions={completionsByGoal.get(goal.id) ?? []}
          progress={progressByGoal.get(goal.id)}
          presentation={presentationByGoalId.get(goal.id)}
          linkedCount={linkedCountByGoalId.get(goal.id) ?? 0}
          imageUrl={data.photoUrls[goal.id]}
          disabled={savingGoalId === goal.id}
          selectedDate={day}
          onToggle={(sourceElement) => toggleCompletion(goal, sourceElement)}
        />
      ))}
    </div>
  );
}
