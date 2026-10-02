"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import type { Goal } from "@/lib/goals/types";
import {
  dateLabel,
  GOAL_VIEW_PAGE_SIZE,
  groupSessions,
  type GoalViewSession,
} from "./goal-view-model";

export const overlineClass =
  "font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground";

/**
 * Pages and groups one goal's dates. Past sessions (only present when shown)
 * are always listed; upcoming ones page in 12 at a time.
 */
export function useGoalDates({
  sessions,
  weekStartsOn,
  today,
}: {
  /** Already scoped to the goal and sorted by date. */
  sessions: GoalViewSession[];
  weekStartsOn: number;
  today: string;
}) {
  const [limit, setLimit] = useState(GOAL_VIEW_PAGE_SIZE);
  const visible = useMemo(() => {
    const firstUpcoming = sessions.findIndex((session) => session.date >= today);
    const pastCount = firstUpcoming === -1 ? sessions.length : firstUpcoming;
    return sessions.slice(0, pastCount + limit);
  }, [sessions, limit, today]);
  const groups = useMemo(
    () => groupSessions(visible, weekStartsOn),
    [visible, weekStartsOn]
  );
  return {
    groups,
    total: sessions.length,
    remaining: sessions.length - visible.length,
    next: sessions.find((session) => session.date >= today && !session.done),
    /** The first week that still has upcoming dates, where past dates end. */
    upcomingGroupDate: groups.find((group) =>
      group.entries.some((session) => session.date >= today)
    )?.date,
    showMore: () => setLimit((current) => current + GOAL_VIEW_PAGE_SIZE),
  };
}

export type GoalDatesModel = ReturnType<typeof useGoalDates>;

export function GoalDatesHeading({
  goal,
  showPast,
  dates,
}: {
  goal: Goal;
  showPast: boolean;
  dates: GoalDatesModel;
}) {
  return (
    <div>
      <h2 className="font-display text-xl leading-tight tracking-tight">{goal.title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {dates.total} {showPast ? "scheduled" : "upcoming"} sessions
        {dates.next ? ` · next ${dateLabel(dates.next.date, "EEE, MMM d")}` : ""}
      </p>
    </div>
  );
}

/** Date groups, the empty state and the paging control for one goal. */
export function GoalDates({
  dates,
  showPast,
  renderTile,
}: {
  dates: GoalDatesModel;
  showPast: boolean;
  renderTile: (session: GoalViewSession) => ReactNode;
}) {
  return (
    <>
      {dates.groups.map((group) => (
        <div
          key={group.date}
          className="flex-none"
          data-upcoming-start={group.date === dates.upcomingGroupDate ? "" : undefined}
        >
          <h3 className={`pb-2 ${overlineClass}`}>{group.label}</h3>
          <div className="flex gap-2">
            {group.entries.map((session) => renderTile(session))}
          </div>
        </div>
      ))}
      {dates.total === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">
          {showPast
            ? "No dates for this goal."
            : "No upcoming dates for this goal. Try Show past sessions."}
        </p>
      ) : null}
      {dates.remaining > 0 ? (
        <button
          type="button"
          onClick={dates.showMore}
          className="flex w-36 flex-none flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:bg-muted/50"
        >
          <ArrowRight size={19} aria-hidden />
          <strong className="text-foreground">More dates</strong>
          <span>{dates.remaining} still to explore</span>
        </button>
      ) : null}
    </>
  );
}
