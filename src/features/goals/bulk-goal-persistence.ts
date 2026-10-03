import {
  type BulkGoalDraft,
  type PreparedBulkGoalRow,
  prepareBulkGoalRows,
} from "@/lib/goals/bulk-drafts";
import { getRpcErrorMessage } from "@/lib/supabase/rpc-error";

type RpcResult = PromiseLike<{
  error: { message?: string | null } | null;
}>;

const LINK_FAILURE_FALLBACK = "Could not save goal links. Try again.";

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
  | "create_failed"
  | "create_ambiguous"
  | "links_failed"
  | "links_ambiguous";

export class BulkGoalPersistenceError extends Error {
  readonly code: BulkGoalPersistenceErrorCode;
  readonly preparedRows?: PreparedBulkGoalRow[];
  readonly linkRecovery?: BulkGoalLinkRecovery;

  constructor(
    code: BulkGoalPersistenceErrorCode,
    message: string,
    options?: {
      preparedRows?: PreparedBulkGoalRow[];
      linkRecovery?: BulkGoalLinkRecovery;
    }
  ) {
    super(message);
    this.name = "BulkGoalPersistenceError";
    this.code = code;
    this.preparedRows = options?.preparedRows;
    this.linkRecovery = options?.linkRecovery;
  }
}

interface BulkGoalPersistenceCallbacks {
  onGoalsPersisted?: (preparedRows: PreparedBulkGoalRow[]) => void;
  onLinksPersisted?: (preparedRows: PreparedBulkGoalRow[]) => void;
}

async function persistPreparedBulkGoalRows({
  preparedRows,
  supabase,
  onGoalsPersisted,
  onLinksPersisted,
}: {
  preparedRows: PreparedBulkGoalRow[];
  supabase: BulkGoalPersistenceClient;
} & BulkGoalPersistenceCallbacks): Promise<PersistBulkGoalDraftsResult> {
  let error: { message?: string | null } | null = null;
  try {
    ({ error } = await supabase.rpc("create_goals", {
      p_goals: preparedRows.map(({ row }) => row),
    }));
  } catch (cause) {
    throw new BulkGoalPersistenceError(
      "create_ambiguous",
      getRpcErrorMessage(cause, "Could not confirm goal creation. Try again."),
      { preparedRows }
    );
  }
  if (error) {
    throw new BulkGoalPersistenceError(
      "create_failed",
      getRpcErrorMessage(error, "Could not save goals. Try again.")
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
    const message = getRpcErrorMessage(cause, LINK_FAILURE_FALLBACK);
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
    throw new BulkGoalPersistenceError(
      "links_failed",
      `Some linked goals were not saved: ${getRpcErrorMessage(
        linkError,
        LINK_FAILURE_FALLBACK
      )}`,
      {
        linkRecovery: {
          preparedRows,
          linkRows,
        },
      }
    );
  }

  onLinksPersisted?.(preparedRows);
  return {
    status: "created",
    createdCount: preparedRows.length,
    preparedRows,
    linkErrorMessage: null,
    linkRecovery: null,
  };
}

export async function persistBulkGoalDrafts({
  drafts,
  currentUserId,
  supabase,
  createId,
  onGoalsPersisted,
  onLinksPersisted,
}: {
  drafts: BulkGoalDraft[];
  currentUserId: string | null;
  supabase: BulkGoalPersistenceClient;
  createId?: () => string;
} & BulkGoalPersistenceCallbacks): Promise<PersistBulkGoalDraftsResult> {
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
  return persistPreparedBulkGoalRows({
    preparedRows,
    supabase,
    onGoalsPersisted,
    onLinksPersisted,
  });
}

export async function retryBulkGoalCreation({
  preparedRows,
  supabase,
  onGoalsPersisted,
  onLinksPersisted,
}: {
  preparedRows: PreparedBulkGoalRow[];
  supabase: BulkGoalPersistenceClient;
} & BulkGoalPersistenceCallbacks): Promise<PersistBulkGoalDraftsResult> {
  return persistPreparedBulkGoalRows({
    preparedRows,
    supabase,
    onGoalsPersisted,
    onLinksPersisted,
  });
}

export async function retryBulkGoalLinks({
  linkRows,
  supabase,
  onLinksPersisted,
}: {
  linkRows: BulkGoalLinkRow[];
  supabase: BulkGoalPersistenceClient;
  onLinksPersisted?: () => void;
}): Promise<{ status: "created" }> {
  let error: { message?: string | null } | null = null;
  try {
    ({ error } = await supabase.rpc("create_goal_links", {
      p_links: linkRows,
    }));
  } catch (cause) {
    throw new BulkGoalPersistenceError(
      "links_ambiguous",
      `Some linked goals were not saved: ${getRpcErrorMessage(
        cause,
        LINK_FAILURE_FALLBACK
      )}`
    );
  }
  if (error) {
    throw new BulkGoalPersistenceError(
      "links_failed",
      `Some linked goals were not saved: ${getRpcErrorMessage(
        error,
        LINK_FAILURE_FALLBACK
      )}`
    );
  }
  onLinksPersisted?.();
  return { status: "created" };
}
