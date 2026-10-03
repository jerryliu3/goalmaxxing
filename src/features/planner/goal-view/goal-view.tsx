"use client";

import { useMemo, useState } from "react";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import { useMediaQuery } from "@/lib/ui/use-media-query";
import type { Goal } from "@/lib/goals/types";
import type { GoalTileLayout } from "./goal-dates";
import { GoalDeck } from "./goal-deck";
import { GoalRail } from "./goal-rail";
import type { GoalSessionCompletion } from "./goal-session-completion";
import { GoalSessionTile } from "./goal-session-tile";
import { GoalWeekPeek } from "./goal-week-peek";
import {
  buildGoalViewWindow,
  dateLabel,
  selectGoalViewGoals,
  sessionsForGoal,
  type GoalViewSession,
} from "./goal-view-model";

export interface GoalViewProps {
  goals: Goal[];
  progressByGoalId: ReadonlyMap<string, ProgressContextSummary>;
  sessions: GoalViewSession[];
  today: string;
  weekStartsOn: number;
  /** Include sessions before today (a planner filter). */
  showPast: boolean;
  /** The cross-goal preview, opened from the planner toolbar. */
  previewOpen: boolean;
  onPreviewOpenChange: (open: boolean) => void;
  resolveCompletion: (session: GoalViewSession) => GoalSessionCompletion;
  isEditable: (session: GoalViewSession) => boolean;
  onMoveSession: (session: GoalViewSession, date: string) => void;
  onToggleSession: (session: GoalViewSession, source: HTMLButtonElement) => void;
}

/** Goals as objects, each with a browsable track of its scheduled dates. */
export function GoalView({
  goals,
  progressByGoalId,
  sessions,
  today,
  weekStartsOn,
  showPast,
  previewOpen,
  onPreviewOpenChange,
  resolveCompletion,
  isEditable,
  onMoveSession,
  onToggleSession,
}: GoalViewProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  // Same breakpoint as the app's other two-pane layouts (Tailwind `md`).
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const range = useMemo(() => buildGoalViewWindow(today), [today]);
  const visibleGoals = useMemo(
    () => selectGoalViewGoals(goals, sessions, { showPast, today }),
    [goals, sessions, showPast, today]
  );
  // The preview follows the goals on screen.
  const visibleSessions = useMemo(() => {
    const visibleIds = new Set(visibleGoals.map((goal) => goal.id));
    return sessions.filter((session) => visibleIds.has(session.goalId));
  }, [sessions, visibleGoals]);

  const selectedId =
    visibleGoals.find((goal) => goal.id === selectedGoalId)?.id ??
    visibleGoals[0]?.id;

  const renderTile = (session: GoalViewSession, layout: GoalTileLayout) => (
    <GoalSessionTile
      key={session.key}
      session={session}
      layout={layout}
      today={today}
      completion={resolveCompletion(session)}
      editable={isEditable(session)}
      onMove={onMoveSession}
      onToggle={onToggleSession}
    />
  );

  return (
    <div className="space-y-2" data-testid="goal-view">
      {visibleGoals.length === 0 || !selectedId ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No goals have scheduled sessions in this window.
        </p>
      ) : isDesktop ? (
        visibleGoals.map((goal) => (
          <GoalRail
            key={goal.id}
            goal={goal}
            progress={progressByGoalId.get(goal.id)}
            sessions={sessionsForGoal(sessions, goal.id, showPast, today)}
            showPast={showPast}
            weekStartsOn={weekStartsOn}
            today={today}
            renderTile={renderTile}
          />
        ))
      ) : (
        <GoalDeck
          goals={visibleGoals}
          selectedId={selectedId}
          onSelect={setSelectedGoalId}
          progressByGoalId={progressByGoalId}
          sessions={sessions}
          showPast={showPast}
          weekStartsOn={weekStartsOn}
          today={today}
          renderTile={renderTile}
        />
      )}

      <p className="pt-2 text-xs text-muted-foreground">
        Showing sessions from {dateLabel(range.start, "MMM d, yyyy")} through{" "}
        {dateLabel(range.end, "MMM d, yyyy")}.
      </p>

      <GoalWeekPeek
        open={previewOpen}
        onOpenChange={onPreviewOpenChange}
        range={range}
        sessions={visibleSessions}
        today={today}
        weekStartsOn={weekStartsOn}
      />
    </div>
  );
}
