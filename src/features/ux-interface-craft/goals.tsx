import { ArrowUpRight, Check, ChevronDown } from "lucide-react";
import { goals, goalFor, goalCount, sessions, type DemoProps } from "./model";
import s from "./study.module.css";

export function GoalsConcept({ concept, state, update }: DemoProps) {
  const goal = goalFor(state.goalId);
  const count = goalCount(goal.id, state.completed);
  const next = sessions.find(entry => entry.goalId === goal.id && !state.completed.includes(entry.id));
  return <div>
    <header className={s.surfaceHeader}><div><p className={s.eyebrow}>More than a title and a deadline</p><h3>Something to work toward.</h3><p>Three intentions <span>· September 2026</span></p></div></header>
    <div className={s.goalLayout}>
      <div className={s.goalPicker} role="group" aria-label="Choose a sample goal">{goals.map((item, index) => <button key={item.id} aria-pressed={goal.id === item.id} onClick={() => update({ goalId: item.id })}><small>0{index + 1}</small><span>{item.title}</span><ArrowUpRight size={15} /></button>)}</div>
      <article className={s.goalObject} data-color={goal.color}>
        <div className={s.goalTopline}><span>{concept === "signal" ? "ACTIVE INTENTION" : goal.category}</span><span>September / 26</span></div>
        <h4>{goal.title}</h4><p className={s.goalNote}>{goal.note}</p>
        {concept === "contour" ? <div className={s.metadataSentence}>A <strong>{goal.category.toLowerCase()}</strong> goal.<br /><strong>{goal.cadence}</strong>, through <strong>{goal.end}</strong>.</div> : concept === "typeset" ? <dl className={s.metadataTable}><div><dt>Practice</dt><dd>{goal.category}</dd></div><div><dt>Rhythm</dt><dd>{goal.cadence}</dd></div><div><dt>Horizon</dt><dd>{goal.end}, 2026</dd></div></dl> : <div className={s.metadataStrip}><span><small>DOMAIN</small>{goal.category}</span><span><small>RHYTHM</small>{goal.cadence}</span><span><small>ENDS</small>{goal.end}</span></div>}
        <div className={s.goalProgress}><div><strong>{count}<span> / {goal.target}</span></strong><small>{goal.unit} this month</small></div><div className={s.progressTrack} role="progressbar" aria-label={`${goal.title} monthly progress`} aria-valuemin={0} aria-valuemax={goal.target} aria-valuenow={count}><span style={{ width: `${count / goal.target * 100}%` }} /></div></div>
        <button className={s.detailToggle} aria-expanded={state.details} onClick={() => update({ details: !state.details })}>{state.details ? "Close details" : "Open goal details"}<ChevronDown size={18} style={{ transform: state.details ? "rotate(180deg)" : undefined }} /></button>
        {state.details && <div className={s.goalDetails}><p className={s.eyebrow}>Next unfinished session</p><h5>{next ? goal.short : "The sample week is complete"}</h5><p>{next ? `September ${next.day} · ${next.time} · ${next.duration}` : "Every planned session for this goal is recorded."}</p>{next && <button className={s.primaryAction} onClick={() => update({ completed: [...state.completed, next.id] })}><Check size={16} />Mark sample session complete</button>}<p className={s.detailFootnote}>Sample interactions update every concept. Reset the study to start again.</p></div>}
      </article>
    </div>
  </div>;
}
