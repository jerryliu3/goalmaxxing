"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Pencil } from "lucide-react";
import type { Goal } from "@/lib/goals/types";
import {
  dateLabel,
  GOAL_VIEW_PAGE_SIZE,
  groupSessions,
  type GoalViewSession,
} from "./goal-view-model";

/** `card` tiles fill a goal lane's slot; `row` tiles stack in the phone deck's list. */
export type GoalTileLayout = "card" | "row";
export type GoalTileRenderer = (
  session: GoalViewSession,
  layout: GoalTileLayout
) => ReactNode;

export const overlineClass =
  "type-eyebrow text-[9px] text-muted-foreground";

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
    showMore: () => setLimit((current) => current + GOAL_VIEW_PAGE_SIZE),
  };
}

export type GoalDatesModel = ReturnType<typeof useGoalDates>;

export function GoalDatesHeading({
  goal,
  dates,
}: {
  goal: Goal;
  dates: GoalDatesModel;
}) {
  return (
    <div>
      <div className="flex items-center gap-1">
        <h2 className="type-title text-xl leading-tight tracking-tight">{goal.title}</h2>
        <Link
          href={`/goals/${goal.id}`}
          aria-label={`Edit goal ${goal.title}`}
          title="Edit goal"
          className="grid size-7 flex-none place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Pencil size={14} aria-hidden />
        </Link>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {dates.total} upcoming sessions
        {dates.next ? ` · next ${dateLabel(dates.next.date, "EEE, MMM d")}` : ""}
      </p>
    </div>
  );
}

/** One goal's dates as rows grouped by week, and the paging control. */
export function GoalDates({
  dates,
  renderTile,
}: {
  dates: GoalDatesModel;
  renderTile: GoalTileRenderer;
}) {
  return (
    <>
      {dates.groups.map((group) => (
        <div key={group.date}>
          <h3 className={`pb-2 ${overlineClass}`}>{group.label}</h3>
          <div className="flex flex-col gap-1.5">
            {group.entries.map((session) => renderTile(session, "row"))}
          </div>
        </div>
      ))}
      {dates.remaining > 0 ? (
        <button
          type="button"
          onClick={dates.showMore}
          className="flex w-full flex-col items-center gap-1 rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground hover:bg-muted/50"
        >
          <strong className="text-foreground">More dates</strong>
          <span>{dates.remaining} still to explore</span>
        </button>
      ) : null}
    </>
  );
}
