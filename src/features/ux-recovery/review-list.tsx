"use client";

import { ArrowRight, Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { dateMove, dayLabel, formatDay, type IsoDate } from "@/features/ux-recovery/dates";
import { windowLabel, type GoalPlan, type RecoveryGoal, type Suggestion } from "@/features/ux-recovery/model";
import {
  ActionButton,
  DatePill,
  DateStrip,
  GoalSwatch,
  missedLabel,
  RebalanceSwitch,
} from "@/features/ux-recovery/primitives";
import { goalItems, type Decision } from "@/features/ux-recovery/review-state";
import { goalById } from "@/features/ux-recovery/seed";
import type { RecoveryReview } from "@/features/ux-recovery/use-recovery-review";

/** Hover/focus on a row highlights its session wherever the concept draws it. */
export type HoverHandler = (sessionId: string | null) => void;

function hoverProps(sessionId: string, onHover?: HoverHandler) {
  return onHover
    ? {
        onMouseEnter: () => onHover(sessionId),
        onMouseLeave: () => onHover(null),
        onFocus: () => onHover(sessionId),
        onBlur: () => onHover(null),
      }
    : {};
}

/**
 * One open slipped session. Accept, Edit + Apply and Let it go each persist
 * at once; the row then turns into its confirmation (`DecisionView`).
 */
export function RecoveryRow({
  row,
  review,
  onHover,
}: {
  row: Suggestion;
  review: RecoveryReview;
  onHover?: HoverHandler;
}) {
  const today = review.state.today;
  const [editing, setEditing] = useState(false);
  const [pick, setPick] = useState<IsoDate | null>(null);
  const canEdit = row.options.some((option) => option.available);
  const cancel = () => {
    setEditing(false);
    setPick(null);
  };

  return (
    <li className="py-3" {...hoverProps(row.sessionId, onHover)}>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{row.label}</p>
          <p className="text-xs text-[color:var(--rc-muted)]">{missedLabel(row)}</p>
        </div>
        <ArrowRight aria-hidden className="size-4 flex-none text-[color:var(--rc-muted)]" />
        <DatePill row={row} today={today} />
      </div>
      <p className={`mt-1 text-xs leading-snug ${row.date ? "text-[color:var(--rc-deep)]" : "text-[color:var(--rc-amber)]"}`}>
        {row.reason}
      </p>
      {editing ? (
        <div className="mt-2">
          <DateStrip
            options={row.options}
            today={today}
            label={`Pick a day for ${row.label}`}
            selected={pick}
            suggested={row.date}
            onPick={setPick}
          />
          <p className="mt-1 text-[11px] text-[color:var(--rc-muted)]">A day you pick moves only this session.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <ActionButton
              tone="primary"
              disabled={!pick}
              onClick={() => pick && review.move(row.sessionId, pick)}
              aria-label={pick ? `Apply ${formatDay(pick)} to ${row.label}` : "Apply"}
            >
              Apply{pick ? ` · ${dayLabel(pick, today)}` : ""}
            </ActionButton>
            <ActionButton tone="ghost" onClick={cancel}>
              Cancel
            </ActionButton>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {row.date ? (
            <ActionButton
              tone="primary"
              onClick={() => review.accept(row.sessionId)}
              aria-label={`Accept ${row.label} on ${formatDay(row.date)}`}
            >
              Accept
            </ActionButton>
          ) : null}
          {canEdit ? (
            <ActionButton onClick={() => setEditing(true)} aria-label={`Edit day for ${row.label}`}>
              Edit
            </ActionButton>
          ) : null}
          <ActionButton
            tone="ghost"
            onClick={() => review.letGo(row.sessionId)}
            aria-label={`Let go of ${row.label} missed ${formatDay(row.missedDate)}`}
          >
            Let it go
          </ActionButton>
        </div>
      )}
    </li>
  );
}

function SavedMark({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex flex-none items-center gap-1 text-xs font-semibold text-[color:var(--rc-gain)]">
      {children}
      <Check aria-hidden className="size-3.5" />
    </span>
  );
}

function UndoButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <ActionButton tone="ghost" className="flex-none" onClick={onClick} aria-label={label}>
      Undo
    </ActionButton>
  );
}

