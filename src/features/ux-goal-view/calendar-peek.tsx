"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { dateLabel, isDone, shiftDate, weekOf } from "./model";
import { SAMPLE_GOALS, SAMPLE_TODAY } from "./sample";
import type { GoalViewStudySession } from "./use-study";
import { studyTheme } from "./theme";

export function CalendarPeek({ study }: { study: GoalViewStudySession }) {
  const start = weekOf(study.calendarDate ?? SAMPLE_TODAY);
  return <Dialog open={study.calendarDate !== null} onOpenChange={open => { if (!open) study.setCalendarDate(null); }}>
    <DialogContent className="gv-editor gv-calendar-dialog sm:max-w-4xl" style={studyTheme}>
      <div className="gv-overline">Plan · week</div>
      <DialogTitle className="gv-display">{dateLabel(start, "MMM d")} — {dateLabel(shiftDate(start, 6), "MMM d, yyyy")}</DialogTitle>
      <DialogDescription>Scheduled sessions from every goal. Tap a session to change its date.</DialogDescription>
      <div className="gv-calendar-controls"><button className="gv-button" aria-label="Previous week" onClick={() => study.setCalendarDate(shiftDate(start, -7))}><ArrowLeft size={16} /></button><button className="gv-button" onClick={() => study.setCalendarDate(SAMPLE_TODAY)}>This week</button><button className="gv-button" aria-label="Next week" onClick={() => study.setCalendarDate(shiftDate(start, 7))}><ArrowRight size={16} /></button></div>
      <div className="gv-calendar-week">
        {Array.from({ length: 7 }, (_, i) => shiftDate(start, i)).map(date => {
          const sessions = study.state.sessions.filter(s => s.date === date).sort((a, b) => (a.time || "24:00").localeCompare(b.time || "24:00"));
          return <section key={date} data-today={date === SAMPLE_TODAY}>
            <h3>{dateLabel(date, "EEE")} <strong>{dateLabel(date, "d")}</strong></h3>
            {sessions.length ? sessions.map(s => <button key={s.id} style={{ borderLeftColor: SAMPLE_GOALS.find(g => g.id === s.goalId)?.color ?? undefined }} className="gv-calendar-entry" onClick={() => { study.setCalendarDate(null); study.setEditingId(s.id); }}><small>{s.time || "Any time"}{isDone(s, study.state.facts) && " · logged"}</small><strong>{SAMPLE_GOALS.find(g => g.id === s.goalId)?.title}</strong><span>{s.name}</span></button>) : <p className="gv-muted">Open day</p>}
          </section>;
        })}
      </div>
    </DialogContent>
  </Dialog>;
}
