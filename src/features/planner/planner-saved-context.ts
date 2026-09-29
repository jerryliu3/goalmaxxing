import type {
  PlannerContextPayload,
  SavedPlannerItem,
} from "@cadence/shared/planner/context";
import {
  draftCommandEntryKey,
  projectPlannerDraftCommands,
  type PlannerDraftCommand,
} from "@/lib/planner/draft-commands";

/** Keep acknowledged direct edits as the baseline while the canonical reload runs. */
export function applySavedPlannerCommands(
  context: PlannerContextPayload,
  commands: PlannerDraftCommand[],
  scheduleDigest: string,
  savedItems: SavedPlannerItem[] | null,
  savedWindow: { start: string; end: string }
): PlannerContextPayload {
  const edits = projectPlannerDraftCommands(commands);
  const goalIds = new Map(context.activePlan?.goals.map((goal) => [goal.id, goal.original_goal_id]));
  const savedByKey = new Map(savedItems?.map((item) => [draftCommandEntryKey(item), item]));
  const projectedUnits = context.preview?.workUnits.map((unit) => {
    const edit = edits[draftCommandEntryKey({
      goalId: unit.originalGoalId, unitKey: unit.unitKey,
    })];
    return edit ? {
      ...unit,
      scheduledDate: edit.scheduledDate === undefined ? unit.scheduledDate : edit.scheduledDate,
      scheduledTimeOverride: edit.scheduledTimeOverride === undefined ? unit.scheduledTimeOverride : edit.scheduledTimeOverride,
    } : unit;
  }) ?? [];
  const projectedByDate = new Map(projectedUnits.map((unit) => [
    `${unit.originalGoalId}:${unit.scheduledDate}`, unit,
  ]));
  return {
    ...context,
    revisions: { ...context.revisions, scheduleDigest },
    activePlan: context.activePlan ? {
      ...context.activePlan,
      items: context.activePlan.items.flatMap((item) => {
        const saved = savedByKey.get(draftCommandEntryKey({ goalId: goalIds.get(item.plan_goal_id) ?? item.plan_goal_id, unitKey: item.unit_key }));
        if (!saved) {
          // Publishing replaces row IDs inside its window. Never reuse a stale
          // item ID for a completion or lock if the metadata read also failed.
          return item.scheduled_date && (item.scheduled_date < savedWindow.start || item.scheduled_date > savedWindow.end) ? [item] : [];
        }
        return [{
          ...item,
          id: saved.id,
          scheduled_date: saved.scheduledDate,
          original_scheduled_date: saved.originalScheduledDate,
          scheduled_time_override: saved.scheduledTimeOverride,
          locked: saved.locked,
        }];
      }),
    } : null,
    preview: context.preview ? {
      ...context.preview,
      workUnits: projectedUnits.map((unit) => {
        const key = draftCommandEntryKey({ goalId: unit.originalGoalId, unitKey: unit.unitKey });
        const saved = savedByKey.get(key);
        // Milestone keys are positional. Saving can renumber both the moved
        // milestone and its neighbours; the server's final placement wins over
        // the incoming command's ordinal, even when the subsequent GET fails.
        if (saved) {
          // Credit belongs to the dated session. Its displayed ordinal may
          // change, so carry the already-derived credit state with that date.
          const source = projectedByDate.get(`${saved.goalId}:${saved.scheduledDate}`);
          return {
            ...unit,
            ...(source ? {
              creditState: source.creditState,
              creditedCompletionDate: source.creditedCompletionDate,
              classification: source.classification,
            } : {}),
            scheduledDate: saved.scheduledDate,
            scheduledTimeOverride: saved.scheduledTimeOverride,
            locked: saved.locked,
          };
        }
        return unit;
      }),
    } : null,
  };
}
