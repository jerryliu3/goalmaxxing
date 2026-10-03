import type { Completion, Goal } from "@/lib/goals/types";
import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { PlannerItemRow } from "@/lib/planner/context-loader";
import { selectPlannerCompletionMoveCandidate } from "@/lib/planner/completion-move-candidate";

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerClient>>;
type PlannerCompletionClient = Pick<ServerSupabaseClient, "from" | "rpc">;

export type AtomicPlannerCompletionResult =
  | {
      moved: true;
      unitKey: string;
      movedFrom: string;
      movedTo: string;
      scheduleDigest: string;
    }
  | { moved: false };

export interface AtomicPlannerUncompletionResult {
  unitKey: string | null;
  restoredFrom: string | null;
  restoredTo: string | null;
  scheduleDigest: string;
}

export async function uncompletePlannerCompletion({
  supabase,
  goalId,
  date,
  expectedDigest,
}: {
  supabase: PlannerCompletionClient;
  goalId: string;
  date: string;
  expectedDigest: string;
}): Promise<AtomicPlannerUncompletionResult> {
  const response = await supabase.rpc(
    "uncomplete_planner_item_on_date_service",
    {
      p_goal_id: goalId,
      p_date: date,
      p_expected_digest: expectedDigest,
    }
  );
  if (response.error) {
    throw response.error;
  }
  const row = Array.isArray(response.data) ? response.data[0] : response.data;
  if (!row) {
    throw new Error("planner_uncompletion_missing_result");
  }
  return {
    unitKey: row.unit_key,
    restoredFrom: row.restored_from,
    restoredTo: row.restored_to,
    scheduleDigest: row.schedule_digest,
  };
}

export async function preparePlannerMoveCompletion({
  supabase,
  userId,
  goal,
  date,
  asOfDate,
  expectedDigest,
  weekStartsOn,
}: {
  supabase: ServerSupabaseClient;
  userId: string;
  goal: Goal;
  date: string;
  asOfDate: string;
  expectedDigest: string;
  weekStartsOn?: number;
}) {
  const [itemsResponse, completionsResponse] = await Promise.all([
    supabase
      .from("planner_items")
      .select("*")
      .eq("owner_id", userId)
      .eq("goal_id", goal.id),
    supabase
      .from("completions")
      .select("id,goal_id,user_id,completed_on,planner_unit_key,source,created_at")
      .eq("user_id", userId)
      .eq("goal_id", goal.id),
  ]);

  if (itemsResponse.error || completionsResponse.error) {
    throw new Error("planner_completion_context_load_failed");
  }

  const candidate = selectPlannerCompletionMoveCandidate({
    goal,
    plannerItems: (itemsResponse.data ?? []) as PlannerItemRow[],
    completions: (completionsResponse.data ?? []) as Completion[],
    completionDate: date,
    asOfDate,
    weekStartsOn,
  });
  if (!candidate) {
    const lockedCandidate = selectPlannerCompletionMoveCandidate({
      goal,
      plannerItems: (itemsResponse.data ?? []) as PlannerItemRow[],
      completions: (completionsResponse.data ?? []) as Completion[],
      completionDate: date,
      asOfDate,
      weekStartsOn,
      allowLocked: true,
    });
    if (
      lockedCandidate &&
      (itemsResponse.data ?? []).some(
        (item) => item.id === lockedCandidate.itemId && item.locked
      )
    ) {
      throw Object.assign(new Error("planner_item_locked"), { code: "55000" });
    }
    return null;
  }

  return candidate;
}

export async function tryAtomicPlannerMoveCompletion(args: Parameters<typeof preparePlannerMoveCompletion>[0]): Promise<AtomicPlannerCompletionResult> {
  const { supabase, goal, date, expectedDigest } = args;
  const candidate = await preparePlannerMoveCompletion(args);
  if (!candidate) return { moved: false };
  const response = await supabase.rpc(
    "complete_planner_item_on_date_service",
    {
      p_goal_id: goal.id,
      p_unit_key: candidate.unitKey,
      p_date: date,
      p_expected_digest: expectedDigest,
    }
  );
  if (response.error) {
    throw response.error;
  }
  const row = Array.isArray(response.data) ? response.data[0] : response.data;
  if (!row) {
    throw new Error("planner_completion_move_missing_result");
  }
  return {
    moved: true,
    unitKey: candidate.unitKey,
    movedFrom: row.moved_from,
    movedTo: row.moved_to,
    scheduleDigest: row.schedule_digest,
  };
}