/** "Session 6 of 8 · Oct 13 → Oct 21 · shifted": one session's old → new date. */
export function MoveLine({
  label,
  from,
  to,
  note,
  proposed = false,
}: {
  label: string;
  from: IsoDate;
  to: IsoDate;
  note?: string;
  proposed?: boolean;
}) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 text-xs">
      <span className="text-[color:var(--rc-deep)]">{label}</span>
      <span className={`font-mono ${proposed ? "" : "font-semibold"}`}>{dateMove(from, to)}</span>
      {note ? <span className="text-[color:var(--rc-muted)]">{note}</span> : null}
    </li>
  );
}

/**
 * A saved decision, shown in place of its row: "Moved to Thu Oct 8 ✓" with
 * the old date struck, or "Let go ✓". Each holds its own Undo. A rebalance
 * applied to a goal is one decision, so it lists its moves and shifts and
 * undoes as a whole.
 */
export function DecisionView({
  decision,
  review,
  onHover,
}: {
  decision: Decision;
  review: RecoveryReview;
  onHover?: HoverHandler;
}) {
  const undo = () => review.undo(decision.id);
  const [row] = decision.rows;
  if (!row) return null;

  if (decision.kind !== "rebalanced") {
    return (
      <li className="rc-rise flex items-center gap-2 py-3" {...hoverProps(row.sessionId, onHover)}>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{row.label}</p>
          <p className="text-xs text-[color:var(--rc-muted)]">
            {row.to ? (
              <>
                <s>{formatDay(row.from)}</s> → {formatDay(row.to)}
              </>
            ) : (
              `Missed ${formatDay(row.from)} · stays missed`
            )}
          </p>
          <p className="mt-0.5">
            <SavedMark>{row.to ? `Moved to ${formatDay(row.to)}` : "Let go"}</SavedMark>
          </p>
        </div>
        <UndoButton
          onClick={undo}
          label={row.to ? `Undo ${row.label} moved to ${formatDay(row.to)}` : `Undo let go of ${row.label}`}
        />
      </li>
    );
  }

  return (
    <li className="rc-rise py-3">
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1">
          <SavedMark>Saved with Auto-rebalance</SavedMark>
        </p>
        <UndoButton onClick={undo} label={`Undo rebalance of ${goalById(review.state.seed, decision.goalId)?.short ?? "goal"}`} />
      </div>
      <ul className="mt-1 space-y-0.5">
        {decision.rows.map((item) =>
          item.to ? <MoveLine key={item.sessionId} label={item.label} from={item.from} to={item.to} note="moved" /> : null
        )}
        {decision.shifts.map((shift) => (
          <MoveLine key={shift.sessionId} label={shift.label} from={shift.from} to={shift.to} note="shifted" />
        ))}
      </ul>
    </li>
  );
}

export function GoalHeading({
  goal,
  detail,
  children,
}: {
  goal: RecoveryGoal;
  detail?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold leading-tight">
          <GoalSwatch color={goal.color} />
          {goal.title}
        </h3>
        <p className="mt-0.5 text-xs text-[color:var(--rc-muted)]">
          {goal.target}
          {detail ? ` · ${detail}` : ""}
        </p>
      </div>
      {children}
    </div>
  );
}

/** Accept every suggestion of one goal; only worth a button with more than one. */
export function GoalAcceptAll({ goalPlan, review }: { goalPlan: GoalPlan | undefined; review: RecoveryReview }) {
  const count = goalPlan?.rows.filter((row) => row.date).length ?? 0;
  if (!goalPlan || count < 2) return null;
  return (
    <ActionButton
      tone="ghost"
      onClick={() => review.acceptGoal(goalPlan.goal.id)}
      aria-label={`Accept all ${count} ${goalPlan.goal.short} sessions`}
    >
      Accept {count}
    </ActionButton>
  );
}

/**
 * One goal's rows in missed-date order: open rows to decide, saved ones as
 * confirmations with Undo. `heading: false` when the caller already names the
 * goal (sheet title, lane label); only the target line stays.
 */
