"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { buildMilestoneNames } from "@/lib/goals/milestones";
import { invalidatePlannerRelatedTabCaches } from "@/lib/cache/planner-tab-cache";

/** Uses the same owner-checked write boundary as the milestone editor in Progress. */
export function MilestoneTitleEditor({ goalId, unitKey, label, disabled = false, className }: {
  goalId: string;
  unitKey: string;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedLabel, setSavedLabel] = useState<{ original: string; value: string } | null>(null);
  const ordinal = /^milestone:(\d+)$/.exec(unitKey);
  const index = ordinal ? Number(ordinal[1]) - 1 : -1;
  const editable = !disabled && index >= 0;
  const title = savedLabel?.original === label ? savedLabel.value : label;
  async function save() {
    if (saving || draft === null) return;
    const value = draft.trim();
    if (!value || value === title) { setDraft(null); return; }
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: goal, error: readError } = await supabase.from("goals").select("owner_id, frequency_type, target_count, milestone_names").eq("id", goalId).single();
      if (readError) throw readError;
      if (goal.frequency_type !== "fixed_milestones" || index >= (goal.target_count ?? 0)) throw new Error("This milestone is no longer available.");
      if (user?.id !== goal.owner_id) throw new Error("Only the goal owner can rename milestones.");
      const names = buildMilestoneNames(goal.target_count ?? 1, goal.milestone_names);
      names[index] = value;
      const { error } = await supabase.rpc("set_goal_milestone_names", {
        p_goal_id: goalId, p_milestone_names: names,
      });
      if (error) throw error;
      setSavedLabel({ original: label, value });
      setDraft(null);
      invalidatePlannerRelatedTabCaches();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not rename milestone. Please try again.");
    } finally { setSaving(false); }
  }
  if (!editable) return <span className={className}>{title}</span>;
  return <span className={className} onClick={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()}>
    {draft === null ? <button type="button" className="text-left hover:underline focus-visible:underline" aria-label={`Rename milestone ${title}`} onClick={() => setDraft(title)}>{title}</button> :
      <span className="inline-flex max-w-full items-center gap-1">
        <input autoFocus aria-label="Milestone name" maxLength={120} value={draft} disabled={saving} className="min-w-0 w-full rounded border bg-background px-1 py-1 text-foreground" onChange={event => setDraft(event.target.value)} onKeyDown={event => {
          if (event.key === "Enter") { event.preventDefault(); void save(); }
          if (event.key === "Escape" && !saving) setDraft(null);
        }} />
        <button type="button" disabled={saving || !draft.trim()} onClick={() => void save()}>Save</button>
        <button type="button" disabled={saving} onClick={() => setDraft(null)}>Cancel</button>
      </span>}
  </span>;
}
