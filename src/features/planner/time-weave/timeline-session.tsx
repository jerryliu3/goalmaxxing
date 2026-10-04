"use client";

import { LockKeyhole } from "lucide-react";
import { PlannerDraggableEntry } from "@/features/planner/calendar-dnd";
import { PlanLedgerCompletionControl } from "@/features/planner/plan-ledger-completion-control";
import type { GoalViewSession } from "@/features/planner/goal-view/goal-view-model";
import type { GoalSessionCompletion } from "@/features/planner/goal-view/goal-session-completion";
import { dateLabel } from "@/features/planner/goal-view/goal-view-model";
import styles from "./time-weave.module.css";

export function TimelineSession({ session, left, top, width, completion, editable, openable, loading, onOpen, onToggle }: {
  session: GoalViewSession; left: number; top: number; width: number;
  completion: GoalSessionCompletion; editable: boolean; openable: boolean; loading: boolean;
  onOpen: () => void; onToggle: (source: HTMLButtonElement) => void;
}) {
  const movable = editable && !completion.credited && !session.locked && !completion.pending && !loading;
  return (
    <PlannerDraggableEntry entryKey={session.key} disabled={!movable}>
      {({ setNodeRef, setActivatorNodeRef, listeners, attributes, isDragging }) => (
        <div ref={setNodeRef} {...listeners} className={styles.session} data-planner-entry-key={session.key}
          data-day={session.date} data-draft={session.draft} data-done={completion.credited}
          data-dragging={isDragging} data-movable={movable} style={{ left, top, width }}>
          <div className={styles.sessionTop}>
            <span title={completion.disabledReason ?? undefined}>
              <PlanLedgerCompletionControl completed={completion.credited} pending={completion.pending}
                mode="toggle" label={session.label} disabled={loading || Boolean(completion.disabledReason)} onToggle={onToggle} />
            </span>
            <small>{session.time || "Any time"}</small>
            {session.locked ? <LockKeyhole size={11} aria-label="Locked date" /> : null}
          </div>
          <button ref={setActivatorNodeRef} {...attributes} className={styles.open} onClick={() => { if (!isDragging) onOpen(); }} disabled={loading || !openable}
            aria-label={`Open ${session.label}, ${dateLabel(session.date)}`}>
            <strong>{session.milestone ? `${session.milestone}. ` : ""}{session.label}</strong>
          </button>
        </div>
      )}
    </PlannerDraggableEntry>
  );
}
