"use client";

import { useState } from "react";
import { CalendarDays, LockKeyhole, LockKeyholeOpen } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { dateLabel, isDone, sessionChangeError, shiftDate } from "./model";
import { SAMPLE_GOALS, SAMPLE_THROUGH, SAMPLE_TODAY, type ScheduledSession } from "./sample";
import type { GoalViewStudySession } from "./use-study";
import { studyTheme } from "./theme";

export function SessionEditor({ study }: { study: GoalViewStudySession }) {
  const session = study.state.sessions.find(s => s.id === study.editingId);
  return <Dialog open={Boolean(session)} onOpenChange={open => { if (!open) study.setEditingId(null); }}>
    {session && <SessionEditorForm key={session.id} session={session} study={study} />}
  </Dialog>;
}

function SessionEditorForm({ session, study }: { session: ScheduledSession; study: GoalViewStudySession }) {
  const [date, setDate] = useState(session.date);
  const [time, setTime] = useState(session.time);
  const goal = SAMPLE_GOALS.find(g => g.id === session.goalId)!;
  const done = isDone(session, study.state.facts);
  const error = sessionChangeError(session, date, time, study.state.sessions, study.state.facts);
  const changed = date !== session.date || time !== session.time;
  const earliest = goal.start_date > SAMPLE_TODAY ? goal.start_date : SAMPLE_TODAY;
  return <DialogContent className="gv-editor sm:max-w-md" style={studyTheme}>
    <div className="gv-overline">{goal.title}{session.milestone ? ` · milestone ${session.milestone}` : ""}</div>
    <DialogTitle className="gv-display">{session.name}</DialogTitle>
    <DialogDescription>Change this session’s date or time. Save the plan when you’re happy with your changes.</DialogDescription>
    <form onSubmit={event => {
      event.preventDefault();
      if (error || !changed) return;
      study.dispatch({ type: "edit", id: session.id, date, time });
      study.setEditingId(null);
    }}>
      <div className="gv-form-fields">
        <label>Date<input type="date" value={date} min={earliest} max={goal.end_date ?? SAMPLE_THROUGH} disabled={done || session.locked} onChange={e => setDate(e.target.value)} required /></label>
        <label>Time<input type="time" value={time} disabled={done || session.locked} onChange={e => setTime(e.target.value)} /></label>
      </div>
      <div className="gv-shortcuts">
        {[["Tomorrow", shiftDate(SAMPLE_TODAY, 1)], ["Next week", shiftDate(session.date < SAMPLE_TODAY ? SAMPLE_TODAY : session.date, 7)]].map(([label, value]) => <button key={label} type="button" className="gv-button" disabled={Boolean(sessionChangeError(session, value, time, study.state.sessions, study.state.facts))} onClick={() => setDate(value)}>{label}</button>)}
        <button type="button" className="gv-button" disabled={done || session.locked || !time} onClick={() => setTime("")}>Any time</button>
      </div>
      {error && <p className="gv-editor-error" role="status">{error}</p>}
      <div className="gv-editor-actions">
        <button type="button" className="gv-button" disabled={done} onClick={() => study.dispatch({ type: "lock", id: session.id })}>{session.locked ? <LockKeyholeOpen size={14} /> : <LockKeyhole size={14} />}{session.locked ? "Unlock date" : "Lock date"}</button>
        <button type="submit" className="gv-button gv-primary" disabled={Boolean(error) || !changed}>Apply change</button>
      </div>
    </form>
    <button type="button" className="gv-text-button" onClick={() => { study.setEditingId(null); study.setCalendarDate(session.date); }}><CalendarDays size={15} />See this week in context</button>
  </DialogContent>;
}