export function GoalStep({
  goalId,
  review,
  onHover,
  heading = true,
}: {
  goalId: string;
  review: RecoveryReview;
  onHover?: HoverHandler;
  heading?: boolean;
}) {
  const { state, plan } = review;
  const goal = goalById(state.seed, goalId);
  if (!goal) return null;
  const goalPlan = plan.goals.find((item) => item.goal.id === goalId);
  const items = goalItems(state, plan, goalId);
  const cleared = !items.some((item) => item.type === "open");
  const detail = goalPlan ? windowLabel(goalPlan) : null;

  return (
    <section aria-label={goal.title}>
      {heading ? (
        <GoalHeading goal={goal} detail={detail}>
          <GoalAcceptAll goalPlan={goalPlan} review={review} />
        </GoalHeading>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[color:var(--rc-muted)]">
            {goal.target}
            {detail ? ` · ${detail}` : ""}
          </p>
          <GoalAcceptAll goalPlan={goalPlan} review={review} />
        </div>
      )}
      <ul className="divide-y divide-[color:var(--rc-rule)]/60">
        {items.map((item) =>
          item.type === "open" ? (
            <RecoveryRow key={item.row.sessionId} row={item.row} review={review} onHover={onHover} />
          ) : (
            <DecisionView key={item.decision.id} decision={item.decision} review={review} onHover={onHover} />
          )
        )}
      </ul>
      {cleared ? (
        <p className="rc-rise mt-1 flex items-center gap-2 text-sm font-semibold" role="status">
          <Check aria-hidden className="size-4 text-[color:var(--rc-gain)]" />
          All set for {goal.title}.
        </p>
      ) : null}
    </section>
  );
}

/** "Show full calendar / Only this goal (Only slipped goals)": lives in the panel, drives the calendar. */
export function CalendarFilterToggle({ review }: { review: RecoveryReview }) {
  const { showAll, setShowAll, goalId } = review;
  return (
    <ActionButton tone="ghost" aria-pressed={showAll} onClick={() => setShowAll(!showAll)}>
      {showAll ? (goalId ? "Only this goal" : "Only slipped goals") : "Show full calendar"}
    </ActionButton>
  );
}

/** Auto-rebalance, the one control that spans every goal; plus the calendar filter (goal steps and recap). */
export function ReviewToolbar({ review, filter = false }: { review: RecoveryReview; filter?: boolean }) {
  const { state, goalId } = review;
  return (
    <div className="rounded-xl bg-[color:var(--rc-page)] p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <RebalanceSwitch on={state.rebalance} onChange={review.setRebalance} />
        {filter ? <CalendarFilterToggle review={review} /> : null}
      </div>
      <p className="px-2 pb-1 pt-1 text-[11px] leading-snug text-[color:var(--rc-muted)]">
        {state.rebalance
          ? "Proposed: every goal’s later sessions respace evenly. Nothing saves until Apply rebalance."
          : "Only the missed session moves. Each decision saves right away."}
      </p>
    </div>
  );
}

/** Back · Next goal. Next goal is always there; from the last goal it opens the summary. */
export function StepNav({ review }: { review: RecoveryReview }) {
  const { state, plan, goalId } = review;
  const last = state.step >= state.steps.length - 1;
  const open = plan.rows.some((row) => row.goalId === goalId);
  return (
    <div className="flex items-center justify-between gap-2">
      <ActionButton tone="ghost" disabled={state.step === 0} onClick={review.back}>
        <ChevronLeft aria-hidden className="size-4" />
        Back
      </ActionButton>
      <ActionButton tone={open ? "quiet" : "primary"} onClick={review.next}>
        {last ? "Summary" : "Next goal"}
        <ChevronRight aria-hidden className="size-4" />
      </ActionButton>
    </div>
  );
}

/**
 * Side panel on desktop. On phones a compact bottom sheet (half the screen)
 * so the filtered calendar stays visible above it; `tall` for the summary,
 * where the list is the point.
 */
export function ReviewSheet({
  eyebrow,
  title,
  onClose,
  children,
  footer,
  tall = false,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  tall?: boolean;
}) {
  return (
    <aside
      aria-label="Slipped sessions"
      className={`rc-rise fixed inset-x-0 bottom-0 z-30 flex flex-col rounded-t-2xl border-t border-[color:var(--rc-rule)] bg-[color:var(--rc-paper)] shadow-[0_-16px_40px_rgba(36,28,20,0.18)] lg:sticky lg:top-4 lg:bottom-auto lg:z-auto lg:max-h-[calc(100dvh-2rem)] lg:rounded-2xl lg:border lg:shadow-none ${
        tall ? "max-h-[80dvh]" : "max-h-[50dvh]"
      }`}
    >
      <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-3 lg:pt-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--rc-muted)]">{eyebrow}</p>
          <h2 className="mt-0.5 truncate font-display text-xl font-semibold tracking-tight lg:text-2xl">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Done reviewing"
          className="grid size-9 flex-none place-items-center rounded-full hover:bg-black/5"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
      {footer ? <div className="border-t border-[color:var(--rc-rule)] p-3">{footer}</div> : null}
    </aside>
  );
}
