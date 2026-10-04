"use client";
import { useEffect, useState } from "react";
import { getJson, requestJson } from "@/lib/api/client";
import s from "./coach.module.css";
import { useCoach } from "./coach-provider";

export function CoachRelatedGoals({ topicId }: { topicId: string }) {
  const coach = useCoach()!;
  const [goalIds, setGoalIds] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void getJson<{ goalIds: string[] }>(`/api/coach/topics/${topicId}/goals`)
      .then(result => { if (!cancelled) setGoalIds(result.goalIds); })
      .catch(error => { if (!cancelled) coach.setError(error.message); });
    return () => { cancelled = true; };
  }, [topicId]);
  const update = async (goalId: string, checked: boolean) => {
    setBusy(true);
    try {
      await requestJson({ path: `/api/coach/topics/${topicId}/goals`, method: checked ? "POST" : "DELETE", body: { goalId } });
      setGoalIds(ids => checked ? [...(ids ?? []), goalId] : (ids ?? []).filter(id => id !== goalId));
      await coach.loadBootstrap();
    } catch (error) { coach.setError(error instanceof Error ? error.message : "Could not link goal."); }
    finally { setBusy(false); }
  };
  return <div>
    <h3>Related goals</h3><div className={s.linkedGoals}>{goalIds === null ? <p className={s.help}>Loading linked goals…</p> : goalIds.length === 0 ? <p className={s.help}>No goals linked to this room.</p> : coach.facts?.goals.filter(goal => goalIds.includes(goal.id)).map(goal => <p key={goal.id}>{goal.title}</p>)}</div><details className={s.editDisclosure}><summary>Edit linked goals</summary>
    <div className={s.goalOptions}>{coach.facts?.goals.map(goal => <label key={goal.id} className="flex items-center gap-1 text-xs">
      <input type="checkbox" disabled={busy || goalIds === null} checked={goalIds?.includes(goal.id) ?? false} onChange={event => void update(goal.id, event.target.checked)} />{goal.title}
    </label>)}</div></details>
  </div>;
}
