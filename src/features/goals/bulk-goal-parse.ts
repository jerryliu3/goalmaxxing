import { postJson } from "@/lib/api/client";
import type { LlmGoalDraftPayload } from "@/lib/goals/bulk-drafts";

export const BULK_GOAL_PARSE_TIMEOUT_MS = 45_000;

export interface ParsedLlmGoalDraftPayload {
  goals: LlmGoalDraftPayload[];
  warnings: string[];
}

export async function parseLlmGoalDraftsFromPrompt({
  prompt,
  timezone,
  timeoutMs = BULK_GOAL_PARSE_TIMEOUT_MS,
}: {
  prompt: string;
  timezone: string;
  timeoutMs?: number;
}): Promise<ParsedLlmGoalDraftPayload> {
  const payload = await postJson<{
    goals?: LlmGoalDraftPayload[];
    warnings?: string[];
  }>("/api/bulk-goals/parse", { prompt, timezone }, { timeoutMs });

  return {
    goals: payload.goals ?? [],
    warnings: payload.warnings ?? [],
  };
}
