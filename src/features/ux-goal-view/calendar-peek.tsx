"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { dateLabel, shiftDate, weekOf } from "./model";
import { SAMPLE_GOALS, SAMPLE_TODAY } from "./sample";
import type { GoalViewStudySession } from "./use-study";
import { studyTheme } from "./theme";
import { WeaveWeekAgenda } from "./weave-week-agenda";

export function CalendarPeek({ study }: { study: GoalViewStudySession }) {
  const start = weekOf(study.calendarDate ?? SAMPLE_TODAY);
  return <Dialog open={study.calendarDate !== null} onOpenChange={open => { if (!open) study.setCalendarDate(null); }}>
    <DialogContent className="gv-editor gv-calendar-dialog sm:max-w-4xl" style={studyTheme}>
      <div className="gv-overline">Plan · week</div>
      <DialogTitle className="gv-display">{dateLabel(start, "MMM d")} — {dateLabel(shiftDate(start, 6), "MMM d, yyyy")}</DialogTitle>
      <DialogDescription>The week agenda, with scheduled sessions from every goal. Select a session to change its date.</DialogDescription>
      <div className="gv-calendar-controls"><button className="gv-button" aria-label="Previous week" onClick={() => study.setCalendarDate(shiftDate(start, -7))}><ArrowLeft size={16} /></button><button className="gv-button" onClick={() => study.setCalendarDate(SAMPLE_TODAY)}>This week</button><button className="gv-button" aria-label="Next week" onClick={() => study.setCalendarDate(shiftDate(start, 7))}><ArrowRight size={16} /></button></div>
      {study.calendarDate && <WeaveWeekAgenda study={study} anchor={start} goals={SAMPLE_GOALS} selectedDate={study.calendarDate} onInspectDate={study.setCalendarDate} onEditSession={id => { study.setCalendarDate(null); study.setEditingId(id); }} />}
    </DialogContent>
  </Dialog>;
}
