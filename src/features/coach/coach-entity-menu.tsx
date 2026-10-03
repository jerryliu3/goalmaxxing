"use client";
import { useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { CoachThread, CoachTopic } from "@cadence/shared/coach";
import { Button } from "@/components/ui/button";
import { requestJson } from "@/lib/api/client";
import { useCoach } from "./coach-provider";
import s from "./coach.module.css";

export function CoachEntityMenu({ kind, entity }: { kind: "topic" | "thread"; entity: CoachTopic | CoachThread }) {
  const coach = useCoach()!;
  const [busy, setBusy] = useState(false);
  const menu = useRef<HTMLDetailsElement>(null);
  const home = kind === "topic" && "is_default" in entity && entity.is_default;
  const mutate = async (patch: { title?: string; archived?: boolean } | null) => {
    if (busy) return;
    setBusy(true);
    try {
      await requestJson({ path: `/api/coach/${kind === "topic" ? "topics" : "threads"}/${entity.id}`, method: patch ? "PATCH" : "DELETE", body: { version: entity.version, ...patch } });
      await coach.reload();
      if (menu.current) menu.current.open = false;
    } catch (error) { coach.setError(error instanceof Error ? error.message : "Could not update this room."); }
    finally { setBusy(false); }
  };
  return <details ref={menu} className={s.entityMenu}>
    <summary aria-label={`Manage ${entity.title}`}><MoreHorizontal size={16} /></summary>
    <div className={s.entityControls}><form onSubmit={event => { event.preventDefault(); void mutate({ title: String(new FormData(event.currentTarget).get("title")).trim() }); }}>
      <label>Name<input key={entity.title} name="title" defaultValue={entity.title} maxLength={120} required /></label><Button size="sm" variant="outline" disabled={busy}>Save name</Button>
    </form>
      {!home && <><Button size="sm" variant="ghost" disabled={busy} onClick={() => void mutate({ archived: !entity.archived_at })}>{entity.archived_at ? "Restore" : "Archive"}</Button>
        <details><summary className={s.deletePrompt}>Delete permanently</summary><p className={s.help}>{kind === "topic" ? "Removes this room, its conversations and room preferences." : "Removes this conversation. Confirmed preferences are kept."}</p><Button size="sm" variant="destructive" disabled={busy} onClick={() => void mutate(null)}>Confirm deletion</Button></details>
      </>}
    </div>
  </details>;
}
