"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api/client";
import { useCoach } from "./coach-provider";
export function CoachMemorySuggestion({ content, sourceId }: { content: string; sourceId: string }) {
  const coach = useCoach()!;
  const [busy, setBusy] = useState(false);
  const [global, setGlobal] = useState(false);
  const saved = coach.bootstrap?.memories.some(memory => memory.source_message_id === sourceId && memory.content === content);
  return <div className="mt-3 rounded-lg border p-3"><p className="text-xs text-muted-foreground">Remember for next time?</p><p className="mt-1 text-sm">{content}</p>{saved ? <p className="mt-2 text-xs">Saved. You can edit or forget it in Understanding.</p> : <div className="mt-2 flex items-center justify-between"><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={global} onChange={event => setGlobal(event.target.checked)} />All topics</label><Button variant="outline" size="sm" disabled={busy} onClick={async () => { setBusy(true); try { await postJson("/api/coach/memories", { topicId: global ? null : coach.conversation?.thread.topic_id ?? null, content, kind:"preference", sourceMessageId:sourceId }); await coach.loadBootstrap(); } catch (error) { coach.setError(error instanceof Error ? error.message : "Could not remember preference."); } finally { setBusy(false); } }}>Remember</Button></div>}</div>;
}
