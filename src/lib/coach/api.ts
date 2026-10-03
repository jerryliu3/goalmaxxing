import { z } from "zod";
import { ApiRouteError, apiSuccessResponse, requireAuthenticatedRequestContext, withRoute } from "@/lib/api/route";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { createAdminClient } from "@/lib/supabase/admin";
export type CoachRequestContext = Awaited<ReturnType<typeof requireCoachContext>>;
export async function requireCoachContext(request: Request) {
  if (!isFeatureEnabled("coachEnabled")) throw new ApiRouteError(503, "coach_disabled", "The central coach is not enabled.");
  const auth = await requireAuthenticatedRequestContext(request);
  return { ...auth, admin: createAdminClient() };
}
export function withCoachRoute(request: Request, handler: (context: CoachRequestContext) => Promise<Record<string, unknown>>) {
  return withRoute(async ({ correlationId }) => apiSuccessResponse(await handler(await requireCoachContext(request)), correlationId));
}
export async function coachParam(context: { params: Promise<{ id: string }> | { id: string } }) {
  const result = z.uuid().safeParse((await context.params).id);
  if (!result.success) throw new ApiRouteError(400, "validation_failed", "Invalid coach identifier.");
  return result.data;
}
export function coachDatabaseError(error: { message: string; code?: string } | null) {
  if (!error) return;
  const messages: Record<string, [number, string]> = {
    default_topic: [409, "The default topic cannot be archived or deleted."],
    topic_not_found: [404, "Topic not found."],
    thread_not_found: [404, "Conversation not found."], run_not_found: [404, "Response not found."],
    topic_archived: [409, "Restore this topic before continuing."],
    context_refresh_required: [409, "Your data changed while the coach was answering. Retry with the latest facts."],
    conversation_conflict: [409, "This conversation changed. Refresh and try again."],
    thread_busy: [409, "The coach is still answering in this conversation."],
    idempotency_conflict: [409, "This request identifier was already used for different content."],
    retry_unavailable: [409, "This response cannot be retried."], run_expired: [409, "The response expired. Retry your message."],
    stale_schedule: [409, "Your plan changed. Refresh this proposal before applying."],
    task_stale: [409, "This task changed. Refresh before applying."],
    timezone_confirmation_required: [422, "Confirm your planner timezone in Settings."],
    invalid_preferences: [422, "Choose valid planner dates and weekdays."],
    capability_unavailable: [422, "This change is unavailable."],
    planner_destination_conflict: [409, "That goal already has a session on the destination date."],
    planner_item_locked: [409, "Unlock this session before moving it."],
    planner_task_not_found: [404, "This task is unavailable."],
    action_stale: [409, "Your plan changed. Refresh this proposal before applying."],
    action_not_found: [404, "Action not found."], action_not_ready: [409, "This action is no longer available."],
  };
  const match = messages[error.message];
  if (match) throw new ApiRouteError(match[0], error.message, match[1]);
  throw new ApiRouteError(500, "coach_storage_failed", "Coach data could not be saved or loaded.", undefined, error);
}
