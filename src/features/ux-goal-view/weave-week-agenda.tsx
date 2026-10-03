"use client";

import { useState } from "react";
import { CalendarMonthDayCell } from "@/features/planner/calendar-month-day-cell";
import { PlannerDndProvider } from "@/features/planner/calendar-dnd";
import type { Goal } from "@/lib/goals/types";
import { completionIntent, dateLabel, isDone, sessionIsDraft } from "./model";
import { SAMPLE_TODAY } from "./sample";
import type { GoalViewStudySession } from "./use-study";
import { sessionsOnDate, studyCalendarEntry, weaveWeekDates } from "./weave-model";

/** The production Week cell and drag surface, with the study's local plan adapter. */
export function WeaveWeekAgenda({ study, anchor, goals, selectedDate, onInspectDate, onEditSession = study.setEditingId }: { study: GoalViewStudySession; anchor: string; goals: Goal[]; selectedDate: string; onInspectDate: (date: string) => void; onEditSession?: (id: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const goalIds = goals.map(g => g.id);
  return <PlannerDndProvider
    getEntryLabel={id => study.state.sessions.find(s => s.id === id)?.name ?? "Session"}
    getDayLabel={date => dateLabel(date)}
    onEntryDragStart={() => setDragging(true)}
    onEntryDragCancel={() => setDragging(false)}
    onEntryDragEnd={(id, target) => {
      setDragging(false);
      const session = study.state.sessions.find(s => s.id === id);
      if (session && target) study.dispatch({ type: "edit", id, date: target.day, time: session.time });
    }}>
    <div className="tw-week-viewport" tabIndex={0} role="region" aria-label="Week agenda, days arranged vertically">
      <ol className="flex flex-col" aria-label="Week agenda">
        {weaveWeekDates(anchor).map(date => <CalendarMonthDayCell
          key={date} layout="agenda" day={date} inMonth
          isToday={date === SAMPLE_TODAY} isPastInMonth={date < SAMPLE_TODAY} isSelected={date === selectedDate}
          ariaLabel={`Inspect ${dateLabel(date, "EEEE, MMMM d, yyyy")}`}
          entriesForDay={sessionsOnDate(study.state.sessions, date, goalIds).map(s => studyCalendarEntry(s, goals.find(g => g.id === s.goalId)!, study.state))}
          completionFactMarkersForDay={[]} maxVisibleItems={Infinity} isAnyEntryDragging={dragging}
          getEntryDisplayTitle={entry => `${entry.session.time || "Any time"} · ${entry.goalTitle}${entry.session.milestone ? ` · ${entry.session.name}` : ""}`}
          isEntryCredited={entry => isDone(entry.session, study.state.facts)}
          isEntryImmovableForDraft={entry => entry.session.locked || isDone(entry.session, study.state.facts) || entry.session.date < SAMPLE_TODAY}
          onEntryClick={(_date, entry) => onEditSession(entry.key)}
          onCellClick={() => onInspectDate(date)} onCellDoubleClick={() => onInspectDate(date)}
          onCellMouseEnter={() => {}} onCellMouseLeave={() => {}} onCellPointerDown={() => {}}
          onCellPointerUp={() => {}} onCellPointerCancel={() => {}} onCellPointerLeave={() => {}}
          onEntryPointerStart={() => {}} onEntryPointerEnd={() => {}}
          getCompletionToggleState={entry => ({
            currentlyCredited: isDone(entry.session, study.state.facts),
            disabledReasonCopy: sessionIsDraft(study.state, entry.session) ? "Save date changes first."
              : completionIntent(entry.session, study.state.facts).allowed ? null : "Available on the scheduled date.",
          })}
          onToggleCompletion={entry => study.dispatch({ type: "complete", id: entry.key })}
        />)}
      </ol>
    </div>
  </PlannerDndProvider>;
}
