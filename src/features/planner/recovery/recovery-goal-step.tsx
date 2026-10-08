"use client";

import { ArrowRight, Check } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { dateMove, dayLabel, formatDay } from "@/lib/planner/recovery/dates";
import { windowLabel, type Shift, type Suggestion } from "@/lib/planner/recovery/model";
import { cn } from "@/lib/utils";
import { RecoveryDayStrip, SuggestedDayPill } from "@/features/planner/recovery/recovery-day-picker";
import { goalItems, type StagedRow } from "@/features/planner/recovery/review-state";
import type { RecoveryReview } from "@/features/planner/recovery/use-recovery-review";

const actionClass = "h-9 rounded-full px-3.5";

/**
 * One open slipped session. Accept and Edit + Apply stage a planner draft
 * move (the calendar previews it); Let it go is staged too. Save persists
 * them all.
 */
function RecoveryRow({ row, review, today }: { row: Suggestion; review: RecoveryReview; today: string }) {
  const [editing, setEditing] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const disabled = review.saving;
  const canEdit = row.options.some((option) => option.available);
  const cancel = () => {
    setEditing(false);
    setPick(null);
  };

  return (
    <li className="py-3">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="type-item truncate text-sm">{row.label}</p>
          <p className="text-xs text-muted-foreground">Missed {formatDay(row.missedDate)}</p>
        </div>
        <ArrowRight aria-hidden className="size-4 flex-none text-muted-foreground" />
        <SuggestedDayPill row={row} today={today} />
      </div>
      <p className={cn("mt-1 text-xs leading-snug", row.date ? "text-muted-foreground" : "text-recover")}>
        {row.reason}
      </p>
      {editing ? (
        <div className="mt-2">
          <RecoveryDayStrip
            options={row.options}
            today={today}
            label={`Pick a day for ${row.label}`}
            selected={pick}
            suggested={row.date}
            onPick={setPick}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">A day you pick moves only this session.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button
              className={actionClass}
              disabled={!pick || disabled}
              onClick={() => pick && review.move(row.sessionId, pick)}
              aria-label={pick ? `Apply ${formatDay(pick)} to ${row.label}` : "Apply"}
            >
              Apply{pick ? ` · ${dayLabel(pick, today)}` : ""}
            </Button>
            <Button variant="ghost" className={actionClass} onClick={cancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {row.date ? (
            <Button
              className={actionClass}
              disabled={disabled}
              onClick={() => review.accept(row.sessionId)}
              aria-label={`Accept ${row.label} on ${formatDay(row.date)}`}
            >
              Accept
            </Button>
          ) : null}
          {canEdit ? (
            <Button
              variant="outline"
              className={actionClass}
              disabled={disabled}
              onClick={() => setEditing(true)}
              aria-label={`Edit day for ${row.label}`}
            >
              Edit
            </Button>
          ) : null}
          <Button
            variant="ghost"
            className={actionClass}
            disabled={disabled}
            onClick={() => review.letGo(row.sessionId)}
            aria-label={`Let go of ${row.label} missed ${formatDay(row.missedDate)}`}
          >
            Let it go
          </Button>
        </div>
      )}
    </li>
  );
}

function DecidedMark({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex flex-none items-center gap-1 text-xs font-semibold text-gain">
      {children}
      <Check aria-hidden className="size-3.5" />
    </span>
  );
}

function UndoButton({ label, review, onUndo }: { label: string; review: RecoveryReview; onUndo: () => void }) {
  return (
    <Button
      variant="ghost"
      className={cn(actionClass, "flex-none")}
      disabled={review.saving}
      onClick={onUndo}
      aria-label={label}
    >
      Undo
    </Button>
  );
}

/** "Session 6 of 8  Oct 13 → Oct 21  shifted": one session's old → new date. */
export function MoveLine({ label, from, to, note }: { label: string; from: string; to: string; note?: string }) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{dateMove(from, to)}</span>
      {note ? <span className="text-muted-foreground">{note}</span> : null}
    </li>
  );
}

