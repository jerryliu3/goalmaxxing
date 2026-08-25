"use client";

import {
  type PreparedBulkGoalRow,
  type BulkGoalDraft,
  type LlmGoalDraftPayload,
  buildBulkGoalDraftsFromLlmGoals,
} from "@/features/goals/bulk-goal-drafts";
import {
  type BulkGoalLinkRow,
  BulkGoalPersistenceError,
  persistBulkGoalDrafts,
  retryBulkGoalLinks,
} from "@/features/goals/bulk-goal-persistence";
import { ApiClientError, postJson } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";

export const MAX_COACH_GOAL_DRAFTS = 5;
const COACH_GOAL_DRAFT_PARSE_TIMEOUT_MS = 45_000;

export class CoachGoalDraftServiceError extends Error {
  readonly code: string;
  readonly preparedRows?: PreparedBulkGoalRow[];

  constructor(
    code: string,
    message: string,
    preparedRows?: PreparedBulkGoalRow[]
  ) {
    super(message);
    this.name = "CoachGoalDraftServiceError";
    this.code = code;
    this.preparedRows = preparedRows;
  }
}

export type CoachGoalDraftCreationResult =
  | {
      status: "created";
      createdCount: number;
      linkErrorMessage: null;
    }
  | {
      status: "partial_success";
      createdCount: number;
      linkErrorMessage: string;
      linkRows: BulkGoalLinkRow[];
    };

export async function parseCoachGoalDrafts({
  parserPrompt,
  timezone,
}: {
  parserPrompt: string;
  timezone: string;
}) {
  try {
    const payload = await postJson<{
      goals?: LlmGoalDraftPayload[];
      warnings?: string[];
    }>("/api/bulk-goals/parse", {
      prompt: parserPrompt,
      timezone,
    }, {
      timeoutMs: COACH_GOAL_DRAFT_PARSE_TIMEOUT_MS,
    });
    const goals = payload.goals ?? [];
    if (goals.length === 0) {
      throw new CoachGoalDraftServiceError(
        "no_goals",
        "The coach did not generate any goal drafts. Try again."
      );
    }
    if (goals.length > MAX_COACH_GOAL_DRAFTS) {
      throw new CoachGoalDraftServiceError(
        "too_many_goals",
        `The coach generated ${goals.length} goals. Ask it to simplify the plan to ${MAX_COACH_GOAL_DRAFTS} or fewer goals.`
      );
    }
    return {
      drafts: buildBulkGoalDraftsFromLlmGoals(goals),
      warnings: payload.warnings ?? [],
    };
  } catch (error) {
    if (error instanceof CoachGoalDraftServiceError) {
      throw error;
    }
    if (error instanceof ApiClientError) {
      throw new CoachGoalDraftServiceError(
        error.code ?? "parse_failed",
        error.message
      );
    }
    throw error;
  }
}

export async function createCoachGoalDrafts({
  drafts,
  onGoalsPersisted,
}: {
  drafts: BulkGoalDraft[];
  onGoalsPersisted?: (preparedRows: PreparedBulkGoalRow[]) => void;
}) {
  const selectedDrafts = drafts.filter((draft) => draft.include);
  if (selectedDrafts.length === 0) {
    throw new CoachGoalDraftServiceError(
      "no_selected_goals",
      "Select at least one goal draft to create."
    );
  }
  if (selectedDrafts.length > MAX_COACH_GOAL_DRAFTS) {
    throw new CoachGoalDraftServiceError(
      "too_many_goals",
      `Create no more than ${MAX_COACH_GOAL_DRAFTS} goals at once.`
    );
  }
  if (selectedDrafts.some((draft) => draft.errors.length > 0)) {
    throw new CoachGoalDraftServiceError(
      "invalid_goals",
      "Fix validation issues before creating these goals."
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const result = await persistBulkGoalDrafts({
      drafts: selectedDrafts,
      currentUserId: user?.id ?? null,
      supabase,
      onGoalsPersisted,
    });
    if (result.status === "partial_success") {
      return {
        status: "partial_success",
        createdCount: result.createdCount,
        linkErrorMessage: result.linkErrorMessage,
        linkRows: result.linkRecovery.linkRows,
      } satisfies CoachGoalDraftCreationResult;
    }
    return {
      status: "created",
      createdCount: result.createdCount,
      linkErrorMessage: null,
    } satisfies CoachGoalDraftCreationResult;
  } catch (error) {
    if (error instanceof BulkGoalPersistenceError) {
      throw new CoachGoalDraftServiceError(
        error.code,
        error.message,
        error.preparedRows
      );
    }
    throw error;
  }
}

export async function retryCoachGoalDraftLinks({
  linkRows,
  onLinksPersisted,
}: {
  linkRows: BulkGoalLinkRow[];
  onLinksPersisted?: () => void;
}): Promise<{ status: "created" }> {
  try {
    const result = await retryBulkGoalLinks({
      linkRows,
      supabase: createClient(),
    });
    onLinksPersisted?.();
    return result;
  } catch (error) {
    if (error instanceof BulkGoalPersistenceError) {
      throw new CoachGoalDraftServiceError(error.code, error.message);
    }
    throw error;
  }
}
