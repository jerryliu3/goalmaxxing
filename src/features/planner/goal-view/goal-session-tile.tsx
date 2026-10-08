"use client";

import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { CompletionTitle } from "@/components/ui/completion-title";
import { DateField } from "@/components/ui/date-field";
import { MilestoneTitleEditor } from "@/features/goals/milestone-title-editor";
import { PlanLedgerCompletionControl } from "@/features/planner/plan-ledger-completion-control";
import { cn } from "@/lib/utils";
import { addDaysToDateString } from "@/lib/goals/periods";
import { defaultMilestoneName } from "@/lib/goals/milestones";
import type { GoalTileLayout } from "./goal-dates";
import { GLIDE_KEY, useTileGlide } from "./use-tile-glide";
import { dateLabel, ordinalText, type GoalViewSession, type SessionOrdinal } from "./goal-view-model";
import type { GoalSessionCompletion } from "./goal-session-completion";

export interface GoalSessionTileProps {
  session: GoalViewSession;
  today: string;
  completion: GoalSessionCompletion;
  /** False for sessions the planner cannot edit from the current snapshot. */
  editable: boolean;
  layout?: GoalTileLayout;
  /** Which session this is toward the goal's target, e.g. "2 of 3" per week. */
  ordinal?: SessionOrdinal | null;
  /** A date header already names the date, so the card leads with its ordinal instead. */
  dateInHeader?: boolean;
  onMove: (session: GoalViewSession, date: string) => void;
  onToggle: (session: GoalViewSession, source: HTMLButtonElement) => void;
  /** Opens the session's details (with its goal card); the card's own controls keep their clicks. */
  onOpen?: (session: GoalViewSession) => void;
}

