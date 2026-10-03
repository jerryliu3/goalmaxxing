"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { addDaysToDateString } from "@/lib/goals/periods";
import { dateLabel, weekStartOf, type GoalViewSession } from "./goal-view-model";

const byTime = (a: GoalViewSession, b: GoalViewSession) =>
  (a.time || "24:00").localeCompare(b.time || "24:00");

/** A week of sessions from every goal, so one goal's dates read in context. */
export function GoalWeekPeek({
  date,
  sessions,
  today,
  weekStartsOn,
  onDateChange,
  onOpenSession,
}: {
  /** Any date inside the week to show, or null when closed. */
  date: string | null;
  sessions: GoalViewSession[];
  today: string;
  weekStartsOn: number;
  onDateChange: (date: string | null) => void;
  onOpenSession: (session: GoalViewSession) => void;
}) {
  const start = weekStartOf(date ?? today, weekStartsOn);
  const days = Array.from({ length: 7 }, (_, index) => addDaysToDateString(start, index));
  return (
    <Dialog open={date !== null} onOpenChange={(open) => !open && onDateChange(null)}>
      <DialogContent className="sm:max-w-4xl">
        <DialogTitle className="font-display text-2xl tracking-tight">
          {dateLabel(start, "MMM d")} — {dateLabel(addDaysToDateString(start, 6), "MMM d, yyyy")}
        </DialogTitle>
        <DialogDescription>
          Scheduled sessions from every goal. Select one to change its date.
        </DialogDescription>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => onDateChange(addDaysToDateString(start, -7))}
            className="grid size-9 place-items-center rounded-lg border border-border hover:bg-muted"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDateChange(today)}
            className="rounded-lg border border-border px-3 text-xs hover:bg-muted"
          >
            This week
          </button>
          <button
            type="button"
            aria-label="Next week"
            onClick={() => onDateChange(addDaysToDateString(start, 7))}
            className="grid size-9 place-items-center rounded-lg border border-border hover:bg-muted"
          >
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
          {days.map((day) => {
            const daySessions = sessions
              .filter((session) => session.date === day)
              .sort(byTime);
            return (
              <section
                key={day}
                data-today={day === today}
                className={cn(
                  "min-w-0 border-t border-border py-2",
                  day === today && "border-primary"
                )}
              >
                <h3 className="text-[10px] text-muted-foreground">
                  {dateLabel(day, "EEE")}
                  <strong className="block font-display text-2xl text-foreground">
                    {dateLabel(day, "d")}
                  </strong>
                </h3>
                {daySessions.length ? (
                  daySessions.map((session) => (
                    <button
                      key={session.key}
                      type="button"
                      onClick={() => onOpenSession(session)}
                      style={{
                        borderLeftColor:
                          session.entry.activeGoal?.color ?? undefined,
                      }}
                      className="mb-1.5 flex w-full flex-col gap-0.5 rounded border-l-2 border-border bg-muted/50 px-1.5 py-2 text-left hover:bg-muted"
                    >
                      <small className="text-[9px] text-muted-foreground">
                        {session.time || "Any time"}
                        {session.done ? " · logged" : ""}
                      </small>
                      <strong className="text-[11px] font-medium leading-snug">
                        {session.entry.goalTitle ?? session.label}
                      </strong>
                      <span className="text-[10px] text-muted-foreground">
                        {session.label}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground">Open day</p>
                )}
              </section>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
