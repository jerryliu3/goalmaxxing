"use client";

import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { DateField } from "@/components/ui/date-field";
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
  /** False for sessions the planner cannot edit from the current snapshot. */
  editable: boolean;
  layout?: GoalTileLayout;
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

/**
 * The native input owns the date's hit area on every device. In particular,
 * iOS needs a real tap/focus on the input rather than a programmatic showPicker.
 */
function SessionDateField({
  session,
  today,
  disabled,
  className,
  onMove,
  children,
}: {
  session: GoalViewSession;
  today: string;
  disabled: boolean;
  className?: string;
  onMove: (session: GoalViewSession, date: string) => void;
  children: ReactNode;
}) {
  return (
    <label
      title={disabled ? undefined : "Change date"}
      className={cn(
        "relative inline-flex min-h-11 min-w-11 items-center rounded-lg px-2 py-1 text-left transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        !disabled && "cursor-pointer hover:bg-muted",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(!disabled && "underline decoration-foreground/40 underline-offset-4 [&_*]:underline")}
      >
        {children}
      </span>
      <DateField
        aria-label={`Change date of ${session.label}, ${dateLabel(session.date)}`}
        disabled={disabled}
        value={session.date}
        min={today}
        onValueChange={(date) => {
          if (!disabled && date && date !== session.date && date >= today) onMove(session, date);
        }}
        className="absolute inset-0 h-full w-full min-w-0 cursor-pointer opacity-0 disabled:cursor-default disabled:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
      />
    </label>
  );
}

export function GoalSessionTile({
  session,
  today,
  completion,
  editable,
  layout = "card",
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
    session.done && "bg-muted/30"
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
        <div className="grid min-h-14 min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
          <SessionDateField
            session={session}
            today={today}
            disabled={!movable}
            onMove={onMove}
          >
            <span className="flex w-10 flex-col items-center font-display text-2xl leading-none">
              {dateLabel(session.date, "d")}
              <small className="mt-1 font-sans text-[11px] text-muted-foreground">
                {dateLabel(session.date, "MMM")}
              </small>
            </span>
          </SessionDateField>
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
        </div>
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
      <div className="flex min-h-28 flex-col items-start gap-1 px-1.5 pb-3">
        <SessionDateField
          session={session}
          today={today}
          disabled={!movable}
          onMove={onMove}
        >
          <span className="font-display text-3xl leading-tight">
            {dateLabel(session.date, "d")}{" "}
            <small className="font-sans text-xs text-muted-foreground">
              {dateLabel(session.date, "MMM")}
            </small>
          </span>
        </SessionDateField>
        <strong
          data-testid="completion-title"
          className="min-h-8 px-1.5 text-xs font-semibold leading-snug"
        >
          {session.label}
        </strong>
        <span className="px-1.5">{time}</span>
      </div>
      <div className="flex items-center justify-between border-t border-border px-3 py-1 text-[10px] text-muted-foreground">
        <span>{statusLabel(session, today)}</span>
        {nudges}
      </div>
    </article>
  );
}