/** Controls inside a card handle their own clicks; the rest of the card opens it. */
const CARD_CONTROLS = "button, a, input, label, textarea, [contenteditable='true']";

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
      <span aria-hidden="true">
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
  ordinal = null,
  dateInHeader = false,
  onMove,
  onToggle,
  onOpen,
}: GoalSessionTileProps) {
  const row = layout === "row";
  const glideRef = useTileGlide(dateInHeader && Boolean(ordinal));
  const movable = editable && !session.done && !session.locked;

  const completionControl = (
    <span title={completion.disabledReason ?? undefined} className="flex-none">
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
    <div
      className={cn(
        "flex flex-none",
        // Cards float their nudges over the corner on hover or keyboard focus,
        // so they never take room from the text; rows on a phone have no
        // hover, so theirs stay in place. While a field in the card is being
        // edited (a milestone name, the date) they stay out of its way.
        !row &&
          "absolute right-1 bottom-1 rounded-md bg-card/95 opacity-0 shadow-sm transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 group-has-[input:focus]:invisible motion-reduce:transition-none"
      )}
    >
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
              "grid place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent",
              row ? "size-10" : "size-6"
            )}
          >
            {direction === -1 ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
          </button>
        );
      })}
    </div>
  );
  const lock = session.locked ? (
    <LockKeyhole size={11} aria-label="Locked date" className="flex-none text-muted-foreground" />
  ) : null;
  // Phone rows have no lane label beside them, so they keep the title.
  const title = (
    <CompletionTitle
      completed={session.done}
      treatment="quiet"
      className="min-w-0 truncate text-[14px] leading-tight font-medium"
    >
      {session.milestone ? `${session.milestone}. ` : null}
      <MilestoneTitleEditor
        goalId={session.goalId}
        unitKey={session.entry.unitKey}
        label={session.label}
        disabled={!editable || session.entry.draftGhost}
      />
    </CompletionTitle>
  );
  // The Time Weave's quiet card: paper, a hairline border, a small shadow.
  const frame = cn(
    "group relative overflow-hidden rounded-lg border border-border bg-card pl-2 shadow-[0_1px_2px_rgb(0_0_0/0.05)]",
    onOpen && "cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
    session.done && "bg-muted",
    session.draft && "border-dashed border-primary",
    session.entry.draftGhost && "border-muted-foreground opacity-60 line-through",
    session.date === today && !session.draft && "ring-1 ring-primary/60"
  );
  const opener = onOpen
    ? {
        tabIndex: 0,
        "aria-label": `${session.label}, ${dateLabel(session.date)}. Open details`,
        onClick: (event: MouseEvent<HTMLElement>) => {
          if (event.target instanceof Element && event.target.closest(CARD_CONTROLS)) return;
          onOpen(session);
        },
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
          if (event.target !== event.currentTarget) return;
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          onOpen(session);
        },
      }
    : {};
  const dataAttributes = {
    ...opener,
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
        className={cn(frame, "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 py-1.5 pr-1.5")}
      >
        <div className="grid w-10 place-items-center">{completionControl}</div>
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
            {title}
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              {[session.time || "Any time", ordinal && ordinalText(ordinal)].filter(Boolean).join(" · ")}
              {lock}
            </span>
          </span>
        </div>
        {nudges}
      </article>
    );
  }

  // The lane already names the goal, so a card is its check, its date, and
  // its count ("2 of 3 per week"; every goal session has one), plus the time
  // when set. Under a date header the date would only repeat it, so the count
  // leads instead, gliding up from the line below.
  const lead = dateInHeader && Boolean(ordinal);
  const leadText = "type-item text-[17px] leading-5 tracking-tight";
  // The third line names the session: always for a milestone, so it can be
  // renamed from the start (an unnamed one reads lighter, as a prompt), and
  // for other sessions only when they have a name beyond the goal's title.
  const showName = session.milestone !== null || session.label !== session.entry.goalTitle;
  const unnamed = session.milestone !== null && session.label === defaultMilestoneName(session.milestone - 1);
  const glide = (key: string) => ({ [GLIDE_KEY]: key });
  const line = "col-start-2 flex min-w-0 items-baseline gap-1 whitespace-nowrap px-1 text-[10.5px] leading-4 text-muted-foreground";
  const smallCount = !lead && ordinal;
  // With no name to show, the time takes the third line and the count keeps
  // its full period ("1 of 3 per week"). Sharing the line with the time under
  // a name, the period shortens ("1 of 3/wk · 07:30"). Once the count leads,
  // the period and time share the second line.
  const timeOnOwnLine = !lead && !showName && Boolean(session.time);
  const shortPeriod = smallCount && showName && Boolean(session.time);
  const period = (shortPeriod ? ordinal?.periodShort ?? ordinal?.period : ordinal?.period) ?? null;
  const inlineTime = session.time && !timeOnOwnLine ? session.time : null;
  const time = (inline: boolean) => (
    <span {...glide("time")} className="inline-block">
      {inline ? "· " : null}
      {session.time}
    </span>
  );
  return (
    <article
      {...dataAttributes}
      ref={glideRef}
      className={cn(
        frame,
        "grid h-full w-full grid-cols-[auto_minmax(0,1fr)] content-center items-center gap-x-0.5 py-1.5 pr-1.5"
      )}
    >
      <span className="-ml-1">{completionControl}</span>
      <div className="flex min-w-0 items-center gap-1">
        <SessionDateField
          session={session}
          today={today}
          disabled={!movable}
          onMove={onMove}
          className="min-h-5 min-w-0 rounded-md px-1 py-0"
        >
          <span className={cn("grid min-w-0", leadText, session.done && "text-muted-foreground")}>
            {/* The date rests above: under a header it rolls up and out of
                its own clip, leaving the gliding count unclipped. */}
            <span className="col-start-1 row-start-1 overflow-hidden">
              <span
                className={cn(
                  "block whitespace-nowrap transition-[opacity,translate] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                  // Returning, the date waits for the count to clear the line.
                  lead ? "-translate-y-full opacity-0" : "delay-[300ms]"
                )}
              >
                {dateLabel(session.date, "EEE, MMM d")}
              </span>
            </span>
            {lead ? (
              <span {...glide("count")} className="col-start-1 row-start-1 inline-block origin-top-left whitespace-nowrap">
                {ordinal?.count}
              </span>
            ) : null}
          </span>
        </SessionDateField>
        {lock}
      </div>
      {/* Second line: the count (until a header lets it lead) and its period,
          plus the time when the third line is taken. Third line: the session's
          own name, or else the time. */}
      {smallCount || period || inlineTime ? (
        <span className={line}>
          {smallCount ? (
            <span {...glide("count")} className="inline-block flex-none origin-top-left">
              {smallCount.count}
            </span>
          ) : null}
          {period ? (
            <span {...glide("period")} className={cn("inline-block", shortPeriod && ordinal?.periodShort && "-ml-1")}>
              {period}
            </span>
          ) : null}
          {inlineTime ? time(Boolean(smallCount || period)) : null}
        </span>
      ) : null}
      {timeOnOwnLine ? <span className={line}>{time(false)}</span> : null}
      {showName ? (
        <span {...glide("name")} className={cn(line, "block")}>
          <CompletionTitle
            completed={session.done}
            treatment="quiet"
            className={cn(
              "block min-w-0 truncate [&_button]:max-w-full [&_button]:truncate [&_button]:align-bottom [&>span]:truncate",
              unnamed ? "text-muted-foreground/70" : "text-foreground/75"
            )}
          >
            <MilestoneTitleEditor
              goalId={session.goalId}
              unitKey={session.entry.unitKey}
              label={session.label}
              disabled={!editable || session.entry.draftGhost}
            />
          </CompletionTitle>
        </span>
      ) : null}
      {nudges}
    </article>
  );
}
