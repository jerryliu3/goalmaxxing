"use client";

import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { PlanLedgerCompletionControl } from "@/features/planner/plan-ledger-completion-control";
import { cn } from "@/lib/utils";
import { addDaysToDateString } from "@/lib/goals/periods";
import { overlineClass, type GoalTileLayout } from "./goal-dates";
import { dateLabel, type GoalViewSession } from "./goal-view-model";
import type { GoalSessionCompletion } from "./goal-session-completion";

export interface GoalSessionTileProps {
  session: GoalViewSession;
  today: string;
  completion: GoalSessionCompletion;
  selected: boolean;
  /** False for sessions the planner cannot edit from the current snapshot. */
  editable: boolean;
  layout?: GoalTileLayout;
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
  layout = "card",
  onOpen,
  onMove,
  onToggle,
}: GoalSessionTileProps) {
  const row = layout === "row";
  const movable = editable && !session.done && !session.locked;
  const step = session.milestone
    ? `Step ${String(session.milestone).padStart(2, "0")}`
    : dateLabel(session.date, "EEE");

  const completionControl = (
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
  );
  const nudges = (
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
            className={cn(
              "grid place-items-center rounded-md hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent",
              row ? "size-10" : "size-7"
            )}
          >
            {direction === -1 ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
          </button>
        );
      })}
    </div>
  );
  const time = (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      {session.time || "Any time"}
      {session.locked ? <LockKeyhole size={12} aria-label="Locked date" /> : null}
    </span>
  );
  const frame = cn(
    "overflow-hidden rounded-xl border border-border bg-card transition-colors",
    session.date === today && "border-primary",
    session.draft && "border-dashed bg-muted/40",
    session.done && "bg-muted/30",
    selected && "ring-2 ring-primary/40"
  );
  const dataAttributes = {
    "data-planner-entry-key": session.key,
    // The plan view morph pairs tiles with calendar pills by day and entry key.
    "data-day": session.date,
    "data-today": session.date === today,
    "data-draft": session.draft,
    "data-done": session.done,
  };

  if (row) {
    return (
      <article
        {...dataAttributes}
        className={cn(frame, "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 p-1.5")}
      >
        <div className="flex w-10 flex-col items-center gap-0.5">
          {completionControl}
          <span className="text-[8px] text-muted-foreground">
            {statusLabel(session, today)}
          </span>
        </div>
        <button
          type="button"
          disabled={!editable}
          aria-label={`Edit ${session.label}, ${dateLabel(session.date)}`}
          onClick={() => onOpen(session)}
          className="grid min-h-14 grid-cols-[52px_minmax(0,1fr)] items-center gap-2 rounded-lg px-1.5 text-left enabled:hover:bg-muted/50 disabled:cursor-default"
        >
          <span className="flex flex-col items-center font-display text-2xl leading-none">
            {dateLabel(session.date, "d")}
            <small className="mt-1 font-sans text-[11px] text-muted-foreground">
              {dateLabel(session.date, "MMM")}
            </small>
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className={overlineClass}>{step}</span>
            <strong
              data-testid="completion-title"
              className="truncate text-[13px] font-semibold"
            >
              {session.label}
            </strong>
            {time}
          </span>
        </button>
        {nudges}
      </article>
    );
  }

  return (
    <article {...dataAttributes} className={cn(frame, "flex w-36 flex-none flex-col")}>
      <div className="flex items-center justify-between pl-3 pr-1.5 pt-1.5">
        <span className={overlineClass}>{step}</span>
        {completionControl}
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
        <strong
          data-testid="completion-title"
          className="min-h-8 text-xs font-semibold leading-snug"
        >
          {session.label}
        </strong>
        {time}
      </button>
      <div className="flex items-center justify-between border-t border-border px-3 py-1 text-[10px] text-muted-foreground">
        <span>{statusLabel(session, today)}</span>
        {nudges}
      </div>
    </article>
  );
}
