"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Filter, ArrowUpRight, Search } from "lucide-react";
import { goalProgress, type SessionGrouping, type SessionScope } from "./model";
import { SAMPLE_GOALS, SAMPLE_TODAY } from "./sample";
import { GoalPanel } from "./goal-panel";
import { MobileDeck } from "./mobile-deck";
import { CalendarPeek } from "./calendar-peek";
import { SessionEditor } from "./session-editor";
import { DraftBar, StudyChrome } from "./study-chrome";
import { useGoalViewStudy } from "./use-study";
import { useStageWidth } from "./use-stage-width";
import "./study.css";

export function GoalViewStudy() {
  const study = useGoalViewStudy();
  const stage = useStageWidth();
  const [layout, setLayout] = useState<"rails" | "desk">("rails");
  const [phone, setPhone] = useState(false);
  const [mobileLayout, setMobileLayout] = useState<"carousel" | "vertical">("carousel");
  const [scope, setScope] = useState<SessionScope>("upcoming");
  const [grouping, setGrouping] = useState<SessionGrouping>("week");
  const [goalIds, setGoalIds] = useState<string[]>(SAMPLE_GOALS.map(g => g.id));
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(SAMPLE_GOALS[0].id);
  const goals = useMemo(() => SAMPLE_GOALS.filter(g => goalIds.includes(g.id) && g.title.toLowerCase().includes(query.trim().toLowerCase())), [goalIds, query]);
  const selected = goals.find(g => g.id === selectedId) ?? goals[0];
  const mobile = phone || stage.width < 760;
  return <StudyChrome phone={phone} onPhoneChange={setPhone} onReset={() => { study.dispatch({ type: "reset" }); study.setEditingId(null); study.setCalendarDate(null); }} controls={<>
    <div className="gv-segmented" role="group" aria-label="Design direction"><button aria-pressed={layout === "rails"} onClick={() => setLayout("rails")}>Card Rails</button><button aria-pressed={layout === "desk"} onClick={() => setLayout("desk")}>Goal Desk</button></div>
    <label className="gv-lab-select">Phone arrangement<select value={mobileLayout} onChange={e => setMobileLayout(e.target.value as "carousel" | "vertical")}><option value="carousel">Swipeable cards</option><option value="vertical">Vertical goals</option></select></label>
  </>}>
    <div className="gv-stage-wrap" data-phone={phone}><div className="gv-stage" ref={stage.ref}>
      <main className="gv-product" data-layout={layout} data-mobile-layout={mobileLayout}>
        <div className="gv-product-header"><div><p className="gv-overline">Plan / goal view</p><h1 className="gv-display">Make room for what matters.</h1><p className="gv-intro">Your goals, and the days you’ve set aside for them.</p></div><button className="gv-button" onClick={() => study.setCalendarDate(SAMPLE_TODAY)}><CalendarDays size={16} />See week</button></div>
        <div className="gv-product-toolbar">
          <details className="gv-filter"><summary className="gv-button"><Filter size={15} />{goalIds.length === SAMPLE_GOALS.length ? "All goals" : `${goalIds.length} goals`}</summary><div className="gv-filter-menu"><strong>Show goals</strong>{SAMPLE_GOALS.map(g => <label key={g.id}><input type="checkbox" checked={goalIds.includes(g.id)} onChange={e => setGoalIds(ids => e.target.checked ? [...ids, g.id] : ids.filter(id => id !== g.id))} />{g.title}</label>)}<button className="gv-text-button" onClick={() => { setGoalIds(SAMPLE_GOALS.map(g => g.id)); setQuery(""); }}>Show all</button></div></details>
          <label className="gv-search"><Search size={15} /><input aria-label="Find a goal" placeholder="Find a goal" value={query} onChange={e => setQuery(e.target.value)} /></label>
          <div className="gv-segmented" role="group" aria-label="Scheduled date range">{([["upcoming", "Upcoming"], ["all", "All dates"], ["history", "Past dates"]] as const).map(([value, label]) => <button key={value} aria-pressed={scope === value} onClick={() => setScope(value)}>{label}</button>)}</div>
          <label className="gv-grouping">Group by<select aria-label="Group dates by" value={grouping} onChange={e => setGrouping(e.target.value as SessionGrouping)}><option value="week">Week</option><option value="month">Month</option></select></label>
        </div>
        {!selected ? <div className="gv-empty"><h2>No goals match this view.</h2><button className="gv-button" onClick={() => { setGoalIds(SAMPLE_GOALS.map(g => g.id)); setQuery(""); }}>Show all goals</button></div> : layout === "desk" ? <div className="gv-desk">
          <nav className="gv-desk-goals" aria-label="Choose a goal">{goals.map(g => <button key={g.id} aria-pressed={g.id === selected.id} onClick={() => setSelectedId(g.id)}><span style={{ backgroundColor: g.color ?? undefined }} /><div><strong>{g.title}</strong><small>{goalProgress(g, study.state.facts).label}</small></div><ArrowUpRight size={15} /></button>)}</nav>
          <GoalPanel key={selected.id} goal={selected} study={study} scope={scope} grouping={grouping} focused />
        </div> : mobile && mobileLayout === "carousel" ? <MobileDeck goals={goals} selectedId={selected.id} onSelect={setSelectedId} study={study} scope={scope} grouping={grouping} /> : <div className="gv-rails">{goals.map(g => <GoalPanel key={g.id} goal={g} study={study} scope={scope} grouping={grouping} />)}</div>}
        <DraftBar study={study} />
      </main>
    </div></div>
    <aside className="gv-study-notes"><p><strong>{layout === "rails" ? "Card Rails" : "Goal Desk"}</strong> · {layout === "rails" ? "Goal objects anchor a browsable track of dates. On phone, compare swiping between goals with a vertical list." : "Choose a goal, then work through its dates in one place. Week and month headings keep long plans readable."}</p><p>Try: move Find your pace one day later; log today’s session; open Past dates to recover Wednesday’s strength session; filter to the 30-step portfolio; browse the ongoing Japanese practice.</p></aside>
    <SessionEditor study={study} /><CalendarPeek study={study} />
  </StudyChrome>;
}
