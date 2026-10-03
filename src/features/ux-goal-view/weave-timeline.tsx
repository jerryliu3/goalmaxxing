"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { GripVertical, LockKeyhole } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PlannerDraggableEntry, PlannerDroppableDay } from "@/features/planner/calendar-dnd";
import type { Goal } from "@/lib/goals/types";
import { dateLabel, goalProgress, isDone, sessionIsDraft, sessionsForGoal, type SessionScope } from "./model";
import { SAMPLE_TODAY, type ScheduledSession } from "./sample";
import type { GoalViewStudySession } from "./use-study";
import { AXIS_DAYS, axisDate, axisIndex } from "./weave-axis";
import { WeaveDnd } from "./weave-dnd";
import { useWeaveAxis } from "./use-weave-axis";
import { SessionCompletion } from "./session-completion";

export function WeaveTimeline({ goals, study, scope = "all", selectedGoalId, selectedDate, onSelectDate, requestedDate, dayWidth, labelWidth, onVisibleDate, onFocusGoal }: { goals: Goal[]; study: GoalViewStudySession; scope?: SessionScope; selectedGoalId?: string; selectedDate: string; onSelectDate: (date: string) => void; requestedDate: { date: string; revision: number }; dayWidth: number; labelWidth: number; onVisibleDate: (date: string) => void; onFocusGoal: (id: string) => void }) {
  const axis = useWeaveAxis(dayWidth, labelWidth, requestedDate.date, onVisibleDate);
  const { scrollToDate } = axis;
  const appliedRevision = useRef(requestedDate.revision);
  useEffect(() => {
    if (appliedRevision.current === requestedDate.revision) return;
    appliedRevision.current = requestedDate.revision;
    scrollToDate(requestedDate.date);
  }, [requestedDate, scrollToDate]);
  const dates = useMemo(() => Array.from({ length: axis.range.last - axis.range.first + 1 }, (_, i) => ({ index: axis.range.first + i, date: axisDate(axis.range.first + i) })), [axis.range.first, axis.range.last]);
  const rows = useMemo(() => goals.map(goal => ({ goal, sessions: sessionsForGoal(study.state.sessions, goal.id, scope) })), [goals, study.state.sessions, scope]);
  const laneWidth = AXIS_DAYS * dayWidth;
  return <WeaveDnd study={study} dayWidth={dayWidth}>
    <motion.div layoutScroll ref={axis.ref} className="tw-viewport" tabIndex={0} role="region" aria-label="Time Weave calendar, scroll across dates" style={{ "--tw-day-width": `${dayWidth}px`, "--tw-label-width": `${labelWidth}px` } as CSSProperties}>
      <div className="tw-canvas" style={{ width: labelWidth + laneWidth }}>
        <div className="tw-axis-header">
          <div className="tw-corner"><span className="gv-overline">Scheduled dates</span><strong>Goals × time</strong><small>{selectedGoalId ? "Tap a goal to inspect" : "Tap a goal to focus"}</small></div>
          <div className="tw-day-axis" style={{ width: laneWidth }}>
            {dates.map(({ index, date }) => <button className="tw-day" key={date} style={{ left: index * dayWidth, width: dayWidth }} data-today={date === SAMPLE_TODAY} aria-pressed={selectedDate === date} aria-label={`Inspect ${dateLabel(date, "EEEE, MMMM d, yyyy")}`} onClick={() => onSelectDate(date)}><span className="gv-overline">{index % 7 === 0 ? dateLabel(date, "MMM d") + " · week" : ""}</span><small>{dateLabel(date, "EEE")}</small><strong>{dateLabel(date, "d")}</strong><small>{dateLabel(date, "MMM yyyy")}</small></button>)}
          </div>
        </div>
        <div className="tw-date-drop-layer" style={{ left: labelWidth, width: laneWidth, height: goals.length * 112 }} aria-hidden="true">
          {dates.map(({ index, date }) => <PlannerDroppableDay key={date} day={date}>{({ setNodeRef, isOver }) => <div ref={setNodeRef} className="tw-drop-day" data-over={isOver} data-today={date === SAMPLE_TODAY} data-selected={date === selectedDate} style={{ left: index * dayWidth, width: dayWidth }} />}</PlannerDroppableDay>)}
        </div>
        {rows.map(({ goal, sessions }) => <section className="tw-goal-row" key={goal.id} aria-label={`${goal.title} timeline`}>
            <button className="tw-row-label" aria-pressed={selectedGoalId ? selectedGoalId === goal.id : undefined} onClick={() => onFocusGoal(goal.id)} style={{ "--tw-goal-color": goal.color } as CSSProperties}><span /><strong>{goal.title}</strong><small>{goalProgress(goal, study.state.facts).label}</small></button>
            <div className="tw-row-lane" style={{ width: laneWidth }}>
              {sessions.filter(s => { const index = axisIndex(s.date); return index >= axis.range.first && index <= axis.range.last; }).map(s => <WeavePill key={s.id} session={s} study={study} goal={goal} dayWidth={dayWidth} />)}
            </div>
          </section>)}
      </div>
    </motion.div>
    <div className="tw-axis-footnote"><span>Scroll across dates · drag a handle to move a session</span><span>Select a date to see that day together</span></div>
  </WeaveDnd>;
}

function WeavePill({ session: s, goal, study, dayWidth }: { session: ScheduledSession; goal: Goal; study: GoalViewStudySession; dayWidth: number }) {
  const still = useReducedMotion();
  const done = isDone(s, study.state.facts);
  const disabled = done || s.locked;
  return <PlannerDraggableEntry entryKey={s.id} disabled={disabled}>{({ setNodeRef, setActivatorNodeRef, listeners, attributes, isDragging }) =>
    <motion.div ref={setNodeRef} layout={still || isDragging ? false : "position"} transition={{ duration: .18, ease: [.2, .8, .2, 1] }} className="tw-pill" data-done={done} data-draft={sessionIsDraft(study.state, s)} data-dragging={isDragging} style={{ left: axisIndex(s.date) * dayWidth + 6, width: dayWidth - 12, "--tw-goal-color": goal.color } as CSSProperties}>
      <button className="tw-pill-open" aria-label={`Edit ${s.name}, ${dateLabel(s.date)}`} onClick={() => study.setEditingId(s.id)}><small>{s.time || "Any time"}{s.locked && <LockKeyhole size={9} />}{done && " · logged"}</small><strong>{s.milestone ? `${s.milestone}. ` : ""}{s.name}</strong></button>
      <div className="tw-pill-actions"><SessionCompletion session={s} study={study} />{!disabled && <button ref={setActivatorNodeRef} className="tw-drag-handle" {...attributes} {...listeners} aria-label={`Move ${s.name}, ${dateLabel(s.date)}`}><GripVertical size={14} /></button>}</div>
    </motion.div>
  }</PlannerDraggableEntry>;
}
