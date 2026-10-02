"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import { useMediaQuery } from "@/lib/ui/use-media-query";
import type { Goal } from "@/lib/goals/types";
import { prefersReducedMotion } from "@/features/planner/plan-view-transition";
import type { GoalTileLayout } from "./goal-dates";
import { GoalDeck } from "./goal-deck";
import { GoalRail } from "./goal-rail";
import { GoalViewControls } from "./goal-view-controls";
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
  selectedEntryKey: string | null;
  resolveCompletion: (session: GoalViewSession) => GoalSessionCompletion;
  isEditable: (session: GoalViewSession) => boolean;
  onOpenSession: (session: GoalViewSession) => void;
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
  selectedEntryKey,
  resolveCompletion,
  isEditable,
  onOpenSession,
  onMoveSession,
  onToggleSession,
}: GoalViewProps) {
  const [showPast, setShowPast] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  // Same breakpoint as the app's other two-pane layouts (Tailwind `md`).
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [weekPeekDate, setWeekPeekDate] = useState<string | null>(null);
  const range = useMemo(() => buildGoalViewWindow(today), [today]);
  const visibleGoals = useMemo(
    () => selectGoalViewGoals(goals, sessions),
    [goals, sessions]
  );

  const selectedId =
    visibleGoals.find((goal) => goal.id === selectedGoalId)?.id ??
    visibleGoals[0]?.id;
  const editorGoalId = selectedEntryKey
    ? sessions.find((session) => session.key === selectedEntryKey)?.goalId
    : undefined;

  // The session editor expands inside a slot below its goal; bring it into view,
  // which also covers sessions chosen from the preview dialog.
  useEffect(() => {
    if (!selectedEntryKey) return;
    const frame = requestAnimationFrame(() => {
      document
        .querySelector('[data-plan-entry-editor="true"]')
        ?.scrollIntoView({
          block: "nearest",
          behavior: prefersReducedMotion() ? "auto" : "smooth",
        });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedEntryKey]);

  const renderTile = (session: GoalViewSession, layout: GoalTileLayout) => (
    <GoalSessionTile
      key={session.key}
      session={session}
      layout={layout}
      today={today}
      completion={resolveCompletion(session)}
      selected={session.key === selectedEntryKey}
      editable={isEditable(session)}
      onOpen={onOpenSession}
      onMove={onMoveSession}
      onToggle={onToggleSession}
    />
  );

  return (
    <div className="space-y-2" data-testid="goal-view">
      <GoalViewControls
        showPast={showPast}
        onShowPastChange={setShowPast}
        onPreview={() => setWeekPeekDate(today)}
      />

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
            editorSlotKey={goal.id === editorGoalId ? selectedEntryKey : null}
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
          editorSlotKey={selectedEntryKey}
          renderTile={renderTile}
        />
      )}

      <p className="pt-2 text-xs text-muted-foreground">
        Showing sessions from {dateLabel(range.start, "MMM d, yyyy")} through{" "}
        {dateLabel(range.end, "MMM d, yyyy")}.
      </p>

      <GoalWeekPeek
        date={weekPeekDate}
        sessions={sessions}
        today={today}
        weekStartsOn={weekStartsOn}
        onDateChange={setWeekPeekDate}
        onOpenSession={(session) => {
          setWeekPeekDate(null);
          // The phone deck expands the editor under the chosen goal's dates.
          setSelectedGoalId(session.goalId);
          onOpenSession(session);
        }}
      />
    </div>
  );
}
