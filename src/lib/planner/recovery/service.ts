import {
  PlannerRouteError,
  type AuthenticatedPlannerRouteContext,
} from "@/lib/planner/api";
import { postgresErrorMatches } from "@/lib/planner/postgres-errors";
import type { RecoveryDismissRequest } from "@/lib/planner/recovery/contract";
import { loadRecoveryContext } from "@/lib/planner/recovery/snapshot";

type RecoveryRouteContext = Pick<AuthenticatedPlannerRouteContext, "supabase" | "userId">;

/** Saves every let-go in one call; the response is the fresh snapshot the review re-renders from. */
export async function dismissRecoverySessions(
  context: RecoveryRouteContext,
  { dismissals }: RecoveryDismissRequest
) {
  const { error } = await context.supabase.rpc("dismiss_planner_recovery_sessions", {
    p_dismissals: dismissals.map(({ goalId, date }) => ({ goal_id: goalId, missed_on: date })),
  });
  if (error) {
    if (postgresErrorMatches(error, "P0001", "goal_not_found")) {
      throw new PlannerRouteError(404, "goal_not_found", "That goal is no longer available.");
    }
    throw new PlannerRouteError(500, "recovery_dismissal_failed", "Those changes could not be saved.", {
      cause: error.message,
    });
  }
  const { recovery } = await loadRecoveryContext({
    supabase: context.supabase,
    userId: context.userId,
  });
  return recovery;
}
