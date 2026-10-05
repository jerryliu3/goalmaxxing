"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import { useMediaQuery } from "@/lib/ui/use-media-query";
import type { Goal } from "@/lib/goals/types";
import type { GoalTileLayout } from "./goal-dates";
import { GoalDeck } from "./goal-deck";
import { GoalLanes } from "./goal-lanes";
import { DESKTOP_LANES, PHONE_LANES } from "./goal-lanes-model";
import { GoalCalendarSwitch } from "./goal-lanes-toolbar";
import type { GoalSessionCompletion } from "./goal-session-completion";
import { GoalSessionTile } from "./goal-session-tile";
import {
  dateLabel,
  selectGoalViewGoals,
  sessionOrdinals,
  type GoalViewSession,
} from "./goal-view-model";

export interface GoalViewProps {
  goals: Goal[];
  progressByGoalId: ReadonlyMap<string, ProgressContextSummary>;
  sessions: GoalViewSession[];
  window: { start: string; end: string };
  today: string;
  weekStartsOn: number;
  /** The planner is loading another window of sessions. */
  loading: boolean;
  /** The date in view, so the planner can load sessions around it. */
  onVisibleDate: (date: string) => void;
  /** Opens the planner's day preview (Calendar's date header). */
  onInspectDate: (date: string) => void;
  /** Opens a session's details with its goal card. */
  onOpenSession: (session: GoalViewSession) => void;
  resolveCompletion: (session: GoalViewSession) => GoalSessionCompletion;
  isEditable: (session: GoalViewSession) => boolean;
  onMoveSession: (session: GoalViewSession, date: string) => void;
  onToggleSession: (session: GoalViewSession, source: HTMLButtonElement) => void;
}

/**
 * Goals as lanes of their scheduled sessions, each goal's next sessions back
 * to back. Turning Calendar on spreads the same lanes over dates. A phone
 * shows the lanes without Calendar as the swipeable goal deck.
 */
export function GoalView({
  goals,
  progressByGoalId,
  sessions,
  window: range,
  today,
  weekStartsOn,
  loading,
  onVisibleDate,
  onInspectDate,
  onOpenSession,
  resolveCompletion,
  isEditable,
  onMoveSession,
  onToggleSession,
}: GoalViewProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [calendar, setCalendar] = useState(false);
  // Same breakpoint as the app's other two-pane layouts (Tailwind `md`).
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const visibleGoals = useMemo(
    () => selectGoalViewGoals(goals, sessions, { includePast: false, today }),
    [goals, sessions, today]
  );
  // Calendar also keeps goals whose loaded sessions are all past, so its rows
  // stay while browsing back; they slide in and out as Calendar toggles.
  const calendarGoals = useMemo(
    () => selectGoalViewGoals(goals, sessions, { includePast: true, today }),
    [goals, sessions, today]
  );
  const lanes = isDesktop || calendar;

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

  const renderTile = (session: GoalViewSession, tileLayout: GoalTileLayout = "card") => (
    <GoalSessionTile
      key={session.key}
      session={session}
      layout={tileLayout}
      ordinal={ordinals.get(session.key)}
      dateInHeader={calendar && tileLayout === "card"}
      today={today}
      completion={resolveCompletion(session)}
      editable={isEditable(session)}
      onMove={onMoveSession}
      onToggle={onToggleSession}
      onOpen={onOpenSession}
    />
  );
  const calendarSwitch = <GoalCalendarSwitch checked={calendar} onChange={setCalendar} />;

  return (
    <div className="space-y-2" data-testid="goal-view">
      {lanes && (calendar || calendarGoals.length > 0) ? (
        <GoalLanes
          cardGoals={visibleGoals}
          calendarGoals={calendarGoals}
          progressByGoalId={progressByGoalId}
          sessions={sessions}
          calendar={calendar}
          calendarSwitch={calendarSwitch}
          geometry={isDesktop ? DESKTOP_LANES : PHONE_LANES}
          today={today}
          weekStartsOn={weekStartsOn}
          loading={loading}
          onVisibleDate={onVisibleDate}
          onInspectDate={onInspectDate}
          renderTile={renderTile}
        />
      ) : !lanes && selectedId ? (
        <>
          <div className="flex justify-end">{calendarSwitch}</div>
          <GoalDeck
            goals={visibleGoals}
            selectedId={selectedId}
            onSelect={setSelectedGoalId}
            progressByGoalId={progressByGoalId}
            sessions={sessions}
            weekStartsOn={weekStartsOn}
            today={today}
            renderTile={renderTile}
          />
        </>
      ) : (
        <>
          <div className="flex justify-end">{calendarSwitch}</div>
          <p className="py-10 text-center text-sm text-muted-foreground">
            No goals have scheduled sessions in this window.
          </p>
        </>
      )}

      <p className="pt-2 text-xs text-muted-foreground">
        Showing sessions from {dateLabel(range.start, "MMM d, yyyy")} through{" "}
        {dateLabel(range.end, "MMM d, yyyy")}.
      </p>
    </div>
  );
}
