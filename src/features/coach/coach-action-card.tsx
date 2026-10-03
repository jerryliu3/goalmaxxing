"use client";
import { useRef, useState } from "react";
import { coachActionPreviewLines, type CoachAction } from "@cadence/shared/coach";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api/client";
import { invalidatePlannerRelatedTabCaches } from "@/lib/cache/planner-tab-cache";
import { invalidateSocialFeedCache } from "@/features/social/data";
import { requestXpRefresh } from "@/lib/xp/events";
import { useCoach } from "./coach-provider";

function Preview({ action }: { action: CoachAction }) {
  return <div className="space-y-1 text-sm text-muted-foreground">
    {coachActionPreviewLines(action.preview, action.kind).map((line, index) => <p key={index}>{line}</p>)}
  </div>;
}
export function CoachActionCard({ action }: { action: CoachAction }) {
  const coach = useCoach()!;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(crypto.randomUUID());
  const operate = async (operation: "apply" | "reject" | "refresh" | "undo") => {
    setBusy(true); setError(null);
    try {
      await postJson(`/api/coach/actions/${action.id}/${operation}`, operation === "apply" ? { requestId: requestId.current, page: coach.page } : operation === "reject" ? {} : { page: coach.page });
      if (operation === "apply") {
        invalidatePlannerRelatedTabCaches();
        if (action.kind === "completion") { invalidateSocialFeedCache(); requestXpRefresh(); }
      }
    } catch (error) { setError(error instanceof Error ? error.message : "This change could not be applied."); }
    finally {
      await coach.loadConversation(action.thread_id).catch(() => undefined);
      if (coach.view === "changes") await coach.history.reload();
      setBusy(false);
    }
  };
  const unresolvedDraft = coach.page.hasDraft && action.status === "proposed";
  return <section className="mt-3 rounded-xl border border-border bg-muted/20 p-4" aria-label="Coach proposal">
    <p className="mb-2 font-medium">{action.title}</p><Preview action={action} />
    {unresolvedDraft && <p className="mt-2 text-xs">Save or discard your planner draft before applying.</p>}
    {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
    {action.status === "proposed" ? <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" disabled={busy || unresolvedDraft} onClick={() => void operate("apply")}>Apply{action.preview.undo === true ? " undo" : ""}</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => void operate("reject")}>Dismiss</Button>{!action.inverse_of && <Button size="sm" variant="ghost" disabled={busy} onClick={() => void operate("refresh")}>Refresh proposal</Button>}</div> : <div className="mt-3 flex items-center justify-between"><span className="text-xs">{action.status === "applied" ? "Applied" : action.status === "undone" ? "Undone" : action.status === "superseded" ? "Replaced by a refreshed proposal" : "Dismissed"}</span>{action.status === "applied" && action.preview.undoable === true && <Button size="sm" variant="ghost" disabled={busy} onClick={() => void operate("undo")}>Review undo</Button>}</div>}
  </section>;
}
