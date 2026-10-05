"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import { useMediaQuery } from "@/lib/ui/use-media-query";
import type { Goal } from "@/lib/goals/types";
import type { GoalTileLayout } from "./goal-dates";
import { GoalDeck } from "./goal-deck";
import { GoalRail } from "./goal-rail";
import type { GoalSessionCompletion } from "./goal-session-completion";
import { GoalSessionTile } from "./goal-session-tile";
import {
  dateLabel,
  selectGoalViewGoals,
  sessionOrdinals,
  sessionsForGoal,
  type GoalViewSession,
} from "./goal-view-model";

export interface GoalViewProps {
  goals: Goal[];
  progressByGoalId: ReadonlyMap<string, ProgressContextSummary>;
  sessions: GoalViewSession[];
  window: { start: string; end: string };
  today: string;
  weekStartsOn: number;
  /** Include sessions before today (a planner filter). */
  showPast: boolean;
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
  window: range,
  today,
  weekStartsOn,
  showPast,
  resolveCompletion,
  isEditable,
  onMoveSession,
  onToggleSession,
}: GoalViewProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  // Same breakpoint as the app's other two-pane layouts (Tailwind `md`).
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const visibleGoals = useMemo(
    () => selectGoalViewGoals(goals, sessions, { showPast, today }),
    [goals, sessions, showPast, today]
  );

  const ordinals = useMemo(
    () => sessionOrdinals(goals, sessions, weekStartsOn),
    [goals, sessions, weekStartsOn]
  );

  const selectedId =
    visibleGoals.find((goal) => goal.id === selectedGoalId)?.id ??
    visibleGoals[0]?.id;

  // Preserve the first visible goal when the background range adds new goals.
  useEffect(() => {
    if (selectedGoalId === null && selectedId) setSelectedGoalId(selectedId);
  }, [selectedGoalId, selectedId]);

  const renderTile = (session: GoalViewSession, layout: GoalTileLayout) => {
    const tile = (
      <GoalSessionTile
        key={session.key}
        session={session}
        layout={layout}
        ordinal={ordinals.get(session.key)}
        today={today}
        completion={resolveCompletion(session)}
        editable={isEditable(session)}
        onMove={onMoveSession}
        onToggle={onToggleSession}
      />
    );
    // Cards fill the box they are given; rows size themselves.
    return layout === "card" ? (
      <div key={session.key} className="h-[76px] w-[132px] flex-none">
        {tile}
      </div>
    ) : (
      tile
    );
  };

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
    </div>
  );
}
