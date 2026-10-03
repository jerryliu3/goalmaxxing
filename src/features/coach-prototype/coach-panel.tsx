import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronDown, ChevronRight, Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import { allChanges, contextFor, type View } from "./model";
import { CoachMark, IconButton } from "./primitives";
import { Conversation, ChangeReview } from "./conversation";
import { RoomNavigation, Rooms, Understanding } from "./rooms";
import { CheckIn } from "./check-in";
import type { Prototype } from "./use-prototype";
import s from "./prototype.module.css";

function Context({ prototype }: { prototype: Prototype }) {
  const [open, setOpen] = useState(false);
  const { state } = prototype;
  const facts = contextFor(state);
  return <div className={s.context}>
    <button className={s.contextSummary} aria-expanded={open} onClick={() => setOpen(!open)}>
      <span><i className={s.contextDot} />{facts.page}</span><span>{facts.todayDone}/{facts.today.length} today · {facts.weekDone}/{facts.weekTotal} week {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</span>
    </button>
    {facts.selected && <p className={s.selectedContext}>Looking at <strong>{facts.selected.title}</strong> · {facts.selected.done ? "complete" : "planned"}</p>}
    {open && <dl className={s.contextDetails}>
      <div><dt>This page</dt><dd>{facts.purpose}</dd></div>
      <div><dt>Today</dt><dd>{facts.today.length - facts.todayDone} items remain · Friday, October 2</dd></div>
      <div><dt>This week</dt><dd>{facts.weekDone} recorded of {facts.weekTotal} · Sep 28 — Oct 4</dd></div>
      <div><dt>Freshness</dt><dd>Current sample plan · revision {state.revision}. Room preferences are separate.</dd></div>
    </dl>}
  </div>;
}

function ChangeHistory({ prototype }: { prototype: Prototype }) {
  const changes = allChanges(prototype.state).slice().reverse();
  return <div className={s.contentView}><p className={s.eyebrow}>Changes across your rooms</p><h2>A clear record.</h2><p className={s.muted}>See what was proposed, what you applied, and what you left as it was.</p>
    {changes.length ? changes.map(change => <div key={change.id} className={s.historyItem}><small className={s.eyebrow}>{prototype.state.topics.find(row => row.id === change.topicId)?.title}</small><ChangeReview change={change} prototype={prototype} /></div>) : <div className={s.empty}>Nothing changed yet. Ask “Make today lighter” to review a plan adjustment.</div>}
  </div>;
}

export function CoachPanel({ prototype }: { prototype: Prototype }) {
  const { state, dispatch } = prototype;
  const reduced = useReducedMotion();
  const topic = state.topics.find(row => row.id === state.topicId)!;
  const thread = state.threads.find(row => row.id === state.threadId)!;
  const expanded = state.mode === "expanded";
  const tabs: { id: View; label: string }[] = [
    { id: "conversation", label: "Conversation" }, { id: "rooms", label: "Rooms" },
    { id: "checkin", label: "Check-in" }, { id: "understanding", label: "Understanding" }, { id: "changes", label: "Changes" },
  ];
  return <motion.section layout layoutId="coach-surface" transition={{ layout: { duration: reduced ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] } }} className={s.panel} data-mode={state.mode} aria-label="Coach companion">
    <header className={s.panelHeader}>
      <div className={s.coachIdentity}><CoachMark small /><div><strong>Companion</strong><small>{expanded ? "A little room to think." : "Here with you."}</small></div></div>
      <div className={s.actions}><IconButton label={expanded ? "Return to companion" : "Expand into rooms"} onClick={() => dispatch({ type: "mode", value: expanded ? "companion" : "expanded" })}>{expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</IconButton><IconButton label="Minimize coach" onClick={() => dispatch({ type: "mode", value: "minimized" })}><Minus size={18} /></IconButton></div>
    </header>
    <Context prototype={prototype} />
    <nav className={s.panelTabs} aria-label="Coach views">{tabs.map(tab => <button key={tab.id} aria-current={state.view === tab.id ? "page" : undefined} onClick={() => dispatch({ type: "view", value: tab.id })}>{tab.label}</button>)}</nav>
    <div className={s.panelBody}>
      {expanded && <RoomNavigation prototype={prototype} />}
      <div className={s.panelMain}>
        {state.view === "conversation" && <div className={s.conversationHeading}>
          <button className={s.roomSelector} onClick={() => dispatch({ type: "view", value: "rooms" })}><i data-tone={topic.tone} /><span>{topic.title}<small>{thread.title}</small></span><ChevronDown size={14} /></button>
          <IconButton label="New conversation in this room" onClick={() => dispatch({ type: "new-thread", id: crypto.randomUUID() })}><Plus size={17} /></IconButton>
        </div>}
        {state.view === "conversation" && <Conversation prototype={prototype} />}
        {state.view === "rooms" && <Rooms prototype={prototype} />}
        {state.view === "understanding" && <Understanding key={topic.id} prototype={prototype} />}
        {state.view === "checkin" && <CheckIn prototype={prototype} />}
        {state.view === "changes" && <ChangeHistory prototype={prototype} />}
      </div>
      {expanded && state.view === "conversation" && <aside className={s.insightPane}><Understanding key={topic.id} compact prototype={prototype} /></aside>}
    </div>
    <footer className={s.panelFooter}>{expanded ? "Return to companion to see your page again." : "Expand for your rooms, history, and deeper understanding."}<span>⌘ / Ctrl J</span></footer>
  </motion.section>;
}
