"use client";

import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { NestCompletionMark } from "@/components/ui/nest-completion-mark";
import { completionIntent, dateLabel, isDone, sessionChangeError, sessionIsDraft, shiftDate } from "./model";
import { SAMPLE_TODAY, type ScheduledSession } from "./sample";
import type { GoalViewStudySession } from "./use-study";

export function SessionTile({ session: s, study }: { session: ScheduledSession; study: GoalViewStudySession }) {
  const { state, dispatch } = study;
  const done = isDone(s, state.facts);
  const draft = sessionIsDraft(state, s);
  const intent = completionIntent(s, state.facts);
  const canComplete = intent.allowed && !draft;
  const completionLabel = draft ? "Save date changes before completing" : canComplete ? `${done ? "Undo completion" : "Complete"} ${s.name}, ${dateLabel(s.date)}` : "Available on the scheduled date";
  return (
    <article className="gv-session" data-done={done} data-today={s.date === SAMPLE_TODAY} data-draft={draft}>
      <div className="gv-session-top">
        <span className="gv-overline">{s.milestone ? `Step ${String(s.milestone).padStart(2, "0")}` : dateLabel(s.date, "EEE")}</span>
        <button type="button" className="gv-completion" disabled={!canComplete} title={completionLabel} aria-label={completionLabel} aria-pressed={done} onClick={() => dispatch({ type: "complete", id: s.id })}>
          <NestCompletionMark done={done} fillTransition className="size-5" />
        </button>
      </div>
      <button type="button" className="gv-session-open" aria-label={`Edit ${s.name}, ${dateLabel(s.date)}`} onClick={() => study.setEditingId(s.id)}>
        <span className="gv-session-date">{dateLabel(s.date, "d")} <small>{dateLabel(s.date, "MMM")}</small></span>
        <strong>{s.name}</strong>
        <span className="gv-muted">{s.time || "Any time"}{s.locked && <LockKeyhole size={12} aria-label="Locked date" />}</span>
      </button>
      <div className="gv-session-bottom">
        <span>{draft ? "Date changed" : done ? "Logged" : s.date === SAMPLE_TODAY ? "Today" : s.date < SAMPLE_TODAY ? "Not logged" : dateLabel(s.date, "EEE")}</span>
        <div className="gv-day-nudge">
          {([-1, 1] as const).map(direction => {
            const nextDate = shiftDate(s.date, direction);
            const error = sessionChangeError(s, nextDate, s.time, state.sessions, state.facts);
            return <button type="button" key={direction} disabled={Boolean(error)} title={error ?? `Move to ${dateLabel(nextDate)}`} aria-label={`Move ${s.name} ${direction === -1 ? "one day earlier" : "one day later"}`} onClick={() => dispatch({ type: "edit", id: s.id, date: nextDate, time: s.time })}>
              {direction === -1 ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
            </button>;
          })}
        </div>
      </div>
    </article>
  );
}
