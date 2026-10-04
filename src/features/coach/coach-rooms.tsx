"use client";
import { useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoachEntityMenu } from "./coach-entity-menu";
import { useCoach } from "./coach-provider";
import s from "./coach.module.css";

export function CoachRoomNavigation() {
  const coach = useCoach()!;
  const room = coach.activeTopic;
  return <aside className={s.roomNavigation} aria-label="Coach rooms and conversations">
    <p className={s.eyebrow}>Rooms</p><div className={s.roomLinks}>{coach.bootstrap?.topics.filter(topic => !topic.archived_at || topic.id === room?.id).map(topic => {
      const thread = coach.bootstrap?.threads.find(row => row.topic_id === topic.id && !row.archived_at) ?? coach.bootstrap?.threads.find(row => row.topic_id === topic.id);
      return <button key={topic.id} data-active={topic.id === room?.id} onClick={() => thread ? coach.selectThread(thread.id) : coach.showView("rooms")}>{topic.title}{topic.archived_at ? " · archived" : ""}</button>;
    })}</div><Button size="sm" variant="ghost" onClick={() => coach.showView("rooms")}><Plus size={14} />Browse & create</Button>
    <div className={s.threadList}><p className={s.eyebrow}>Conversations</p>{coach.bootstrap?.threads.filter(thread => thread.topic_id === room?.id && !thread.archived_at).map(thread => <button key={thread.id} data-active={thread.id === coach.threadId} onClick={() => coach.selectThread(thread.id)}>{thread.title}{coach.conversations[thread.id]?.runs.some(run => run.status === "running") && <i className={s.statusDot} aria-label="Response in progress" />}</button>)}</div>
  </aside>;
}

export function CoachRooms() {
  const coach = useCoach()!;
  const [archived, setArchived] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  return <div className={s.contentView}>
    {!coach.bootstrap ? <p className={s.help}>Loading your rooms…</p> : <div className={s.roomGrid}>{coach.bootstrap.topics.filter(topic => Boolean(topic.archived_at) === archived).map(topic => {
      const threads = coach.bootstrap!.threads.filter(thread => thread.topic_id === topic.id);
      const preferred = threads.find(thread => thread.id === coach.threadId) ?? threads.find(thread => !thread.archived_at) ?? threads[0];
      return <section className={s.roomCard} key={topic.id}>
        <div className={s.roomCardHeading}><span className={s.roomArt} aria-hidden="true"><i /><i /><i /></span><CoachEntityMenu kind="topic" entity={topic} /></div>
        <h3>{topic.title}</h3>{topic.intention && <p>{topic.intention}</p>}
        {preferred && <Button variant="ghost" size="sm" onClick={() => coach.selectThread(preferred.id)}>Open room <ArrowRight size={14} /></Button>}
        <details className={s.roomThreads}><summary>Conversations {threads.length}</summary>{threads.map(thread => <div key={thread.id}><button onClick={() => coach.selectThread(thread.id)}>{thread.title}{thread.archived_at ? " · archived" : ""}</button><CoachEntityMenu kind="thread" entity={thread} /></div>)}
          {!topic.archived_at && <Button size="sm" variant="ghost" onClick={() => void coach.create("thread", "New conversation", topic.id).then(thread => coach.selectThread(thread.id)).catch(error => coach.setError(error.message))}><Plus size={14} />New conversation</Button>}
        </details>
      </section>;
    })}</div>}
    <form className={s.createRoom} onSubmit={async event => { event.preventDefault(); if (!name.trim() || busy) return; setBusy(true); try { const thread = await coach.create("topic", name.trim()); coach.selectThread(thread.id); setName(""); } catch (error) { coach.setError(error instanceof Error ? error.message : "Could not create room."); } finally { setBusy(false); } }}>
      <label htmlFor="new-coach-room">New room</label><div><input id="new-coach-room" value={name} maxLength={120} onChange={event => setName(event.target.value)} placeholder="Writing, energy, a new project…" /><Button size="sm" variant="outline" disabled={busy || !name.trim()}><Plus size={14} />Create</Button></div>
    </form>
    <label className={s.archiveToggle}><input type="checkbox" checked={archived} onChange={event => setArchived(event.target.checked)} />Show archived rooms</label>
  </div>;
}
