import { useState } from "react";
import { Archive, ArrowRight, Plus, Trash2 } from "lucide-react";
import type { Prototype } from "./use-prototype";
import s from "./prototype.module.css";

export function RoomNavigation({ prototype }: { prototype: Prototype }) {
  const { state, dispatch } = prototype;
  const topic = state.topics.find(row => row.id === state.topicId)!;
  const rooms = state.topics.filter(row => !row.archived || row.id === topic.id);
  return <aside className={s.roomNavigation} aria-label="Rooms and conversations">
    <p className={s.eyebrow}>Your rooms</p>
    <div className={s.roomLinks}>{rooms.map(room => <button key={room.id} data-active={room.id === topic.id} onClick={() => dispatch({ type: "topic", id: room.id })}><i data-tone={room.tone} />{room.title}{room.archived && <Archive size={13} />}</button>)}</div>
    <button className={s.textButton} onClick={() => dispatch({ type: "view", value: "rooms" })}><Plus size={14} />Browse & create</button>
    <div className={s.threadList}><p className={s.eyebrow}>In this room</p>{state.threads.filter(row => row.topicId === topic.id).map(thread => <button key={thread.id} data-active={thread.id === state.threadId && state.view === "conversation"} onClick={() => dispatch({ type: "thread", id: thread.id })}>{thread.title}{prototype.pending[thread.id] && <span className={s.pendingDot} aria-label="Response in progress" />}</button>)}
      <button className={s.textButton} onClick={() => dispatch({ type: "new-thread", id: crypto.randomUUID() })}><Plus size={14} />New conversation</button>
    </div>
    <p className={s.sidebarNote}>One coach. Different places to keep your thoughts.</p>
  </aside>;
}

export function Rooms({ prototype }: { prototype: Prototype }) {
  const { state, dispatch } = prototype;
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [archived, setArchived] = useState(false);
  return <div className={s.contentView}>
    <p className={s.eyebrow}>A bigger picture</p><h2>Give your thoughts a place.</h2>
    <p className={s.muted}>Rooms hold ongoing intentions, conversations, and the preferences you choose to keep. Today’s facts stay current across all of them.</p>
    <div className={s.roomGrid}>{state.topics.filter(row => row.archived === archived).map(room => <button className={s.roomCard} key={room.id} data-tone={room.tone} onClick={() => dispatch({ type: "topic", id: room.id })}>
      <span className={s.roomArt} aria-hidden="true"><i /><i /><i /></span><h3>{room.title}</h3><p>{room.note}</p>
      <small>{state.threads.filter(row => row.topicId === room.id).length} conversations · {state.memories.filter(row => row.topicId === room.id).length} preferences</small><ArrowRight size={18} />
    </button>)}</div>
    {creating ? <form className={s.inlineForm} onSubmit={event => { event.preventDefault(); if (!title.trim()) return; dispatch({ type: "new-topic", id: crypto.randomUUID(), title: title.trim() }); setTitle(""); setCreating(false); }}>
      <label htmlFor="new-coach-room">What would you like a room for?</label><input autoFocus id="new-coach-room" placeholder="A creative project, a new routine…" value={title} maxLength={80} onChange={event => setTitle(event.target.value)} />
      <div className={s.actions}><button className={s.primaryButton} disabled={!title.trim()}>Create room</button><button type="button" className={s.quietButton} onClick={() => setCreating(false)}>Cancel</button></div>
    </form> : <button className={s.textButton} onClick={() => setCreating(true)}><Plus size={16} />Make a new room</button>}
    <button className={s.archiveToggle} aria-pressed={archived} onClick={() => setArchived(!archived)}>{archived ? "Show active rooms" : "See archived rooms"}</button>
    {archived && !state.topics.some(row => row.archived) && <p className={s.empty}>No archived rooms yet.</p>}
  </div>;
}

export function Understanding({ prototype, compact = false }: { prototype: Prototype; compact?: boolean }) {
  const { state, dispatch } = prototype;
  const topic = state.topics.find(row => row.id === state.topicId)!;
  const [title, setTitle] = useState(topic.title);
  const [intention, setIntention] = useState(topic.intention);
  const [goals, setGoals] = useState(topic.goals);
  const goalNames = [...new Set(state.sessions.filter(row => !row.task).map(row => row.goal))];
  const memories = state.memories.filter(row => row.topicId === topic.id);
  const rows = state.sessions.filter(row => topic.goals.includes(row.goal));
  return <div className={compact ? s.understandingAside : s.contentView}>
    <p className={s.eyebrow}>Understanding · {topic.title}</p><h2>What we’re building on.</h2>
    <p className={s.muted}>Your intention and confirmed preferences stay with this room. Your schedule and completions are read from the current plan.</p>
    <form className={s.inlineForm} onSubmit={event => { event.preventDefault(); if (title.trim()) dispatch({ type: "edit-topic", id: topic.id, title: title.trim(), intention: intention.trim(), goals }); }}>
      <label htmlFor={compact ? "aside-room-title" : "room-title"}>Room name</label><input id={compact ? "aside-room-title" : "room-title"} value={title} maxLength={80} onChange={event => setTitle(event.target.value)} />
      <label htmlFor={compact ? "aside-room-intention" : "room-intention"}>What you’re working toward</label><textarea id={compact ? "aside-room-intention" : "room-intention"} rows={3} value={intention} maxLength={300} onChange={event => setIntention(event.target.value)} placeholder="An intention for this room…" />
      <fieldset className={s.goalChoices}><legend>Linked goals</legend>{goalNames.map(goal => <label key={goal}><input type="checkbox" checked={goals.includes(goal)} onChange={event => setGoals(current => event.target.checked ? [...current, goal] : current.filter(row => row !== goal))} />{goal}</label>)}</fieldset>
      <button className={s.textButton} disabled={!title.trim() || (title.trim() === topic.title && intention.trim() === topic.intention && goals.join() === topic.goals.join())}>Save understanding <ArrowRight size={14} /></button>
    </form>
    <section className={s.understandingSection}><p className={s.eyebrow}>Confirmed preferences</p>{memories.length ? memories.map(memory => <div key={memory.id} className={s.memoryRow}><p>“{memory.text}”<small>Shared by you · kept in this room</small></p><button className={s.quietButton} aria-label={`Forget preference: ${memory.text}`} onClick={() => dispatch({ type: "forget", id: memory.id })}><Trash2 size={14} /></button></div>) : <p className={s.muted}>Nothing kept yet. Say “remember…” in a conversation and review the suggestion.</p>}</section>
    <section className={s.understandingSection}><p className={s.eyebrow}>Current facts · from your plan</p><p>{rows.length ? `${rows.filter(row => row.done).length} of ${rows.length} linked sessions recorded this week.` : "This room has no linked goals in the sample plan."}</p><div className={s.tags}>{topic.goals.map(goal => <span key={goal}>{goal}</span>)}</div><small className={s.muted}>These update with your work; they aren’t stored as preferences.</small></section>
    <button className={s.textButton} onClick={() => dispatch({ type: "archive-topic", id: topic.id })}><Archive size={14} />{topic.archived ? "Restore room" : "Archive room"}</button>
  </div>;
}
