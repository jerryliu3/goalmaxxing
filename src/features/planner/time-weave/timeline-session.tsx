"use client";

import { Check, LockKeyhole } from "lucide-react";
import type { GoalViewSession } from "@/features/planner/goal-view/goal-view-model";
import { dateLabel } from "@/features/planner/goal-view/goal-view-model";
import styles from "./time-weave.module.css";

/** Read-only placement overview; editing remains on the goal cards and calendar. */
export function TimelineSession({ session, left, top, width, loading, onOpen }: {
  session: GoalViewSession; left: number; top: number; width: number;
  loading: boolean; onOpen: () => void;
}) {
  return <div className={styles.session} data-draft={session.draft} data-done={session.done} style={{ left, top, width }}>
    <div className={styles.sessionTop}>
      {session.done ? <Check size={13} aria-label="Completed" /> : null}
      <small>{session.time || "Any time"}</small>
      {session.locked ? <LockKeyhole size={11} aria-label="Locked date" /> : null}
    </div>
    <button className={styles.open} onClick={onOpen} disabled={loading}
      aria-label={`Inspect ${session.label}, ${dateLabel(session.date)}`}>
      <strong>{session.milestone ? `${session.milestone}. ` : ""}{session.label}</strong>
    </button>
  </div>;
}
