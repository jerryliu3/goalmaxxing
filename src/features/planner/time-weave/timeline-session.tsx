"use client";

import { GripVertical, LockKeyhole, CalendarDays } from "lucide-react";
import { DateField } from "@/components/ui/date-field";
import { PlannerDraggableEntry } from "@/features/planner/calendar-dnd";
import { PlanLedgerCompletionControl } from "@/features/planner/plan-ledger-completion-control";
import type { GoalViewSession } from "@/features/planner/goal-view/goal-view-model";
import type { GoalSessionCompletion } from "@/features/planner/goal-view/goal-session-completion";
import { dateLabel } from "@/features/planner/goal-view/goal-view-model";
import styles from "./time-weave.module.css";

export function TimelineSession({ session, today, left, top, width, completion, editable, openable, loading, onOpen, onMove, onToggle }: {
  session: GoalViewSession; today: string; left: number; top: number; width: number;
  completion: GoalSessionCompletion; editable: boolean; openable: boolean; loading: boolean;
  onOpen: () => void; onMove: (date: string) => void; onToggle: (source: HTMLButtonElement) => void;
}) {
  const movable = editable && !completion.credited && !session.locked && !completion.pending && !loading;
  return (
    <PlannerDraggableEntry entryKey={session.key} disabled={!movable}>
      {({ setNodeRef, setActivatorNodeRef, listeners, attributes, isDragging }) => (
        <div ref={setNodeRef} className={styles.session} data-planner-entry-key={session.key}
          data-day={session.date} data-draft={session.draft} data-done={completion.credited}
          data-dragging={isDragging} style={{ left, top, width }}>
          <button className={styles.open} onClick={onOpen} disabled={loading || !openable}
            aria-label={`Open ${session.label}, ${dateLabel(session.date)}`}>
            <small>{session.time || "Any time"}{session.locked ? <LockKeyhole size={11} aria-label="Locked date" /> : null}</small>
            <strong>{session.milestone ? `${session.milestone}. ` : ""}{session.label}</strong>
          </button>
          <div className={styles.actions}>
            <span title={completion.disabledReason ?? undefined}>
              <PlanLedgerCompletionControl completed={completion.credited} pending={completion.pending}
                mode="toggle" label={session.label} disabled={loading || Boolean(completion.disabledReason)} onToggle={onToggle} />
            </span>
            <label className={styles.dateEdit} title="Change scheduled date">
              <CalendarDays size={14} aria-hidden />
              <DateField aria-label={`Change date of ${session.label}, ${dateLabel(session.date)}`}
                disabled={!movable} value={session.date} min={today}
                onValueChange={(date) => { if (movable && date && date >= today && date !== session.date) onMove(date); }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full" />
            </label>
            <button ref={setActivatorNodeRef} {...listeners} {...attributes} disabled={!movable}
              className={styles.drag} aria-label={`Move ${session.label}, ${dateLabel(session.date)}`}>
              <GripVertical size={14} />
            </button>
          </div>
        </div>
      )}
    </PlannerDraggableEntry>
  );
}
