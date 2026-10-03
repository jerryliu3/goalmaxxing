"use client";

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { prefersReducedMotion } from "@/features/planner/plan-view-transition";
import { cn } from "@/lib/utils";
import { addDaysToDateString } from "@/lib/goals/periods";
import {
  dateLabel,
  weekStartOf,
  type GoalViewSession,
  type GoalViewWindow,
} from "./goal-view-model";

const byTime = (a: GoalViewSession, b: GoalViewSession) =>
  (a.time || "24:00").localeCompare(b.time || "24:00");

function listWeeks(range: GoalViewWindow, weekStartsOn: number) {
  const weeks: string[] = [];
  for (
    let week = weekStartOf(range.start, weekStartsOn);
    week <= range.end;
    week = addDaysToDateString(week, 7)
  ) {
    weeks.push(week);
  }
  return weeks;
}

function PeekDay({
  day,
  today,
  sessions,
}: {
  day: string;
  today: string;
  sessions: GoalViewSession[];
}) {
  return (
    <section
      data-today={day === today}
      className={cn("min-w-0 border-t border-border py-2", day === today && "border-primary")}
    >
      <h4 className="text-[10px] text-muted-foreground">
        {dateLabel(day, "EEE")}
        <strong className="block font-display text-2xl text-foreground">
          {dateLabel(day, "d")}
        </strong>
      </h4>
      {sessions.length ? (
        sessions.map((session) => (
          <div
            key={session.key}
            style={{ borderLeftColor: session.entry.activeGoal?.color ?? undefined }}
            className="mb-1.5 flex flex-col gap-0.5 rounded border-l-2 border-border bg-muted/50 px-1.5 py-2"
          >
            <small className="text-[9px] text-muted-foreground">
              {session.time || "Any time"}
              {session.done ? " · logged" : ""}
            </small>
            <strong className="text-[11px] font-medium leading-snug">
              {session.entry.goalTitle ?? session.label}
            </strong>
            <span className="text-[10px] text-muted-foreground">{session.label}</span>
          </div>
        ))
      ) : (
        <p className="text-[11px] text-muted-foreground">Open day</p>
      )}
    </section>
  );
}

/**
 * Every week of the loaded window, scrollable, opening on the current week.
 * Weeks use `content-visibility: auto`, so only those near the viewport lay out
 * and paint while the rest of the window stays one scroll away.
 */
function PeekWeeks({
  range,
  sessions,
  today,
  weekStartsOn,
}: Pick<Parameters<typeof GoalWeekPeek>[0], "range" | "sessions" | "today" | "weekStartsOn">) {
  const scroller = useRef<HTMLDivElement>(null);
  const weeks = useMemo(() => listWeeks(range, weekStartsOn), [range, weekStartsOn]);
  const byDay = useMemo(() => {
    const grouped = new Map<string, GoalViewSession[]>();
    for (const session of sessions) {
      grouped.set(session.date, [...(grouped.get(session.date) ?? []), session]);
    }
    for (const group of grouped.values()) group.sort(byTime);
    return grouped;
  }, [sessions]);
  const currentWeek = weekStartOf(today, weekStartsOn);

  const scrollToCurrentWeek = useCallback((smooth: boolean) => {
    const container = scroller.current;
    const current = container?.querySelector<HTMLElement>("[data-current-week]");
    if (!container || !current) return;
    if (smooth && !prefersReducedMotion()) {
      container.scrollTo({ top: current.offsetTop, behavior: "smooth" });
    } else {
      container.scrollTop = current.offsetTop;
    }
  }, []);

  useLayoutEffect(() => scrollToCurrentWeek(false), [scrollToCurrentWeek]);

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => scrollToCurrentWeek(true)}
          className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-muted"
        >
          Today
        </button>
      </div>
      <div
        ref={scroller}
        tabIndex={0}
        aria-label="Goal sessions by week"
        className="relative max-h-[60dvh] space-y-4 overflow-y-auto overscroll-contain pr-1"
      >
        {weeks.map((week) => (
          <section
            key={week}
            aria-label={`Week of ${dateLabel(week, "MMM d")}`}
            data-current-week={week === currentWeek ? "" : undefined}
            className="[contain-intrinsic-size:auto_14rem] [content-visibility:auto]"
          >
            <h3 className="pb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              {dateLabel(week, "MMM d")} – {dateLabel(addDaysToDateString(week, 6), "MMM d, yyyy")}
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
              {Array.from({ length: 7 }, (_, index) => {
                const day = addDaysToDateString(week, index);
                return (
                  <PeekDay key={day} day={day} today={today} sessions={byDay.get(day) ?? []} />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

/** A scrollable, read-only view of every goal's sessions, week by week. */
export function GoalWeekPeek({
  open,
  onOpenChange,
  range,
  sessions,
  today,
  weekStartsOn,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The loaded window; scrolling stops at its first and last week. */
  range: GoalViewWindow;
  sessions: GoalViewSession[];
  today: string;
  weekStartsOn: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogTitle className="font-display text-2xl tracking-tight">Preview</DialogTitle>
        <DialogDescription>
          Scheduled sessions from every goal. Scroll to move through the weeks.
        </DialogDescription>
        <PeekWeeks
          range={range}
          sessions={sessions}
          today={today}
          weekStartsOn={weekStartsOn}
        />
      </DialogContent>
    </Dialog>
  );
}
