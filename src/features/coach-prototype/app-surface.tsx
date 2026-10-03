import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Circle, Leaf, MessageCircle, Users } from "lucide-react";
import { DAYS, TODAY, contextFor, dateLabel, type Session } from "./model";
import type { Prototype } from "./use-prototype";
import s from "./prototype.module.css";

function WorkRow({ row, prototype }: { row: Session; prototype: Prototype }) {
  const { state, dispatch } = prototype;
  return <div className={s.workRow} data-selected={state.selectedSession === row.id} data-done={row.done}>
    <button className={s.completeButton} onClick={() => dispatch({ type: "complete", id: row.id })} aria-label={`${row.done ? "Undo completion for" : "Complete"} ${row.title}`} aria-pressed={row.done}>{row.done ? <Check size={17} /> : <Circle size={19} />}</button>
    <button className={s.rowTitle} onClick={() => dispatch({ type: "select", id: row.id })}><span>{row.title}</span><small>{row.task ? "One-off task" : row.goal} · {row.time}</small></button>
    <button className={s.quietButton} onClick={() => { dispatch({ type: "select", id: row.id }); dispatch({ type: "mode", value: "companion" }); dispatch({ type: "view", value: "conversation" }); }} aria-label={`Ask coach about ${row.title}`}><MessageCircle size={16} /></button>
  </div>;
}
export function AppSurface({ prototype }: { prototype: Prototype }) {
  const { state, dispatch } = prototype;
  const facts = contextFor(state);
  const selectedRows = state.sessions.filter(row => row.date === state.selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  const goalNames = [...new Set(state.sessions.filter(row => !row.task).map(row => row.goal))];
  return <main className={s.appContent} data-mode={state.mode} aria-label={`${state.surface} sample page`}>
    <div className={s.pageHeading}><div><p className={s.eyebrow}>Friday, October 2 · Your space</p><h1>{state.surface === "Plan" ? "A little room to move." : state.surface === "Checklist" ? "One thing at a time." : state.surface === "Progress" ? "The work is adding up." : state.surface === "Community" ? "Good company." : "Make this yours."}</h1></div><span className={s.dateStamp}>02<span>OCT</span></span></div>
    {(state.surface === "Plan" || state.surface === "Checklist") && <>
      <div className={s.weekHeading}><span>September 28 — October 4</span><span className={s.muted}>{facts.weekDone} of {facts.weekTotal} recorded</span></div>
      {state.surface === "Plan" ? <div className={s.weekBoard}>
        {DAYS.map(day => {
          const rows = state.sessions.filter(row => row.date === day.date);
          return <div key={day.date} className={s.day} data-current={day.date === TODAY} data-selected={day.date === state.selectedDate}>
            <button className={s.dayHeading} onClick={() => dispatch({ type: "date", value: day.date })} aria-pressed={day.date === state.selectedDate}><small>{day.name}</small><span>{day.number}</span>{day.date === TODAY && <em>Today</em>}</button>
            <div className={s.pills}>{rows.map(row => <button key={row.id} className={s.pill} data-tone={row.tone} data-done={row.done} aria-label={`Select ${row.title}, ${dateLabel(row.date)}`} onClick={() => { dispatch({ type: "date", value: row.date }); dispatch({ type: "select", id: row.id }); }}>{row.done && <Check size={11} />}<span>{row.goal === "Personal" ? "Notes" : row.goal}</span></button>)}</div>
          </div>;
        })}
      </div> : <div className={s.checklistDays} aria-label="Checklist day">{DAYS.map(day => <button key={day.date} aria-pressed={day.date === state.selectedDate} onClick={() => dispatch({ type: "date", value: day.date })}>{day.name}<span>{day.number}</span></button>)}</div>}
      <section className={s.dayWork}>
        <div className={s.sectionHeading}><div><p className={s.eyebrow}>{state.selectedDate === TODAY ? "Today" : dateLabel(state.selectedDate)}</p><h2>{state.selectedDate === TODAY ? "Your next steps" : "On this day"}</h2></div><span className={s.muted}>{selectedRows.filter(row => !row.done).length} remaining</span></div>
        {selectedRows.map(row => <WorkRow key={row.id} row={row} prototype={prototype} />)}
        {selectedRows.length === 0 && <p className={s.empty}>A clear day. You can leave it that way.</p>}
      </section>
      {facts.selected && <section className={s.selectionDetail}><p className={s.eyebrow}>Looking at</p><h3>{facts.selected.title}</h3><p>{dateLabel(facts.selected.date)} · {facts.selected.time} · {facts.selected.done ? "Recorded complete" : "Scheduled, not yet complete"}</p><button className={s.textButton} onClick={() => prototype.send(`Help me think about ${facts.selected!.title}.`)}>Talk through this with coach <ArrowUpRight size={15} /></button></section>}
    </>}
    {state.surface === "Progress" && <section className={s.progressList}>{goalNames.map(goal => {
      const rows = state.sessions.filter(row => row.goal === goal); const completed = rows.filter(row => row.done).length;
      return <button className={s.progressRow} key={goal} onClick={() => dispatch({ type: "select", id: (rows.find(row => !row.done) ?? rows[0]).id })} aria-pressed={facts.selected?.goal === goal}><span><strong>{goal}</strong><small>This week · {completed} of {rows.length} sessions</small></span><span className={s.progressTrack}><i style={{ width: `${completed / rows.length * 100}%` }} /></span><ArrowUpRight size={18} /></button>;
    })}<div className={s.editorialNote}><Leaf size={21} /><div><h3>Progress has a rhythm.</h3><p>Your completed work belongs here. Your next placement belongs in Plan. Your coach can help connect the two.</p></div></div></section>}
    {state.surface === "Community" && <section className={s.community}><div className={s.communityHero}><Users size={32} /><h2>A bit of encouragement.</h2><p>Maya finished a morning walk. You finished your run. Different goals, a little shared momentum.</p><span className={s.live}><i />Sample shared activity</span></div><div className={s.editorialNote}><p>Your private conversations and preferences stay in your coach rooms. Shared activity is a separate view.</p></div></section>}
    {state.surface === "You" && <section className={s.settings}><div className={s.identity}><span>JL</span><div><h2>Jerry</h2><p>A rhythm that works for you.</p></div></div><dl><div><dt>Timezone</dt><dd>America / New York</dd></div><div><dt>Week starts</dt><dd>Monday</dd></div><div><dt>Check-ins</dt><dd>Daily, weekly & monthly</dd></div></dl><button className={s.textButton} onClick={() => { dispatch({ type: "mode", value: "expanded" }); dispatch({ type: "view", value: "understanding" }); }}>See what your coach remembers <ArrowUpRight size={16} /></button></section>}
    <footer className={s.appFooter}><span>Small steps. A bigger picture.</span><div><button className={s.quietButton} aria-label="Previous day" disabled={state.selectedDate === DAYS[0].date} onClick={() => dispatch({ type: "date", value: DAYS[Math.max(0, DAYS.findIndex(row => row.date === state.selectedDate) - 1)].date })}><ChevronLeft size={16} /></button><button className={s.quietButton} aria-label="Next day" disabled={state.selectedDate === DAYS[6].date} onClick={() => dispatch({ type: "date", value: DAYS[Math.min(6, DAYS.findIndex(row => row.date === state.selectedDate) + 1)].date })}><ChevronRight size={16} /></button></div></footer>
  </main>;
}
