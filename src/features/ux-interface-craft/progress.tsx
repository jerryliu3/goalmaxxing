import { ArrowDown, ArrowUpRight } from "lucide-react";
import { goals, goalCount, progressFacts, sessions, type DemoProps } from "./model";
import s from "./study.module.css";

export function ProgressConcept({ concept, state, update }: DemoProps) {
  const { done, target, percent } = progressFacts(state);
  const rows = goals.map(goal => ({ ...goal, done: state.period === "week" ? sessions.filter(entry => entry.goalId === goal.id && state.completed.includes(entry.id)).length : goalCount(goal.id, state.completed), target: state.period === "week" ? sessions.filter(entry => entry.goalId === goal.id).length : goal.target }));
  return <div>
    <header className={s.surfaceHeader}><div><p className={s.eyebrow}>A clear view of your momentum</p><h3>It adds up.</h3><p>{state.period === "week" ? "September 21–27" : "September 2026"}<span> · recorded effort</span></p></div></header>
    <div className={s.summaryBody}>
      <div className={s.viewSwitch} role="group" aria-label="Summary period"><button aria-pressed={state.period === "week"} onClick={() => update({ period: "week" })}>This week</button><button aria-pressed={state.period === "month"} onClick={() => update({ period: "month" })}>This month</button></div>
      <div className={s.summaryHero}>
        {concept === "contour" ? <><div className={s.progressRing} style={{ background: `conic-gradient(var(--accent) ${percent}%, var(--soft) 0)` }}><div><strong>{done}<small>of {target}</small></strong></div></div><div><p className={s.eyebrow}>Sessions complete</p><h4>One step.<br />Then another.</h4><p>{target - done} sessions remain {state.period === "week" ? "this week" : "this month"}.</p></div></> : concept === "typeset" ? <><p className={s.summarySentence}>You showed up<br /><strong>{done} times.</strong></p><p>Out of {target} intended sessions.<br />A record of effort, still in the making.</p><div className={s.tally} aria-label={`${done} of ${target} complete`}>{Array.from({ length: target }, (_, index) => <i key={index} data-filled={index < done} />)}</div></> : <><div className={s.signalReadout}><span className={s.eyebrow}>COMPLETION / {state.period.toUpperCase()}</span><strong>{percent}<small>%</small></strong><p>{done} RECORDED <span>/ {target} PLANNED</span></p></div><div className={s.signalBars} aria-label={`${done} of ${target} complete`}>{Array.from({ length: target }, (_, index) => <i key={index} data-filled={index < done} />)}</div></>}
      </div>
      <button className={s.detailToggle} aria-expanded={state.breakdown} onClick={() => update({ breakdown: !state.breakdown })}>{state.breakdown ? "Hide goal breakdown" : "See goal breakdown"}{state.breakdown ? <ArrowDown size={17} /> : <ArrowUpRight size={17} />}</button>
      {state.breakdown && <div className={s.breakdown}>{rows.map(goal => <div key={goal.id}><span>{goal.title}</span><strong>{goal.done} / {goal.target}</strong><div className={s.progressTrack}><span style={{ width: `${goal.done / goal.target * 100}%` }} /></div></div>)}</div>}
    </div>
  </div>;
}
