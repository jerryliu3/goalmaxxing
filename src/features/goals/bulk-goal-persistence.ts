import {
  type BulkGoalDraft,
  type PreparedBulkGoalRow,
  prepareBulkGoalRows,
} from "@/features/goals/bulk-goal-drafts";

type RpcResult = Promise<{
  error: { message?: string | null } | null;
}>;

export interface BulkGoalPersistenceClient {
  rpc: (
    functionName: "create_goals" | "create_goal_links",
    args:
      | {
          p_goals: PreparedBulkGoalRow["row"][];
        }
      | {
          p_links: Array<{ source_goal_id: string; target_goal_id: string }>;
        }
  ) => RpcResult;
}

export interface PersistBulkGoalDraftsResult {
  createdCount: number;
  preparedRows: PreparedBulkGoalRow[];
  linkErrorMessage: string | null;
}

type BulkGoalPersistenceErrorCode =
  | "authentication_required"
  | "no_selected_goals"
  | "invalid_goals"
  | "create_failed";

export class BulkGoalPersistenceError extends Error {
  readonly code: BulkGoalPersistenceErrorCode;

  constructor(code: BulkGoalPersistenceErrorCode, message: string) {
    super(message);
    this.name = "BulkGoalPersistenceError";
    this.code = code;
  }
}

export async function persistBulkGoalDrafts({
  drafts,
  currentUserId,
  supabase,
  createId,
}: {
  drafts: BulkGoalDraft[];
  currentUserId: string | null;
  supabase: BulkGoalPersistenceClient;
  createId?: () => string;
}): Promise<PersistBulkGoalDraftsResult> {
  if (!currentUserId) {
    throw new BulkGoalPersistenceError(
      "authentication_required",
      "You must be logged in."
    );
  }
  if (drafts.length === 0) {
    throw new BulkGoalPersistenceError(
      "no_selected_goals",
      "Select at least one draft to create."
    );
  }
  if (drafts.some((draft) => draft.errors.length > 0)) {
    throw new BulkGoalPersistenceError(
      "invalid_goals",
      "Fix validation issues in selected drafts before creating."
    );
  }

  const preparedRows = prepareBulkGoalRows(drafts, createId ? { createId } : undefined);
  const { error } = await supabase.rpc("create_goals", {
    p_goals: preparedRows.map(({ row }) => row),
  });
  if (error) {
    throw new BulkGoalPersistenceError(
      "create_failed",
      error.message ?? "Failed to create goals."
    );
  }

  const linkRows = preparedRows
    .filter(
      ({ draft }) => draft.linked_target_goal_id && draft.linked_target_goal_id !== "none"
    )
    .map(({ draft, goalId }) => ({
      source_goal_id: goalId,
      target_goal_id: draft.linked_target_goal_id,
    }));
  if (linkRows.length === 0) {
    return {
      createdCount: preparedRows.length,
      preparedRows,
      linkErrorMessage: null,
    };
  }

  const { error: linkError } = await supabase.rpc("create_goal_links", {
    p_links: linkRows,
  });
  return {
    createdCount: preparedRows.length,
    preparedRows,
    linkErrorMessage: linkError
      ? `Some linked goals were not saved: ${linkError.message}`
      : null,
  };
}
