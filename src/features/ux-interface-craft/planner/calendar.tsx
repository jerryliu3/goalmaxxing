import { Check, ArrowUpRight } from "lucide-react";
import { goalFor, monthDays, visibleSessions, type StudyState } from "../model";
import base from "../study.module.css";
import s from "./planner.module.css";

export function PlannerCalendar({ state, update, contextual = false, selectedId, onSelect }: {
  state: StudyState;
  update: (patch: Partial<StudyState>) => void;
  contextual?: boolean;
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  const entries = visibleSessions(state);
  function toggle(id: string) {
    update({ completed: state.completed.includes(id) ? state.completed.filter(value => value !== id) : [...state.completed, id] });
  }
  function openDay(day: number) { update({ focusDay: day, view: "Day" }); }
  function entryButton(entry: typeof entries[number], compact = false) {
    const goal = goalFor(entry.goalId);
    const done = state.completed.includes(entry.id);
    return <button
      key={entry.id}
      className={compact ? base.monthMark : base.workItem}
      data-color={goal.color}
      data-done={done}
      data-selected={contextual && selectedId === entry.id}
      aria-label={`${contextual ? "Select" : done ? "Undo" : "Complete"} ${goal.short}, September ${entry.day}`}
      aria-pressed={contextual ? selectedId === entry.id : done}
      onClick={() => contextual ? onSelect?.(entry.id) : toggle(entry.id)}
    >
      {compact ? <>{done ? "✓ " : ""}{goal.short}</> : <>
        <span className={base.check}>{done ? <Check size={13} /> : null}</span>
        <span><strong>{goal.short}</strong><small>{entry.time} · {entry.duration}</small></span>
      </>}
    </button>;
  }
  return <div className={`${base.planCanvas} ${s.calendar}`}>
    {state.view === "Month" ? <div className={base.miniMonth}>
      {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <small key={index}>{day}</small>)}
      {monthDays(9).map((day, index) => <div key={index} data-focus={day === state.focusDay}>
        {day && <button className={s.dateButton} aria-label={`Open September ${day}`} onClick={() => openDay(day)}>{day}</button>}
        {entries.filter(entry => entry.day === day).map(entry => entryButton(entry, true))}
      </div>)}
    </div> : state.view === "Day" ? <div className={base.dayList}>
      <p className={base.eyebrow}>September {state.focusDay} · {entries.length} scheduled {entries.length === 1 ? "session" : "sessions"}</p>
      {entries.map(entry => entryButton(entry))}
    </div> : <div className={base.weekGrid}>
      {[21, 22, 23, 24, 25, 26, 27].map((day, index) => <div className={base.weekDay} key={day} data-focus={day === state.focusDay}>
        <button className={`${base.dayLabel} ${s.dayButton}`} aria-label={`Open September ${day}`} onClick={() => openDay(day)}>
          <small>{["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][index]}</small><strong>{day}</strong>
        </button>
        <div>{entries.filter(entry => entry.day === day).map(entry => entryButton(entry))}
          {!entries.some(entry => entry.day === day) && <span className={base.openDay}>—</span>}
        </div>
      </div>)}
    </div>}
    {!entries.length && <p role="status" className={base.empty}>No sessions in this view. Choose another date or clear the scope.</p>}
    <footer className={base.canvasFooter}>
      <span>Sample schedule · September 21–27</span>
      {state.view === "Day" ? <button className={base.textAction} onClick={() => update({ view: "Week" })}>Back to week <ArrowUpRight size={14} /></button>
        : <button className={base.textAction} onClick={() => openDay(23)}>Focus on Wednesday <ArrowUpRight size={14} /></button>}
    </footer>
  </div>;
}
