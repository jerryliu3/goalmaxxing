import { useEffect, useRef } from "react";
import { ArrowDown, ArrowRight, Check, Square, Undo2 } from "lucide-react";
import { changeIsStale, contextFor, dateLabel, type Change } from "./model";
import { CoachMark } from "./primitives";
import type { Prototype } from "./use-prototype";
import s from "./prototype.module.css";

export function ChangeReview({ change, prototype }: { change: Change; prototype: Prototype }) {
  const { state, dispatch } = prototype;
  const row = state.sessions.find(item => item.id === change.sessionId)!;
  const stale = changeIsStale(state, change);
  const act = (operation: "apply" | "dismiss" | "undo" | "refresh") => dispatch({ type: "change", id: change.id, operation });
  return <section className={s.changeCard} aria-label={`Review change to ${row.title}`}>
    <p className={s.eyebrow}>{change.status === "proposed" ? "Proposed plan change" : `Change ${change.status}`}</p>
    <h3>{row.title}</h3>
    <div className={s.changeDates}><span><small>From</small>{dateLabel(change.from)} · {change.fromTime}</span><ArrowRight size={16} /><span><small>To</small>{dateLabel(change.to)} · {change.toTime}</span></div>
    <p className={s.muted}>Same session. Same weekly commitment.</p>
    {change.status === "proposed" && <>
      {stale && <p className={s.warning}>Your plan changed since this proposal. Refresh it against the latest context.</p>}
      <div className={s.actions}><button className={s.primaryButton} onClick={() => act(stale ? "refresh" : "apply")}>{stale ? "Refresh proposal" : "Apply to plan"}</button><button className={s.quietButton} onClick={() => act("dismiss")}>Dismiss</button></div>
    </>}
    {change.status === "applied" && <div className={s.actions}><span className={s.success}><Check size={14} />Updated in Plan</span><button className={s.textButton} onClick={() => act("undo")}><Undo2 size={14} />Undo</button></div>}
  </section>;
}

export function Conversation({ prototype }: { prototype: Prototype }) {
  const { state, dispatch, pending, send, stop, offline } = prototype;
  const thread = state.threads.find(row => row.id === state.threadId)!;
  const topic = state.topics.find(row => row.id === state.topicId)!;
  const facts = contextFor(state);
  const scroll = useRef<HTMLDivElement>(null);
  const pendingQuestion = pending[thread.id];
  useEffect(() => { scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: "auto" }); }, [thread.id, thread.messages.length, pendingQuestion]);
  const starters = facts.selected
    ? [`Help me think about ${facts.selected.title}.`, "Move this session to make room."]
    : topic.id === "week" ? ["How is my week going?", "Make today a little lighter.", "Talk through my check-in."]
    : ["How am I doing with this?", "Remember: mornings are my clearest time."];
  return <div className={s.conversation}>
    <div className={s.messages} ref={scroll} role="log" aria-label={thread.title} aria-live="polite">
      {thread.messages.length === 0 && <div className={s.welcome}>
        <CoachMark /><p className={s.eyebrow}>{topic.title}</p>
        <h2>{facts.selected ? "Let’s look at it together." : "A little perspective.\nA little room."}</h2>
        <p>{facts.selected ? `I’m looking at ${facts.selected.title} with you.` : `You’re in ${state.surface}. I have today’s work, this week’s plan, and what you’ve chosen to share in this room.`}</p>
        <div className={s.starters}>{starters.map(text => <button key={text} onClick={() => send(text)}>{text}<ArrowRight size={14} /></button>)}</div>
      </div>}
      {thread.messages.map(message => <article key={message.id} className={s.message} data-role={message.role}>
        {message.role === "coach" && <div className={s.messageByline}><CoachMark small /><span>Coach</span></div>}
        <p>{message.text}</p>
        {message.context && <small className={s.messageContext}>{message.context} · at send time</small>}
        {message.change && <ChangeReview change={message.change} prototype={prototype} />}
        {message.memory && <section className={s.memorySuggestion}>
          <p className={s.eyebrow}>A preference for this room</p><blockquote>“{message.memory}”</blockquote>
          {message.memorySaved ? <span className={s.success}><Check size={14} />Saved · manage in Understanding</span> : <button className={s.textButton} onClick={() => dispatch({ type: "memory", threadId: thread.id, messageId: message.id, id: crypto.randomUUID() })}>Remember this <ArrowRight size={14} /></button>}
        </section>}
      </article>)}
      {pending[thread.id] && <div className={s.thinking}><CoachMark small /><span>Looking at your current context<span className={s.dots}>…</span></span></div>}
    </div>
    <form className={s.composer} onSubmit={event => { event.preventDefault(); send(); }}>
      {offline && <p className={s.warning}>Offline · your draft stays here.</p>}
      <label className={s.srOnly} htmlFor="coach-prototype-message">Message your coach</label>
      <textarea id="coach-prototype-message" rows={2} placeholder={facts.selected ? `Ask about ${facts.selected.title.toLowerCase()}…` : "Ask, reflect, or make a little room…"} value={thread.draft}
        onChange={event => dispatch({ type: "draft", threadId: thread.id, value: event.target.value })}
        onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }} />
      <div className={s.composerFooter}><small>{pending[thread.id] ? "You can keep drafting while I think." : "Sample responses · changes need your review"}</small>
        {pending[thread.id] ? <button type="button" className={s.sendButton} aria-label="Stop response" onClick={() => stop()}><Square size={14} /></button> : <button className={s.sendButton} disabled={!thread.draft.trim()} aria-label="Send message"><ArrowDown size={19} style={{ transform: "rotate(180deg)" }} /></button>}
      </div>
    </form>
  </div>;
}
