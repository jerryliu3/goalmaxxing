import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@cadence/shared/supabase/database.types";
import { normalizeWeekStartsOn } from "@/lib/dates/week-start";
import { reportError } from "@/lib/observability/report-error";
import { buildCompletionFeedback, linkedFeedbackOrder } from "./completion-feedback";
import type { Completion, Goal, GoalLink } from "./types";

type Client = SupabaseClient<Database>;

async function loadFacts(client: Client, userId: string, ids: string[]) {
  const facts: Completion[] = [];
  for (let offset = 0; offset < 100_000; offset += 1000) {
    const result = await client.from("completions").select("*").eq("user_id", userId)
      .in("goal_id", ids).order("id").range(offset, offset + 999);
    if (result.error) throw result.error;
    facts.push(...result.data as Completion[]);
    if (result.data.length < 1000) return facts;
  }
  throw new Error("Completion feedback history exceeds its read bound");
}

/** Optional decoration must never turn a committed completion into an error. */
export async function prepareCompletionFeedback(client: Client, userId: string, sourceId: string, asOfDate: string) {
  try {
    const [linkResult, profile] = await Promise.all([
      client.from("goal_links").select("*").eq("owner_id", userId).order("id").limit(1001),
      client.from("profiles").select("week_starts_on").eq("id", userId).maybeSingle(),
    ]);
    if (linkResult.error) throw linkResult.error;
    if (profile.error) throw profile.error;
    if (linkResult.data.length > 1000) return null;
    const links = linkResult.data as GoalLink[];
    const ids = [...linkedFeedbackOrder(sourceId, links).keys()];
    const [goalResult, before] = await Promise.all([
      client.from("goals").select("*").in("id", ids).eq("is_deleted", false),
      loadFacts(client, userId, ids),
    ]);
    if (goalResult.error) throw goalResult.error;
    // Linked parents are personal. Shared source goals may still be completed.
    const goals = (goalResult.data as Goal[]).filter(goal => goal.id === sourceId || goal.owner_id === userId);
    return async (date: string) => {
      try {
        const after = await loadFacts(client, userId, ids);
        return buildCompletionFeedback({ sourceId, date, asOfDate, goals, links, before, after,
          weekStartsOn: normalizeWeekStartsOn(profile.data?.week_starts_on) });
      } catch (error) {
        reportError(error, { code: "completion_feedback_failed" });
        return undefined;
      }
    };
  } catch (error) {
    reportError(error, { code: "completion_feedback_failed" });
    return null;
  }
}
