"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { requestJson } from "@/lib/api/client";
import { CoachMemoryEditor, CoachNewPreference } from "./coach-memory-editor";
import { CoachRelatedGoals } from "./coach-related-goals";
import { CoachMessageSources } from "./coach-message-sources";
import { CoachEntityMenu } from "./coach-entity-menu";
import { useCoach } from "./coach-provider";
import s from "./coach.module.css";

export function CoachUnderstanding({ compact = false }: { compact?: boolean }) {
  const coach = useCoach()!;
  const topic = coach.activeTopic;
  const [busy, setBusy] = useState(false);
  const memories = coach.bootstrap?.memories.filter(memory => memory.topic_id === null || memory.topic_id === topic?.id) ?? [];
  if (!topic) return <p className={s.help}>Choose a room to see its understanding.</p>;
  return <div className={compact ? s.understandingContent : s.contentView}>
    <div className={s.contentHeading}><h2>{topic.title}</h2><CoachEntityMenu kind="topic" entity={topic} /></div>
    <form className={s.intentionForm} onSubmit={async event => {
      event.preventDefault(); if (busy) return;
      const intention = String(new FormData(event.currentTarget).get("intention"));
      setBusy(true);
      try { await requestJson({ path: `/api/coach/topics/${topic.id}`, method: "PATCH", body: { version: topic.version, intention } }); await coach.loadBootstrap(); }
      catch (error) { coach.setError(error instanceof Error ? error.message : "Could not save intention."); }
      finally { setBusy(false); }
    }}><label>Intention<textarea key={topic.intention} name="intention" defaultValue={topic.intention} rows={3} maxLength={1000} /></label><Button variant="outline" size="sm" disabled={busy}>Save intention</Button></form>
    {topic.summary && <section className={s.understandingSection}><p className={s.eyebrow}>Summary</p><p className={s.summaryText}>{topic.summary}</p><small>{topic.summary_sources.length} user source messages{topic.summary_updated_at ? ` · ${new Date(topic.summary_updated_at).toLocaleDateString()}` : ""}</small>{topic.summary_sources.length > 0 && <CoachMessageSources key={topic.summary_sources.join(",")} ids={topic.summary_sources} />}</section>}
    <section className={s.understandingSection}><p className={s.eyebrow}>Preferences</p>{memories.map(memory => <CoachMemoryEditor key={memory.id + memory.content} memory={memory} />)}<CoachNewPreference key={topic.id} topicId={topic.id} /></section>
    <section className={s.understandingSection}><CoachRelatedGoals key={topic.id} topicId={topic.id} /></section>
  </div>;
}
