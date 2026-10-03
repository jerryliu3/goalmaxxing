"use client";

import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { PlanLedgerCompletionControl } from "@/features/planner/plan-ledger-completion-control";
import { cn } from "@/lib/utils";
import { addDaysToDateString } from "@/lib/goals/periods";
import { overlineClass } from "./goal-dates";
import { dateLabel, type GoalViewSession } from "./goal-view-model";
import type { GoalSessionCompletion } from "./goal-session-completion";

export interface GoalSessionTileProps {
  session: GoalViewSession;
  today: string;
  completion: GoalSessionCompletion;
  selected: boolean;
  /** False for sessions the planner cannot edit from the current snapshot. */
  editable: boolean;
  onOpen: (session: GoalViewSession) => void;
  onMove: (session: GoalViewSession, date: string) => void;
  onToggle: (session: GoalViewSession, source: HTMLButtonElement) => void;
}

function statusLabel(session: GoalViewSession, today: string) {
  if (session.draft) return "Date changed";
  if (session.done) return "Logged";
  if (session.date === today) return "Today";
  if (session.date < today) return "Not logged";
  return dateLabel(session.date, "EEE");
}

export function GoalSessionTile({
  session,
  today,
  completion,
  selected,
  editable,
  onOpen,
  onMove,
  onToggle,
}: GoalSessionTileProps) {
  const movable = editable && !session.done && !session.locked;
  return (
    <article
      data-planner-entry-key={session.key}
      data-today={session.date === today}
      data-draft={session.draft}
      data-done={session.done}
      className={cn(
        "flex w-36 flex-none flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors",
        session.date === today && "border-primary",
        session.draft && "border-dashed bg-muted/40",
        session.done && "bg-muted/30",
        selected && "ring-2 ring-primary/40"
      )}
    >
      <div className="flex items-center justify-between pl-3 pr-1.5 pt-1.5">
        <span className={overlineClass}>
          {session.milestone
            ? `Step ${String(session.milestone).padStart(2, "0")}`
            : dateLabel(session.date, "EEE")}
        </span>
        <span title={completion.disabledReason ?? undefined}>
          <PlanLedgerCompletionControl
            completed={completion.credited}
            pending={completion.pending}
            mode="toggle"
            label={session.label}
            disabled={Boolean(completion.disabledReason)}
            onToggle={(source) => onToggle(session, source)}
          />
        </span>
      </div>
      <button
        type="button"
        disabled={!editable}
        aria-label={`Edit ${session.label}, ${dateLabel(session.date)}`}
        onClick={() => onOpen(session)}
        className="flex min-h-28 flex-col gap-1 px-3 pb-3 text-left enabled:hover:bg-muted/50 disabled:cursor-default"
      >
        <span className="font-display text-3xl leading-tight">
          {dateLabel(session.date, "d")}{" "}
          <small className="font-sans text-xs text-muted-foreground">
            {dateLabel(session.date, "MMM")}
          </small>
        </span>
        <strong className="min-h-8 text-xs font-semibold leading-snug">
          {session.label}
        </strong>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {session.time || "Any time"}
          {session.locked ? (
            <LockKeyhole size={12} aria-label="Locked date" />
          ) : null}
        </span>
      </button>
      <div className="flex items-center justify-between border-t border-border px-3 py-1 text-[10px] text-muted-foreground">
        <span>{statusLabel(session, today)}</span>
        <div className="flex">
          {([-1, 1] as const).map((direction) => {
            const nextDate = addDaysToDateString(session.date, direction);
            return (
              <button
                key={direction}
                type="button"
                disabled={!movable || nextDate < today}
                title={`Move to ${dateLabel(nextDate)}`}
                aria-label={`Move ${session.label} ${direction === -1 ? "one day earlier" : "one day later"}`}
                onClick={() => onMove(session, nextDate)}
                className="grid size-7 place-items-center rounded-md hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"
              >
                {direction === -1 ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}