/** A decided row in place of its open row, with its own Undo. Nothing is saved until Save. */
export function DecidedRow({ row, review }: { row: StagedRow; review: RecoveryReview }) {
  return (
    <li className="flex items-center gap-2 py-3">
      <div className="min-w-0 flex-1">
        <p className="type-item truncate text-sm">{row.label}</p>
        <p className="text-xs text-muted-foreground">
          {row.to ? (
            <>
              <s>{formatDay(row.from)}</s> → {formatDay(row.to)}
            </>
          ) : (
            `Missed ${formatDay(row.from)} · stays missed`
          )}
        </p>
        <p className="mt-0.5">
          <DecidedMark>{row.to ? `Moves to ${formatDay(row.to)}` : "Let go"}</DecidedMark>
        </p>
      </div>
      <UndoButton
        review={review}
        onUndo={() => review.undo(row)}
        label={row.to ? `Undo ${row.label} moved to ${formatDay(row.to)}` : `Undo let go of ${row.label}`}
      />
    </li>
  );
}

/** This goal's later sessions that moved too (Auto-rebalance or a calendar drag); they undo together. */
export function ShiftedSessions({
  goalId,
  goalTitle,
  shifts,
  review,
}: {
  goalId: string;
  goalTitle: string;
  shifts: Shift[];
  review: RecoveryReview;
}) {
  if (!shifts.length) return null;
  return (
    <div className="mt-2 rounded-xl border border-border px-3 py-2">
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Later sessions shifted
        </p>
        <UndoButton
          review={review}
          onUndo={() => review.undoShifts(goalId)}
          label={`Undo shifted sessions of ${goalTitle}`}
        />
      </div>
      <ul className="space-y-0.5 pb-1">
        {shifts.map((shift) => (
          <MoveLine key={shift.sessionId} label={shift.label} from={shift.from} to={shift.to} note="shifted" />
        ))}
      </ul>
    </div>
  );
}

/**
 * One goal's rows in missed-date order: open rows to decide, decided ones with
 * Undo. The panel title already names the goal.
 */
export function RecoveryGoalStep({ goalId, review }: { goalId: string; review: RecoveryReview }) {
  const { plan, changes, goals, today } = review;
  const goal = goals.find((item) => item.id === goalId);
  if (!goal || !today) return null;
  const goalPlan = plan.goals.find((item) => item.goal.id === goalId);
  const items = goalItems(changes, plan, goalId);
  const cleared = !items.some((item) => item.type === "open");
  const acceptable = goalPlan?.rows.filter((row) => row.date).length ?? 0;

  return (
    <section aria-label={goal.title}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {goalPlan ? <p className="text-xs text-muted-foreground">{windowLabel(goalPlan)}</p> : <span />}
        {acceptable > 1 ? (
          <Button
            variant="ghost"
            className={actionClass}
            disabled={review.saving}
            onClick={() => review.acceptGoal(goalId)}
            aria-label={`Accept all ${acceptable} ${goal.title} sessions`}
          >
            Accept {acceptable}
          </Button>
        ) : null}
      </div>
      <ul className="divide-y divide-border">
        {items.map((item) =>
          item.type === "open" ? (
            <RecoveryRow key={item.row.sessionId} row={item.row} review={review} today={today} />
          ) : (
            <DecidedRow key={item.row.sessionId} row={item.row} review={review} />
          )
        )}
      </ul>
      <ShiftedSessions
        goalId={goalId}
        goalTitle={goal.title}
        shifts={changes.get(goalId)?.shifts ?? []}
        review={review}
      />
      {cleared ? (
        <p className="mt-1 flex items-center gap-2 text-sm font-semibold" role="status">
          <Check aria-hidden className="size-4 text-gain" />
          All set for {goal.title}.
        </p>
      ) : null}
    </section>
  );
}
