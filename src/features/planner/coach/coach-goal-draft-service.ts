"use client";

import {
  type PreparedBulkGoalRow,
  type BulkGoalDraft,
  buildBulkGoalDraftsFromLlmGoals,
} from "@/lib/goals/bulk-drafts";
import { parseLlmGoalDraftsFromPrompt } from "@/features/goals/bulk-goal-parse";
import {
  type BulkGoalLinkRecovery,
  type BulkGoalLinkRow,
  BulkGoalPersistenceError,
  persistBulkGoalDrafts,
  retryBulkGoalCreation,
  retryBulkGoalLinks,
} from "@/features/goals/bulk-goal-persistence";
import { ApiClientError } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";

export const MAX_COACH_GOAL_DRAFTS = 5;

export class CoachGoalDraftServiceError extends Error {
  readonly code: string;
  readonly preparedRows?: PreparedBulkGoalRow[];
  readonly linkRecovery?: BulkGoalLinkRecovery;

  constructor(
    code: string,
    message: string,
    preparedRows?: PreparedBulkGoalRow[],
    linkRecovery?: BulkGoalLinkRecovery
  ) {
    super(message);
    this.name = "CoachGoalDraftServiceError";
    this.code = code;
    this.preparedRows = preparedRows;
    this.linkRecovery = linkRecovery;
  }
}

export type CoachGoalDraftCreationResult =
  {
    status: "created";
    createdCount: number;
    linkErrorMessage: null;
  };

export async function parseCoachGoalDrafts({
  parserPrompt,
  timezone,
}: {
  parserPrompt: string;
  timezone: string;
}) {
  try {
    const { goals, warnings } = await parseLlmGoalDraftsFromPrompt({
      prompt: parserPrompt,
      timezone,
    });
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
      warnings,
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
  preparedRows,
  onGoalsPersisted,
  onLinksPersisted,
}: {
  drafts: BulkGoalDraft[];
  preparedRows?: PreparedBulkGoalRow[];
  onGoalsPersisted?: (preparedRows: PreparedBulkGoalRow[]) => void;
  onLinksPersisted?: (preparedRows: PreparedBulkGoalRow[]) => void;
}) {
  const selectedDrafts = drafts.filter((draft) => draft.include);
  if (selectedDrafts.length > MAX_COACH_GOAL_DRAFTS) {
    throw new CoachGoalDraftServiceError(
      "too_many_goals",
      `Create no more than ${MAX_COACH_GOAL_DRAFTS} goals at once.`
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const result = preparedRows
      ? await retryBulkGoalCreation({
          preparedRows,
          supabase,
          onGoalsPersisted,
          onLinksPersisted,
        })
      : await persistBulkGoalDrafts({
          drafts: selectedDrafts,
          currentUserId: user?.id ?? null,
          supabase,
          onGoalsPersisted,
          onLinksPersisted,
        });
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
        error.preparedRows,
        error.linkRecovery
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
