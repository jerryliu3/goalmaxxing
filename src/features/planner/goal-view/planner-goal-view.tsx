"use client";

import { useMemo } from "react";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import { normalizeWeekStartsOn } from "@/lib/dates/week-start";
import type { Goal } from "@/lib/goals/types";
import type { OptimisticCompletionFacts } from "@/lib/planner/optimistic-completion-facts";
import { resolveGoalSessionCompletion } from "./goal-session-completion";
import { GoalView } from "./goal-view";
import type { GoalViewSession } from "./goal-view-model";

export interface PlannerGoalViewProps {
  goals: Goal[];
  /** Goals whose target is met; hidden unless `showCompletedGoals`. */
  completedGoalIds: ReadonlySet<string>;
  showCompletedGoals: boolean;
  progressSummaries: ProgressContextSummary[];
  sessions: GoalViewSession[];
  today: string;
  weekStartsOn: number | null | undefined;
  showPast: boolean;
  previewOpen: boolean;
  onPreviewOpenChange: (open: boolean) => void;
  canMutatePlanItems: boolean;
  optimisticCompletionFacts: OptimisticCompletionFacts;
  mutationLoadingKey: string | null;
  canOpenEntry: (entry: PlannerDayDetailEntry) => boolean;
  canMutateEntryOnDay: (entry: PlannerDayDetailEntry, day: string) => boolean;
  onMoveEntry: (entry: PlannerDayDetailEntry, date: string) => void;
  onToggleEntry: (
    entry: PlannerDayDetailEntry,
    day: string,
    source: HTMLButtonElement
  ) => void;
}

/**
 * Binds Goal View to the planner's permissions, completion state and
 * commands, so the view itself stays free of planner plumbing.
 */
export function PlannerGoalView({
  goals,
  completedGoalIds,
  showCompletedGoals,
  progressSummaries,
  sessions,
  weekStartsOn,
  canMutatePlanItems,
  optimisticCompletionFacts,
  mutationLoadingKey,
  canOpenEntry,
  canMutateEntryOnDay,
  onMoveEntry,
  onToggleEntry,
  ...view
}: PlannerGoalViewProps) {
  const progressByGoalId = useMemo(
    () => new Map(progressSummaries.map((summary) => [summary.goalId, summary])),
    [progressSummaries]
  );
  // A goal is completed when its period target is met (the checklist's rule) or
  // the goal itself is achieved, which the checklist's date-scoped rule can miss.
  const visibleGoals = useMemo(
    () =>
      showCompletedGoals
        ? goals
        : goals.filter(
            (goal) =>
              !completedGoalIds.has(goal.id) &&
              progressByGoalId.get(goal.id)?.outcome !== "achieved"
          ),
    [goals, completedGoalIds, progressByGoalId, showCompletedGoals]
  );
  // Sessions follow their goal, so hidden goals leave the preview too.
  const visibleSessions = useMemo(() => {
    const visibleIds = new Set(visibleGoals.map((goal) => goal.id));
    return sessions.filter((session) => visibleIds.has(session.goalId));
  }, [sessions, visibleGoals]);
  const isEditable = (session: GoalViewSession) =>
    canOpenEntry(session.entry) && canMutateEntryOnDay(session.entry, session.date);

  return (
    <GoalView
      {...view}
      goals={visibleGoals}
      sessions={visibleSessions}
      weekStartsOn={normalizeWeekStartsOn(weekStartsOn)}
      progressByGoalId={progressByGoalId}
      resolveCompletion={(session) =>
        resolveGoalSessionCompletion({
          session,
          asOfDate: view.today,
          canMutatePlanItems,
          optimisticCompletionFacts,
          mutationLoadingKey,
        })
      }
      isEditable={isEditable}
      onMoveSession={(session, date) => onMoveEntry(session.entry, date)}
      onToggleSession={(session, source) => {
        if (canMutateEntryOnDay(session.entry, session.date)) {
          onToggleEntry(session.entry, session.date, source);
        }
      }}
    />
  );
}
