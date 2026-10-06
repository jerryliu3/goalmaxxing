"use client";

import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { CompletionTitle } from "@/components/ui/completion-title";
import { DateField } from "@/components/ui/date-field";
import { MilestoneTitleEditor } from "@/features/goals/milestone-title-editor";
import { PlanLedgerCompletionControl } from "@/features/planner/plan-ledger-completion-control";
import { cn } from "@/lib/utils";
import { addDaysToDateString } from "@/lib/goals/periods";
import type { GoalTileLayout } from "./goal-dates";
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
        // hover, so theirs stay in place.
        !row &&
          "absolute right-1 bottom-1 rounded-md bg-card/95 opacity-0 shadow-sm transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none"
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
  const title = (
    <CompletionTitle
      completed={session.done}
      treatment="quiet"
      className={cn(
        "min-w-0 font-medium",
        row
          ? "truncate text-[14px] leading-tight"
          : // The completion title is inline-block, so it truncates itself for
            // the ellipsis to show. An ellipsis hides an overflowing button
            // whole, so the rename button truncates its own text instead.
            "block truncate text-[11px] leading-4 text-foreground/75 [&_button]:max-w-full [&_button]:truncate [&_button]:align-bottom [&>span]:truncate"
      )}
    >
      {/* A card's ordinal ("2 of 5") already numbers its milestone. */}
      {row && session.milestone ? `${session.milestone}. ` : null}
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

  // The date is what tells one session from the next (the lane already names
  // the goal), so it leads the card; the title and time sit small on the
  // check's row. Under a date header the date would only repeat it, so the
  // lead cross-fades to the count ("2 of 3") and its period stays below. A
  // session with nothing to count keeps its date rather than going blank.
  const showOrdinal = dateInHeader && Boolean(ordinal);
  // Toggling Calendar glides the cards for 720ms (the plan view morph), so the
  // swap lands on the glide's midpoint: the old text clears just before it and
  // the new one arrives just after, never overlapping.
  const fade = (hidden: boolean) =>
    cn(
      "col-start-1 row-start-1 whitespace-nowrap transition-opacity duration-200 motion-reduce:transition-none",
      hidden ? "opacity-0 delay-[160ms] ease-in" : "delay-[360ms] ease-out"
    );
  return (
    <article
      {...dataAttributes}
      className={cn(
        frame,
        "grid h-full w-full grid-cols-[auto_minmax(0,1fr)_auto] content-start items-center gap-x-1 gap-y-0.5 py-1.5 pr-1.5"
      )}
    >
      <span className="-mt-0.5 -ml-1">{completionControl}</span>
      <div className="min-w-0" title={session.label}>{title}</div>
      <span className="text-[10.5px] leading-4 text-muted-foreground">{session.time}</span>
      <div className="col-span-3 flex min-w-0 items-center gap-1">
        <SessionDateField
          session={session}
          today={today}
          disabled={!movable}
          onMove={onMove}
          className="-ml-1 min-h-5 min-w-0 rounded-md px-1 py-0"
        >
          <span
            className={cn(
              "grid min-w-0 font-display text-[17px] leading-5 tracking-tight",
              session.done && "text-muted-foreground"
            )}
          >
            <span className={fade(showOrdinal)}>{dateLabel(session.date, "EEE, MMM d")}</span>
            <span className={fade(!showOrdinal)}>{ordinal?.count ?? ""}</span>
          </span>
        </SessionDateField>
        {lock}
      </div>
      {ordinal ? (
        <span className="col-span-3 grid min-w-0 text-[10.5px] leading-4 text-muted-foreground">
          <span className={fade(showOrdinal)}>{ordinalText(ordinal)}</span>
          <span className={fade(!showOrdinal)}>{ordinal.period ?? ""}</span>
        </span>
      ) : null}
      {nudges}
    </article>
  );
}
