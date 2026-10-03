import { randomUUID } from "node:crypto";
import { ApiRouteError } from "@/lib/api/route";
import { loadPlannerCanonicalSnapshot, loadAllPlannerItems } from "@/lib/planner/context-loader";
import { z } from "zod";
import { mapCompletionRpcError } from "@/lib/planner/exact-date-dispatch";
import { preparePlannerSchedule, plannerSaveRequestSchema } from "@/lib/planner/save-service";
import { preparePlannerMoveCompletion } from "@/lib/planner/atomic-completion";
import { buildBulkGoalDraftsFromLlmGoals, prepareBulkGoalRows, validateBulkGoalDraft } from "@/lib/goals/bulk-drafts";
import type { CoachContext } from "@cadence/shared/coach";
import { coachActionPreviewSchema } from "@cadence/shared/coach";
import type { Json } from "@/lib/supabase/database.types";
import { coachDatabaseError, type CoachRequestContext } from "./api";
import { coachProposalSchema, type CoachProposal } from "./capabilities";

export function preparedCoachAction(kind: string, title: string, command: Record<string, unknown>, preview: Record<string, unknown>, inverse: Record<string, unknown> | null = null) {
  return { kind, title, command, preview: coachActionPreviewSchema.parse(preview), inverse };
}
export async function prepareCoachAction(context: CoachRequestContext, proposal: CoachProposal, facts: CoachContext) {
  if (!facts.timezoneConfirmed) throw new ApiRouteError(422, "timezone_confirmation_required", "Confirm your planner timezone in Settings before making changes.");
  const base = { timezone: facts.timezone, asOfDate: facts.today.date, proposal };
  if (proposal.kind === "task_move" || proposal.kind === "task_completion") {
    const result = await context.supabase.from("planner_tasks").select("*").eq("id", proposal.taskId).eq("owner_id", context.userId).eq("is_deleted", false).maybeSingle();
    coachDatabaseError(result.error);
    if (!result.data) throw new ApiRouteError(404, "task_not_found", "This task is unavailable.");
    const task = result.data;
    if (proposal.kind === "task_completion" && proposal.completed && task.scheduled_date > facts.today.date) throw new ApiRouteError(422, "future_completion_not_allowed", "Future tasks cannot be completed.");
    const command = { ...base, taskId: task.id, expectedUpdatedAt: task.updated_at, ...(proposal.kind === "task_move" ? { date: proposal.date } : { completed: proposal.completed }) };
    return preparedCoachAction(proposal.kind, proposal.title, command, { task: task.title, before: { date: task.scheduled_date, completed: task.completed_at !== null }, after: proposal.kind === "task_move" ? { date: proposal.date } : { completed: proposal.completed }, undoable: true }, { ...base, taskId: task.id, ...(proposal.kind === "task_move" ? { date: task.scheduled_date } : { completed: task.completed_at !== null }) });
  }
  const snapshot = await loadPlannerCanonicalSnapshot({ supabase: context.supabase, ownerId: context.userId, startDate: facts.week.start, endDate: facts.week.end });
  if (!snapshot.revisions.scheduleDigest || !snapshot.preferences) throw new ApiRouteError(503, "planner_digest_unavailable", "Your planner state could not be loaded.");
  if (proposal.kind === "move_sessions") {
    const rows = await loadAllPlannerItems(context.supabase, context.userId);
    const moves = proposal.moves.map((move, sequence) => {
      const item = rows.find(item => item.id === move.itemId);
      if (!item) throw new ApiRouteError(404, "item_not_found", "A session is no longer available.");
      return { id: randomUUID(), sequence, kind: "move_item" as const, goalId: item.goal_id, unitKey: item.unit_key, sourceDate: item.scheduled_date, scheduledDate: move.date };
    });
    const dates = moves.flatMap(move => [move.sourceDate, move.scheduledDate]).sort();
    const startDate = dates[0], endDate = dates.at(-1)!;
    // The same canonical direct-draft path used by ordinary planner saves validates moves.
    const items = await preparePlannerSchedule(context, plannerSaveRequestSchema.parse({ expectedDigest: snapshot.revisions.scheduleDigest, startDate, endDate, previewHash: "0".repeat(64), confirmationHash: null, draftCommands: moves }));
    return preparedCoachAction(proposal.kind, proposal.title, { ...base, expectedDigest: snapshot.revisions.scheduleDigest, startDate, endDate, items }, { moves: moves.map(move => ({ goal: snapshot.goals.find(goal => goal.id === move.goalId)?.title, from: move.sourceDate, to: move.scheduledDate })), undoable: true }, { ...base, startDate, endDate, items: rows.filter(item => item.scheduled_date >= startDate && item.scheduled_date <= endDate).map(item => ({ goal_id: item.goal_id, unit_key: item.unit_key, scheduled_date: item.scheduled_date, scheduled_time: item.scheduled_time, locked: item.locked, original_scheduled_date: item.original_scheduled_date })) });
  }
  if (proposal.kind === "completion") {
    const goal = snapshot.goals.find(goal => goal.id === proposal.goalId);
    if (!goal) throw new ApiRouteError(404, "goal_not_found", "The goal is unavailable.");
    if (proposal.completed && (proposal.date > facts.today.date || proposal.date < goal.start_date || (goal.end_date && proposal.date > goal.end_date))) throw new ApiRouteError(422, "completion_date_invalid", "Choose today or a past date within the goal's lifetime.");
    const candidate = proposal.completed ? await preparePlannerMoveCompletion({ supabase: context.supabase, userId: context.userId, goal, date: proposal.date, asOfDate: facts.today.date, expectedDigest: snapshot.revisions.scheduleDigest, weekStartsOn: facts.week.weekStartsOn }) : null;
    return preparedCoachAction(proposal.kind, proposal.title, { ...base, expectedDigest: snapshot.revisions.scheduleDigest, goalId: goal.id, date: proposal.date, completed: proposal.completed, unitKey: candidate?.unitKey ?? null }, { goal: goal.title, date: proposal.date, completed: proposal.completed, movedFrom: candidate?.sourceDate ?? null, linkedGoals: "Linked goals follow the app's canonical completion rules.", undoable: false });
  }
  if (proposal.kind === "create_goal") {
    const [draft] = buildBulkGoalDraftsFromLlmGoals([proposal.goal]);
    const errors = validateBulkGoalDraft(draft);
    if (errors.length) throw new ApiRouteError(422, "goal_draft_invalid", errors.join(" "));
    const [{ row }] = prepareBulkGoalRows([draft], { createId: randomUUID });
    if (proposal.linkedTargetGoalId && !snapshot.goals.some(goal => goal.id === proposal.linkedTargetGoalId)) throw new ApiRouteError(404, "goal_not_found", "The linked goal is unavailable.");
    return preparedCoachAction(proposal.kind, proposal.title, { ...base, goals: [row], links: proposal.linkedTargetGoalId ? [{ source_goal_id: row.id, target_goal_id: proposal.linkedTargetGoalId }] : [] }, { goal: row, linkedTarget: snapshot.goals.find(goal => goal.id === proposal.linkedTargetGoalId)?.title ?? null, undoable: false });
  }
  const restWeekdays = [...new Set(proposal.restWeekdays)].sort();
  return preparedCoachAction(proposal.kind, proposal.title, { ...base, expectedDigest: snapshot.revisions.scheduleDigest, restWeekdays }, { before: { restWeekdays: snapshot.preferences.default_policy.restWeekdays }, after: { restWeekdays }, note: "Future planning uses these defaults. Existing sessions stay where they are.", undoable: true }, { ...base, restWeekdays: snapshot.preferences.default_policy.restWeekdays });
}
export async function prepareCoachProposals(context: CoachRequestContext, proposals: unknown[], facts: CoachContext) {
  const actions = []; const rejected: string[] = [];
  for (const raw of proposals) {
    try {
      const proposal = coachProposalSchema.parse(raw);
      actions.push(await prepareCoachAction(context, proposal, facts));
    } catch (error) {
      const mapped = error && typeof error === "object" && "message" in error
        ? mapCompletionRpcError(error as { code?: string; message: string }) : null;
      if ((error instanceof ApiRouteError && error.status < 500) || error instanceof z.ZodError || mapped) {
        rejected.push(mapped?.message ?? (error instanceof Error ? error.message : "This proposal is unavailable."));
      } else throw error;

    }
  }
  return { actions: actions as unknown as Json, rejected };
}
