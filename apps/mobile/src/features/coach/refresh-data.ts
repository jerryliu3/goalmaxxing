import type { QueryClient } from "@tanstack/react-query";
import { duoQueryKeys } from "../duo/query-keys";

/** Refresh the canonical views affected by coach actions and recap completions. */
export async function refreshCoachData(client: QueryClient, userId: string) {
  const keys = [
    duoQueryKeys.goalsPrefix(userId), duoQueryKeys.plannerPrefix(userId),
    duoQueryKeys.progressPrefix(userId), duoQueryKeys.insightsPrefix(userId),
    duoQueryKeys.calendarOverlayPrefix(userId),
    ["mobile-planner-tasks", userId], ["mobile-coach-context", userId],
    ["mobile-profile", userId], ["journey", "xp-profile"],
  ];
  await Promise.all(keys.map(queryKey => client.invalidateQueries({ queryKey })));
}
