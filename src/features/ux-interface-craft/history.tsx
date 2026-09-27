import { ChevronLeft, ChevronRight, Check, Minus } from "lucide-react";
import { dayCount, monthDays, sessions, goalFor, type DemoProps } from "./model";
import s from "./study.module.css";

export function HistoryConcept({ concept, state, update }: DemoProps) {
  const name = state.month === 9 ? "September" : "August";
  const days = monthDays(state.month);
  const total = days.reduce<number>((sum, day) => sum + (day ? dayCount(state.month, day, state.completed) : 0), 0);
  const count = dayCount(state.month, state.selectedDay, state.completed);
  const recorded = sessions.filter(entry => state.month === 9 && entry.day === state.selectedDay && state.completed.includes(entry.id));
  const future = state.month === 9 && state.selectedDay > 27;
  return <div>
    <header className={s.surfaceHeader}><div><p className={s.eyebrow}>The shape of showing up</p><h3>{concept === "typeset" ? "Days, well spent." : "Your effort leaves a trace."}</h3><p>{total} completions <span>· {name} 2026</span></p></div></header>
    <div className={s.historyBody}>
      <div><div className={s.monthHeading}><h4>{name} <span>2026</span></h4><div className={s.arrowGroup}><button aria-label="Previous month" disabled={state.month === 8} onClick={() => update({ month: 8, selectedDay: 23 })}><ChevronLeft size={17} /></button><button aria-label="Next month" disabled={state.month === 9} onClick={() => update({ month: 9, selectedDay: 23 })}><ChevronRight size={17} /></button></div></div>
        <div className={s.weekdays}>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <span key={day}>{day}</span>)}</div>
        <div className={s.historyGrid} aria-label={`${name} completion history`}>
          {days.map((day, index) => day === null ? <span className={s.blankDay} key={`blank-${index}`} aria-hidden="true" /> : <button key={day} className={s.historyDay} data-level={dayCount(state.month, day, state.completed)} data-future={state.month === 9 && day > 27} data-selected={state.selectedDay === day} aria-pressed={state.selectedDay === day} aria-label={`${name} ${day}: ${state.month === 9 && day > 27 ? "future day" : `${dayCount(state.month, day, state.completed)} completions`}`} onClick={() => update({ selectedDay: day })}>
            <span>{day}</span>{concept === "typeset" ? <small>{dayCount(state.month, day, state.completed) > 0 ? `${dayCount(state.month, day, state.completed)} done` : ""}</small> : concept === "signal" ? <span className={s.cellMeter} aria-hidden="true">{"▮".repeat(dayCount(state.month, day, state.completed))}</span> : <span className={s.cellDot} aria-hidden="true">{dayCount(state.month, day, state.completed) > 0 ? "·" : ""}</span>}
          </button>)}
        </div>
        <div className={s.legend}><span>Less</span>{[0, 1, 2].map(level => <i key={level} data-level={level} />)}<span>More</span><span className={s.legendHint}>Select any day to inspect</span></div>
      </div>
      <aside className={s.dayInspection} aria-live="polite"><p className={s.eyebrow}>Day detail</p><h4>{name} {state.selectedDay}</h4><div className={s.dayTotal}>{future ? "—" : count}<small>{future ? "Still ahead" : count === 1 ? "completion" : "completions"}</small></div>
        {recorded.map(entry => <p className={s.record} key={entry.id}><Check size={15} />{goalFor(entry.goalId).short}</p>)}
        {!recorded.length && <p className={s.muted}>{future ? "A little room for what comes next." : count ? "Recorded effort from earlier in the sample month." : "No completions recorded. Every day belongs in the picture."}</p>}
        <span className={s.inspectionRule}><Minus size={16} /> Sample history · read only</span>
      </aside>
    </div>
  </div>;
}
