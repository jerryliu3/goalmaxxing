"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useChecklistCompletionActions } from "@/features/today/use-checklist-completion-actions";
import { useChecklistData } from "@/features/today/use-checklist-data";
import { useChecklistProjection } from "@/features/today/use-checklist-projection";
import {
  placedGoalIdsForDay,
  selectUnplannedGoals,
} from "@/features/planner/plan-day-unplanned";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import type { PlanDayChecklistModel } from "@/features/planner/use-plan-day-checklist-model";
import {
  buildCompletableGoalIds,
  selectCompletableGoals,
} from "@cadence/shared/goals/completable-goals";
import { groupCompletionsByGoalId } from "@/lib/goals/completion-grouping";
import { progressSummaryMap } from "@/lib/goals/progress-context";
import { normalizeWeekStartsOn } from "@/lib/dates/week-start";
import type { Goal } from "@/lib/goals/types";
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
  const [showUnplanned, setShowUnplanned] = useState(false);
  const placedGoalIds = useMemo(
    () => placedGoalIdsForDay(placedEntries),
    [placedEntries]
  );

  return (
    <Collapsible open={showUnplanned} onOpenChange={setShowUnplanned}>
      <CollapsibleTrigger
        className="flex w-full items-center justify-between gap-2 py-2 text-left text-sm font-medium touch-manipulation"
        aria-expanded={showUnplanned}
      >
        <span>Unplanned</span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-[var(--motion-duration-fast)]",
            showUnplanned && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        {checklist ? (
          <PlanDayUnplannedFromChecklist
            day={day}
            placedGoalIds={placedGoalIds}
            checklist={checklist}
          />
        ) : (
          <PlanDayUnplannedList day={day} placedGoalIds={placedGoalIds} />
        )}
      </CollapsibleContent>
    </Collapsible>
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
  const unplannedGoals = useMemo(() => {
    const selected = selectUnplannedGoals({
      goals: checklist.listModel.completableGoals,
      placedGoalIds,
      viewDate: day,
    });
    if (checklist.visibleGoalIds === null) {
      return selected;
    }
    return selected.filter((goal) => checklist.visibleGoalIds?.has(goal.id));
  }, [checklist.listModel.completableGoals, checklist.visibleGoalIds, day, placedGoalIds]);

  if (checklist.loading && checklist.data.goals.length === 0) {
    return <p className="text-sm text-muted-foreground">Loading unplanned work...</p>;
  }

  return (
    <PlanDayUnplannedRows
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

  if (loading && data.goals.length === 0) {
    return <p className="text-sm text-muted-foreground">Loading unplanned work...</p>;
  }

  return (
    <PlanDayUnplannedRows
      goals={unplannedGoals}
      presentationByGoalId={presentationByGoalId}
      savingGoalId={savingGoalId}
      onToggle={toggleCompletion}
    />
  );
}

function PlanDayUnplannedRows({
  goals,
  presentationByGoalId,
  savingGoalId,
  onToggle,
}: {
  goals: Goal[];
  presentationByGoalId: PlanDayChecklistModel["listModel"]["presentationByGoalId"];
  savingGoalId: string | null;
  onToggle: (goal: Goal, sourceElement: HTMLButtonElement) => void;
}) {
  if (goals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nothing unplanned for this day.</p>
    );
  }

  return (
    <div className="divide-y">
      {goals.map((goal) => {
        const presentation = presentationByGoalId.get(goal.id);
        const completed = Boolean(presentation?.exactDateCompleted);
        return (
          <div
            key={goal.id}
            className="flex items-center gap-3 py-3"
            data-plan-work-row="ledger"
          >
            <CompletionToggle
              completed={completed}
              pending={savingGoalId === goal.id}
              size="sm"
              chrome="plain"
              onClick={(event) => {
                if (
                  "currentTarget" in event &&
                  event.currentTarget instanceof HTMLButtonElement
                ) {
                  onToggle(goal, event.currentTarget);
                }
              }}
              disabled={savingGoalId === goal.id}
              aria-label={
                completed
                  ? `Mark ${goal.title} not done`
                  : `Mark ${goal.title} done`
              }
            />
            <p
              className={cn(
                "font-display min-w-0 flex-1 text-base font-medium tracking-tight",
                completed && "line-through"
              )}
            >
              {goal.title}
            </p>
          </div>
        );
      })}
    </div>
  );
}
