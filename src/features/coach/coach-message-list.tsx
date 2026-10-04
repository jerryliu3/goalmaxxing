"use client";
import { useLayoutEffect, useRef } from "react";
import { coachContextSummary } from "@cadence/shared/coach/context-summary";
import { Button } from "@/components/ui/button";
import { CoachMemorySuggestion } from "./coach-memory-suggestion";
import { CoachActionCard } from "./coach-action-card";
import { CoachMark } from "./coach-mark";
import { useCoach } from "./coach-provider";
import s from "./coach.module.css";

export function CoachMessageList() {
  const coach = useCoach()!;
  const scroll = useRef<HTMLDivElement>(null);
  const conversation = coach.conversation;
  const first = conversation?.messages[0]?.id;
  const last = conversation?.messages.at(-1)?.id;
  const threadId = conversation?.thread.id;
  const visible = coach.mode !== "closed" && coach.view === "conversation";
  const positions = coach.scrollPositions;
  useLayoutEffect(() => {
    const element = scroll.current;
    if (!visible || !element || !threadId) return;
    const previous = positions.current.get(threadId);
    element.scrollTop = !previous || previous.atBottom ? element.scrollHeight
      : previous.first !== first && previous.last === last ? previous.top + element.scrollHeight - previous.height : previous.top;
    positions.current.set(threadId, { top: element.scrollTop, height: element.scrollHeight, first, last, atBottom: element.scrollHeight - element.clientHeight - element.scrollTop < 40 });
  }, [visible, threadId, first, last, positions, coach.mode]);
  const selected = coach.facts && coach.freshness === "fresh" ? coachContextSummary(coach.facts).selected : undefined;
  const starters = selected ? [`Help me think about ${selected.title}.`, "Help me make room around this work."] : ["How is my week going?", "Make today a little lighter.", "What should I focus on next?"];
  return <div className={s.messages} ref={scroll} onScroll={event => {
    if (!threadId) return;
    const element = event.currentTarget;
    positions.current.set(threadId, { top: element.scrollTop, height: element.scrollHeight, first, last, atBottom: element.scrollHeight - element.clientHeight - element.scrollTop < 40 });
  }}>
    {!conversation ? <p className={s.help}>Loading your conversation…</p> : <>
      {conversation.before !== null && <Button variant="ghost" size="sm" onClick={() => void coach.loadConversation(conversation.thread.id, conversation.before!).catch(error => coach.setError(error.message))}>Earlier messages</Button>}
      {!conversation.messages.length && <div className={s.welcome}><CoachMark /><div className={s.starters}>{starters.map(text => <button key={text} disabled={Boolean(coach.draft.trim())} onClick={() => { coach.setDraft(text); document.getElementById("coach-message")?.focus(); }}>{text}<span>↗</span></button>)}</div></div>}
      <div role="log" aria-label="Coach conversation" aria-live={visible ? "polite" : "off"} aria-relevant="additions text">{conversation.messages.map(message => <article key={message.id} className={s.message} data-role={message.role}>
        {message.role === "assistant" && <div className={s.messageByline}><CoachMark small /><span>Coach</span></div>}
        <p>{message.content}</p>
        {message.role === "assistant" && typeof message.source.asOf === "string" && <small className={s.messageSource}>Data at {new Date(message.source.asOf).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}{coach.facts && message.source.revision !== coach.facts.revision ? " · Context has changed since this reply" : ""}</small>}
        {message.role === "assistant" && typeof message.source.memorySuggestion === "string" && typeof message.source.memorySourceId === "string" && <CoachMemorySuggestion content={message.source.memorySuggestion} sourceId={message.source.memorySourceId} />}
        {message.role === "assistant" && conversation.actions.filter(action => action.run_id === message.run_id).map(action => <CoachActionCard key={action.id} action={action} />)}
      </article>)}</div>
    </>}
  </div>;
}
