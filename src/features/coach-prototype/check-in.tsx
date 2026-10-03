import { useState } from "react";
import { ArrowRight, Check, Circle } from "lucide-react";
import { DAYS, TODAY, dateLabel } from "./model";
import type { Prototype } from "./use-prototype";
import s from "./prototype.module.css";

export function CheckIn({ prototype }: { prototype: Prototype }) {
  const { state, dispatch } = prototype;
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");
  const [tab, setTab] = useState<"recap" | "next">("recap");
  const past = state.sessions.filter(row => period === "daily" ? row.date === DAYS[3].date : row.date < TODAY);
  const next = state.sessions.filter(row => !row.done && (period === "daily" ? row.date === TODAY : row.date >= TODAY));
  const rows = tab === "recap" ? past : next;
  const completed = past.filter(row => row.done).length;
  return <div className={s.contentView}>
    <div className={s.segmented} aria-label="Check-in period">{(["daily", "weekly"] as const).map(value => <button key={value} aria-pressed={period === value} onClick={() => setPeriod(value)}>{value === "daily" ? "Daily" : "Weekly"}</button>)}</div>
    <p className={s.eyebrow}>{period === "daily" ? "Friday check-in · Oct 2" : "This week · Sep 28 — Oct 4"}</p>
    <h2>A moment to take stock.</h2>
    <div className={s.checkinTabs} aria-label="Check-in perspective">{(["recap", "next"] as const).map(value => <button key={value} aria-pressed={tab === value} onClick={() => setTab(value)}>{value === "recap" ? "Recap" : "Next"}<small>{value === "recap" ? "What happened" : "What’s ahead"}</small></button>)}</div>
    <div className={s.checkinIntro}><p>{tab === "recap" ? `You recorded ${completed} of ${past.length} items ${period === "daily" ? "yesterday" : "before today"}. ${completed === past.length ? "You’ve caught up on this window." : "An open item can be recorded here if you did it. Otherwise, leave an honest record."}` : `${next.length} items remain ${period === "daily" ? "today" : "from today through Sunday"}. Start with what matters most. If the plan needs more room, we can review an adjustment together.`}</p></div>
    <div className={s.checkinRows}>{rows.map(row => <div className={s.checkinRow} key={row.id}>
      {tab === "recap" ? <button className={s.completeButton} aria-label={`${row.done ? "Undo completion for" : "Record completion for"} ${row.title}`} aria-pressed={row.done} onClick={() => dispatch({ type: "complete", id: row.id })}>{row.done ? <Check size={17} /> : <Circle size={18} />}</button> : <i data-tone={row.tone} />}
      <span><strong>{row.title}</strong><small>{dateLabel(row.date)} · {row.time} · {row.done ? "Recorded" : "Open"}</small></span>
    </div>)}</div>
    {rows.length === 0 && <p className={s.empty}>Nothing outstanding in this window.</p>}
    <button className={s.primaryButton} onClick={() => { dispatch({ type: "select", id: null }); prototype.send(`Talk through my ${period} check-in ${tab}.`); }}>Talk this through <ArrowRight size={15} /></button>
    <p className={s.footnote}>A check-in is a moment in the same coach. Recording work updates your plan; talking keeps you in this room. Sample summaries update locally.</p>
  </div>;
}
