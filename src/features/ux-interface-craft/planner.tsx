import { Check, Search, ArrowUpRight } from "lucide-react";
import { goalFor, monthDays, visibleSessions, type DemoProps, type Category, type View } from "./model";
import s from "./study.module.css";

export function PlannerConcept({ concept, state, update }: DemoProps) {
  const entries = visibleSessions(state);
  function toggle(id: string) {
    update({ completed: state.completed.includes(id) ? state.completed.filter(value => value !== id) : [...state.completed, id] });
  }
  const controls = <div className={s.controlDeck}>
    <div className={s.viewSwitch} role="group" aria-label="Planner view">
      {(["Day", "Week", "Month"] as View[]).map(view => <button key={view} aria-pressed={state.view === view} onClick={() => update({ view })}>{view}</button>)}
    </div>
    <div className={s.filters} role="group" aria-label="Filter goals">
      {(["All", "Health", "Craft"] as Category[]).map(category => <button key={category} aria-pressed={state.category === category} onClick={() => update({ category })}>{category}</button>)}
    </div>
    <label className={s.search}><Search size={15} aria-hidden="true" /><input type="search" aria-label="Search sample goals" placeholder="Find a goal…" value={state.query} onChange={event => update({ query: event.target.value })} /></label>
  </div>;
  const sessionButton = (entry: typeof entries[number]) => {
    const goal = goalFor(entry.goalId);
    const done = state.completed.includes(entry.id);
    return <button key={entry.id} className={s.workItem} data-color={goal.color} data-done={done} aria-label={`${done ? "Undo" : "Complete"} ${goal.short}, September ${entry.day}`} aria-pressed={done} onClick={() => toggle(entry.id)}>
      <span className={s.check}>{done ? <Check size={13} /> : null}</span>
      <span><strong>{goal.short}</strong><small>{entry.time} · {entry.duration}</small></span>
    </button>;
  };
  return <div className={s.planner}>
    <header className={s.surfaceHeader}><div><p className={s.eyebrow}>{concept === "signal" ? "PLAN / 039" : "A little intention goes a long way"}</p><h3>{state.view === "Day" ? "Wednesday, 23" : state.view === "Month" ? "September" : "Your week, in view."}</h3><p>September 2026 <span>· {state.completed.length} of 7 sessions complete</span></p></div><span className={s.dateStamp}>23<small>WED</small></span></header>
    <div className={s.plannerBody}>
      {controls}
      <div className={s.planCanvas}>
        {state.view === "Month" ? <div className={s.miniMonth}>
          {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <small key={index}>{day}</small>)}
          {monthDays(9).map((day, index) => <div key={index} data-focus={day === 23}><span>{day}</span>{entries.filter(entry => entry.day === day).map(entry => <button key={entry.id} onClick={() => toggle(entry.id)} aria-pressed={state.completed.includes(entry.id)} aria-label={`${state.completed.includes(entry.id) ? "Undo" : "Complete"} ${goalFor(entry.goalId).short}, September ${day}`} data-color={goalFor(entry.goalId).color} className={s.monthMark}>{state.completed.includes(entry.id) ? "✓ " : ""}{goalFor(entry.goalId).short}</button>)}</div>)}
        </div> : state.view === "Day" ? <div className={s.dayList}><p className={s.eyebrow}>Two small steps today</p>{entries.map(sessionButton)}</div> : <div className={s.weekGrid}>
          {[21, 22, 23, 24, 25, 26, 27].map((day, index) => <div className={s.weekDay} key={day} data-focus={day === 23}><div className={s.dayLabel}><small>{["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][index]}</small><strong>{day}</strong></div><div>{entries.filter(entry => entry.day === day).map(sessionButton)}{!entries.some(entry => entry.day === day) && <span className={s.openDay}>—</span>}</div></div>)}
        </div>}
        {!entries.length && <p role="status" className={s.empty}>No sessions match. Try another category or search.</p>}
        <footer className={s.canvasFooter}><span>Small steps. Room to breathe.</span><button className={s.textAction} onClick={() => update({ view: "Day", category: "All", query: "" })}>Focus on Wednesday <ArrowUpRight size={14} /></button></footer>
      </div>
    </div>
  </div>;
}
