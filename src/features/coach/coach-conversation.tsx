"use client";
import { ArrowUp, ChevronDown, Plus, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoachMessageList } from "./coach-message-list";
import { CoachEntityMenu } from "./coach-entity-menu";
import { useCoach } from "./coach-provider";
import s from "./coach.module.css";

export function CoachConversation() {
  const coach = useCoach()!;
  const running = coach.conversation?.runs.find(run => run.status === "running");
  const latestRun = coach.conversation?.runs[0];
  const stage = coach.threadId ? coach.stages[coach.threadId] : "";
  const busy = Boolean(running || stage);
  const archived = Boolean(coach.activeThread?.archived_at || coach.activeTopic?.archived_at);
  const send = (retry = false) => coach.send(coach.page, retry ? latestRun : undefined);
  return <div className={s.conversation}>
    <div className={s.conversationHeading}><button className={s.roomSelector} onClick={() => coach.showView("rooms")}><span>{coach.activeTopic?.title ?? "My week"}{coach.activeThread?.title && coach.activeThread.title !== coach.activeTopic?.title && <small>{coach.activeThread.title}</small>}</span><ChevronDown size={14} /></button><div className={s.buttons}>
      <Button size="icon-sm" variant="ghost" aria-label="New conversation in this room" disabled={!coach.activeTopic || archived} onClick={() => void coach.create("thread", "New conversation", coach.activeTopic!.id).then(thread => coach.selectThread(thread.id)).catch(error => coach.setError(error.message))}><Plus size={16} /></Button>
      {coach.activeThread && <CoachEntityMenu kind="thread" entity={coach.activeThread} />}
    </div></div>
    <CoachMessageList />
    <div className={s.composerArea}>
      {busy && <div className={s.responseStatus} role="status"><span>{stage || "Thinking…"}</span>{running && <Button variant="ghost" size="sm" onClick={() => void coach.cancel(running).catch(error => coach.setError(error.message))}><Square size={12} />Stop</Button>}</div>}
      {archived && <p className={s.help}>Restore this room or conversation to continue.</p>}
      {!archived && !busy && latestRun && ["failed", "cancelled"].includes(latestRun.status) && <Button variant="ghost" size="sm" onClick={() => void send(true)}>Retry saved message</Button>}
      <form className={s.composer} onSubmit={event => { event.preventDefault(); if (!busy) void send(); }}>
        <label className="sr-only" htmlFor="coach-message">Message your coach</label>
        <textarea id="coach-message" disabled={!coach.conversation || archived} value={coach.draft} maxLength={12000} rows={2} onChange={event => coach.setDraft(event.target.value)} placeholder="Ask your coach…" onKeyDown={event => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (!busy) void send(); }
        }} />
        <div className={s.composerFooter}><Button type="submit" size="icon-sm" aria-label="Send message" disabled={archived || busy || !coach.conversation || !coach.draft.trim()}><ArrowUp size={17} /></Button></div>
      </form>
    </div>
  </div>;
}
