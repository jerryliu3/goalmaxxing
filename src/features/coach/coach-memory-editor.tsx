"use client";
import { useState } from "react";
import type { CoachMemory } from "@cadence/shared/coach";
import { Button } from "@/components/ui/button";
import { postJson, requestJson } from "@/lib/api/client";
import { CoachMessageSources } from "./coach-message-sources";
import { useCoach } from "./coach-provider";

export function CoachMemoryEditor({ memory }: { memory: CoachMemory }) {
  const coach = useCoach()!;
  const [busy, setBusy] = useState(false);
  const mutate = async (method: "PATCH" | "DELETE", content?: string) => {
    setBusy(true);
    try {
      await requestJson({ path: `/api/coach/memories/${memory.id}`, method, body: { version: memory.version, ...(content !== undefined ? { content } : {}) } });
      await coach.loadBootstrap(); coach.refresh();
    } catch (error) { coach.setError(error instanceof Error ? error.message : "Could not update memory."); }
    finally { setBusy(false); }
  };
  return <div className="rounded-lg border p-3">
    <p>{memory.content}</p>
    <p className="mt-1 text-[11px] text-muted-foreground">{memory.topic_id ? "This topic" : "All topics"} · {memory.kind === "observation" ? "Tentative observation" : "Your preference"} · {new Date(memory.updated_at).toLocaleDateString()}{memory.source_message_id ? " · from a conversation" : " · edited or added by you"}</p>
    {memory.source_message_id && <CoachMessageSources key={memory.source_message_id} ids={[memory.source_message_id]} />}
    <details className="mt-2"><summary className="cursor-pointer text-xs">Edit</summary>
      <form onSubmit={event => { event.preventDefault(); void mutate("PATCH", String(new FormData(event.currentTarget).get("content"))); }}>
        <textarea aria-label="Memory content" name="content" defaultValue={memory.content} maxLength={1000} required className="mt-2 w-full rounded border bg-background p-2 text-sm" />
        <Button size="sm" variant="outline" disabled={busy}>Save</Button>
      </form>
    </details>
    <Button size="sm" variant="ghost" disabled={busy} onClick={() => void mutate("DELETE")}>Forget</Button>
  </div>;
}
export function CoachNewPreference({ topicId }: { topicId: string | null }) {
  const coach = useCoach()!;
  const [content, setContent] = useState("");
  const [global, setGlobal] = useState(false);
  const [busy, setBusy] = useState(false);
  return <form onSubmit={async event => {
    event.preventDefault(); if (!content.trim() || busy) return;
    setBusy(true);
    try { await postJson("/api/coach/memories", { topicId: global ? null : topicId, content, kind: "preference" }); setContent(""); await coach.loadBootstrap(); }
    catch (error) { coach.setError(error instanceof Error ? error.message : "Could not save memory."); }
    finally { setBusy(false); }
  }}>
    <textarea aria-label="New preference" value={content} maxLength={1000} rows={2} onChange={event => setContent(event.target.value)} placeholder="Something you’d like your coach to remember…" className="w-full rounded border bg-background p-2 text-sm" />
    <div className="mt-2 flex items-center justify-between">
      <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={global} onChange={event => setGlobal(event.target.checked)} />Use in all topics</label>
      <Button size="sm" variant="outline" disabled={busy || !content.trim()}>Remember</Button>
    </div>
  </form>;
}
