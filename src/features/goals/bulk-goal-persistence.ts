import {
  type BulkGoalDraft,
  type PreparedBulkGoalRow,
  prepareBulkGoalRows,
} from "@/features/goals/bulk-goal-drafts";

type RpcResult = PromiseLike<{
  error: { message?: string | null } | null;
}>;

const LINK_FAILURE_FALLBACK = "Could not save goal links. Try again.";

function rpcErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }
  return fallback;
}

export interface BulkGoalLinkRow {
  [key: string]: string;
  source_goal_id: string;
  target_goal_id: string;
}

export interface BulkGoalPersistenceClient {
  rpc: (
    functionName: "create_goals" | "create_goal_links",
    args:
      | {
          p_goals: PreparedBulkGoalRow["row"][];
        }
      | {
          p_links: BulkGoalLinkRow[];
        }
  ) => RpcResult;
}

export interface BulkGoalLinkRecovery {
  preparedRows: PreparedBulkGoalRow[];
  linkRows: BulkGoalLinkRow[];
}

export type PersistBulkGoalDraftsResult =
  | {
      status: "created";
      createdCount: number;
      preparedRows: PreparedBulkGoalRow[];
      linkErrorMessage: null;
      linkRecovery: null;
    }
  | {
      status: "partial_success";
      createdCount: number;
      preparedRows: PreparedBulkGoalRow[];
      linkErrorMessage: string;
      linkRecovery: BulkGoalLinkRecovery;
    };

type BulkGoalPersistenceErrorCode =
  | "authentication_required"
  | "no_selected_goals"
  | "invalid_goals"
  | "create_ambiguous"
  | "links_failed";

export class BulkGoalPersistenceError extends Error {
  readonly code: BulkGoalPersistenceErrorCode;
  readonly preparedRows?: PreparedBulkGoalRow[];

  constructor(
    code: BulkGoalPersistenceErrorCode,
    message: string,
    preparedRows?: PreparedBulkGoalRow[]
  ) {
    super(message);
    this.name = "BulkGoalPersistenceError";
    this.code = code;
    this.preparedRows = preparedRows;
  }
}

export async function persistBulkGoalDrafts({
  drafts,
  currentUserId,
  supabase,
  createId,
  onGoalsPersisted,
}: {
  drafts: BulkGoalDraft[];
  currentUserId: string | null;
  supabase: BulkGoalPersistenceClient;
  createId?: () => string;
  onGoalsPersisted?: (preparedRows: PreparedBulkGoalRow[]) => void;
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
  let error: { message?: string | null } | null = null;
  try {
    ({ error } = await supabase.rpc("create_goals", {
      p_goals: preparedRows.map(({ row }) => row),
    }));
  } catch (cause) {
    throw new BulkGoalPersistenceError(
      "create_ambiguous",
      rpcErrorMessage(cause, "Could not confirm goal creation. Try again."),
      preparedRows
    );
  }
  if (error) {
    throw new BulkGoalPersistenceError(
      "create_ambiguous",
      rpcErrorMessage(error, "Could not confirm goal creation. Try again."),
      preparedRows
    );
  }
  onGoalsPersisted?.(preparedRows);

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
      status: "created",
      createdCount: preparedRows.length,
      preparedRows,
      linkErrorMessage: null,
      linkRecovery: null,
    };
  }

  let linkError: { message?: string | null } | null = null;
  try {
    ({ error: linkError } = await supabase.rpc("create_goal_links", {
      p_links: linkRows,
    }));
  } catch (cause) {
    const message = rpcErrorMessage(cause, LINK_FAILURE_FALLBACK);
    return {
      status: "partial_success",
      createdCount: preparedRows.length,
      preparedRows,
      linkErrorMessage: `Some linked goals were not saved: ${message}`,
      linkRecovery: {
        preparedRows,
        linkRows,
      },
    };
  }
  if (linkError) {
    const message = rpcErrorMessage(linkError, LINK_FAILURE_FALLBACK);
    return {
      status: "partial_success",
      createdCount: preparedRows.length,
      preparedRows,
      linkErrorMessage: `Some linked goals were not saved: ${message}`,
      linkRecovery: {
        preparedRows,
        linkRows,
      },
    };
  }

  return {
    status: "created",
    createdCount: preparedRows.length,
    preparedRows,
    linkErrorMessage: null,
    linkRecovery: null,
  };
}

export async function retryBulkGoalLinks({
  linkRows,
  supabase,
}: {
  linkRows: BulkGoalLinkRow[];
  supabase: BulkGoalPersistenceClient;
}): Promise<{ status: "created" }> {
  let error: { message?: string | null } | null = null;
  try {
    ({ error } = await supabase.rpc("create_goal_links", {
      p_links: linkRows,
    }));
  } catch (cause) {
    throw new BulkGoalPersistenceError(
      "links_failed",
      `Some linked goals were not saved: ${rpcErrorMessage(
        cause,
        LINK_FAILURE_FALLBACK
      )}`
    );
  }
  if (error) {
    throw new BulkGoalPersistenceError(
      "links_failed",
      `Some linked goals were not saved: ${rpcErrorMessage(
        error,
        LINK_FAILURE_FALLBACK
      )}`
    );
  }
  return { status: "created" };
}
