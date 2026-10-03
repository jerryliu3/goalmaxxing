"use client";

import { NestCompletionMark } from "@/components/ui/nest-completion-mark";
import { completionIntent, dateLabel, isDone, sessionIsDraft } from "./model";
import type { ScheduledSession } from "./sample";
import type { GoalViewStudySession } from "./use-study";

export function SessionCompletion({ session, study }: { session: ScheduledSession; study: GoalViewStudySession }) {
  const done = isDone(session, study.state.facts);
  const draft = sessionIsDraft(study.state, session);
  const allowed = completionIntent(session, study.state.facts).allowed && !draft;
  const label = draft ? "Save date changes before completing" : allowed
    ? `${done ? "Undo completion" : "Complete"} ${session.name}, ${dateLabel(session.date)}`
    : "Available on the scheduled date";
  return <button type="button" className="gv-completion" disabled={!allowed} title={label} aria-label={label} aria-pressed={done} onClick={() => study.dispatch({ type: "complete", id: session.id })}>
    <NestCompletionMark done={done} fillTransition className="size-5" />
  </button>;
}
