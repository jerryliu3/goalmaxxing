import { z } from "zod";
import { coachActionSchema, coachPageSchema } from "@cadence/shared/coach";
import { ApiRouteError, parseJsonBody } from "@/lib/api/route";
import { scheduleXpOutboxDrain } from "@/lib/xp/outbox";
import type { Json } from "@/lib/supabase/database.types";
import { coachDatabaseError, type CoachRequestContext } from "./api";
import { loadCoachContext } from "./context";
import { prepareCoachAction, preparedCoachAction } from "./actions";
import { coachProposalSchema } from "./capabilities";
import { mapCompletionRpcError } from "@/lib/planner/exact-date-dispatch";

export const coachApplySchema = z.object({ requestId: z.uuid(), page: coachPageSchema }).strict();
export async function loadCoachAction(context: CoachRequestContext, id: string) {
  const result = await context.admin.from("coach_actions").select("*").eq("id", id).eq("owner_id", context.userId).maybeSingle();
  coachDatabaseError(result.error);
  if (!result.data) throw new ApiRouteError(404, "action_not_found", "This proposal is unavailable.");
  return result.data;
}
export async function applyCoachAction(context: CoachRequestContext, id: string, request: Request) {
  const body = await parseJsonBody({ request, schema: coachApplySchema });
  const action = await loadCoachAction(context, id);
  if (body.page.hasDraft && action.status === "proposed") throw new ApiRouteError(409, "draft_resolution_required", "Save or discard your planner draft before applying coach changes.");
  const result = await context.supabase.rpc("apply_coach_action", { p_action: id, p_request: body.requestId });
  if (result.error) {
    const mapped = mapCompletionRpcError(result.error);
    if (mapped) throw new ApiRouteError(mapped.status, mapped.code, mapped.message);
    coachDatabaseError(result.error);
  }
  if (action.kind === "completion") scheduleXpOutboxDrain(context.supabase);
  return { receipt: result.data };
}
export async function replaceCoachAction(context: CoachRequestContext, id: string, request: Request, undo: boolean) {
  const { page } = await parseJsonBody({ request, schema: z.object({ page: coachPageSchema }).strict() });
  const action = await loadCoachAction(context, id);
  const facts = await loadCoachContext(context, page);
  let prepared;
  if (undo) {
    if (!action.inverse || action.status !== "applied") throw new ApiRouteError(409, "undo_unavailable", "This change has no safe undo. Use the normal editing controls.");
    const inverse = z.record(z.string(), z.unknown()).parse(action.inverse);
    const receipt = z.object({ scheduleDigest: z.string(), domain: z.record(z.string(), z.unknown()).nullable() }).parse(action.result);
    const command = { ...inverse, asOfDate: facts.today.date, timezone: facts.timezone,
      ...(action.kind.startsWith("task_") ? { expectedUpdatedAt: receipt.domain?.updated_at } : { expectedDigest: receipt.scheduleDigest }),
    };
    const preview = z.record(z.string(), z.unknown()).parse(action.preview);
    prepared = preparedCoachAction(action.kind, `Undo: ${action.title}`.slice(0, 160), command, {
      ...preview, before: preview.after ?? null, after: preview.before ?? null,
      ...(Array.isArray(preview.moves) ? { moves: preview.moves.map(move => {
        const row = z.object({ goal: z.string().optional(), from: z.string(), to: z.string() }).parse(move);
        return { ...row, from: row.to, to: row.from };
      }) } : {}), undo: true, undoable: false,
    }, null);
  } else {
    if (action.inverse_of) throw new ApiRouteError(409, "undo_unavailable", "A stale undo cannot replace newer edits. Ask for a fresh change instead.");
    const command = z.object({ proposal: coachProposalSchema }).parse(action.command);
    prepared = await prepareCoachAction(context, command.proposal, facts);
  }
  const result = await context.admin.rpc("replace_coach_action", { p_owner: context.userId, p_original: id, p_new: prepared as unknown as Json, p_undo: undo });
  coachDatabaseError(result.error);
  if (!result.data) throw new ApiRouteError(500, "coach_storage_failed", "The replacement proposal could not be loaded.");
  return { action: coachActionSchema.parse(await loadCoachAction(context, result.data)) };
}
