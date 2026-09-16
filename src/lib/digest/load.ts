import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { ApiRouteError } from "@/lib/api/route";
import { digestSuggestionsSchema } from "@/lib/digest/contract";
import type { DigestFacts, DigestSuggestions } from "@/lib/digest/contract";
import { buildDigestFacts } from "@/lib/digest/facts";
import {
  extendDailyRecapToLastCheckIn,
  resolveDigestPeriod,
  type DigestKind,
  type DigestPeriod,
} from "@/lib/digest/period";
import { getDateInTimezone } from "@/lib/dates/timezone";
import { normalizeWeekStartsOn } from "@/lib/dates/week-start";

const MAX_DIGEST_ROWS = 500;

export type DigestClient = Pick<SupabaseClient<Database>, "from">;

export interface DigestProfile {
  timezone: string;
  weekStartsOn: number;
  digestAutoShow: boolean;
}

export interface DigestRecord {
  suggestions: DigestSuggestions | null;
  acknowledgedAt: string | null;
}

export interface DigestSnapshot {
  profile: DigestProfile;
  localDate: string;
  period: DigestPeriod;
  facts: DigestFacts;
  record: DigestRecord | null;
}

export async function loadDigestProfile(
  supabase: DigestClient,
  userId: string
): Promise<DigestProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("timezone,week_starts_on,digest_auto_show")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw new ApiRouteError(500, "digest_profile_load_failed", "Digest data could not be loaded.");
  }
  if (!data) {
    throw new ApiRouteError(404, "profile_not_found", "Profile is required for digest.");
  }
  return {
    timezone: data.timezone?.trim() || "UTC",
    weekStartsOn: normalizeWeekStartsOn(data.week_starts_on),
    digestAutoShow: data.digest_auto_show !== false,
  };
}

export async function loadDigestSnapshot({
  supabase,
  userId,
  now = new Date(),
}: {
  supabase: DigestClient;
  userId: string;
  now?: Date;
}): Promise<DigestSnapshot> {
  const profile = await loadDigestProfile(supabase, userId);
  const localDate = getDateInTimezone(now, profile.timezone);
  const currentPeriod = resolveDigestPeriod({
    localDate,
    weekStartsOn: profile.weekStartsOn,
  });
  const [record, lastAcknowledgedAt] = await Promise.all([
    loadDigestRecord(supabase, userId, currentPeriod),
    loadLastAcknowledgedDigestAt(supabase, userId, localDate),
  ]);
  const lastCheckInDate = lastAcknowledgedAt
    ? getDateInTimezone(new Date(lastAcknowledgedAt), profile.timezone)
    : null;
  const period = extendDailyRecapToLastCheckIn(currentPeriod, lastCheckInDate);
  const [goals, itemRows, completions] = await Promise.all([
    loadGoals(supabase, userId),
    loadPlacedItemRows(supabase, userId, period),
    loadCompletions(supabase, userId, period),
  ]);
  const titleByGoalId = new Map(goals.map((goal) => [goal.id, goal.title]));
  const items = itemRows.flatMap((row) => {
    const title = titleByGoalId.get(row.goal_id);
    return title
      ? [{ goalId: row.goal_id, title, scheduledDate: row.scheduled_date }]
      : [];
  });
  return {
    profile,
    localDate,
    period,
    facts: buildDigestFacts({
      period,
      items,
      completions,
      goals: goalsLiveInWindow(goals, period),
    }),
    record,
  };
}

/**
 * One read of the user's goals covers both jobs the facts have: titles for the
 * sessions that were placed, and the live set to check for goals with nothing
 * planned. Archived goals stay in, because a session placed against one still
 * belongs in the recap; they are filtered out of the live set below.
 */
async function loadGoals(supabase: DigestClient, userId: string) {
  const { data, error } = await supabase
    .from("goals")
    .select("id,title,start_date,end_date,archived_at")
    .eq("owner_id", userId)
    .eq("is_deleted", false)
    .order("start_date")
    .limit(MAX_DIGEST_ROWS);
  if (error) {
    throw new ApiRouteError(500, "digest_goals_load_failed", "Digest data could not be loaded.");
  }
  return data ?? [];
}

/** Goals live enough to want work in the window ahead. */
function goalsLiveInWindow(
  goals: Awaited<ReturnType<typeof loadGoals>>,
  period: DigestPeriod
) {
  return goals
    .filter(
      (goal) =>
        goal.archived_at === null &&
        goal.start_date <= period.aheadEnd &&
        (goal.end_date === null || goal.end_date >= period.aheadStart)
    )
    .map((goal) => ({ goalId: goal.id, title: goal.title }));
}

async function loadPlacedItemRows(
  supabase: DigestClient,
  userId: string,
  period: DigestPeriod
) {
  const { data, error } = await supabase
    .from("planner_items")
    .select("goal_id,scheduled_date")
    .eq("owner_id", userId)
    .gte("scheduled_date", period.recapStart)
    .lte("scheduled_date", period.aheadEnd)
    .order("scheduled_date")
    .limit(MAX_DIGEST_ROWS);
  if (error) {
    throw new ApiRouteError(500, "digest_items_load_failed", "Digest data could not be loaded.");
  }
  return data ?? [];
}

async function loadCompletions(
  supabase: DigestClient,
  userId: string,
  period: DigestPeriod
) {
  const { data, error } = await supabase
    .from("completions")
    .select("goal_id,completed_on")
    .eq("user_id", userId)
    .gte("completed_on", period.recapStart)
    .lte("completed_on", period.aheadEnd)
    .limit(MAX_DIGEST_ROWS);
  if (error) {
    throw new ApiRouteError(500, "digest_completions_load_failed", "Digest data could not be loaded.");
  }
  return (data ?? []).map((row) => ({
    goalId: row.goal_id,
    completedOn: row.completed_on,
  }));
}

async function loadDigestRecord(
  supabase: DigestClient,
  userId: string,
  period: DigestPeriod
): Promise<DigestRecord | null> {
  // The stored `facts` column is the audit trail of what the model was shown.
  // Reads always recompute facts from the plan, so it is deliberately not
  // selected here: a row written against an older facts shape must not be able
  // to fail a parse and take the check-in down with it.
  const { data, error } = await supabase
    .from("user_digests")
    .select("suggestions,acknowledged_at")
    .eq("owner_id", userId)
    .eq("kind", period.kind)
    .eq("period_key", period.periodKey)
    .maybeSingle();
  if (error) {
    throw new ApiRouteError(500, "digest_record_load_failed", "Digest data could not be loaded.");
  }
  if (!data) {
    return null;
  }
  const suggestions = digestSuggestionsSchema.safeParse(data.suggestions);
  return {
    suggestions: suggestions.success ? suggestions.data : null,
    acknowledgedAt: data.acknowledged_at,
  };
}

async function loadLastAcknowledgedDigestAt(
  supabase: DigestClient,
  userId: string,
  beforeLocalDate: string
): Promise<string | null> {
  // Exclude today's row: the lightweight prompt acknowledges it before the
  // optional AI request reloads the snapshot, but both reads must use the same
  // prior check-in as the recap boundary.
  const { data, error } = await supabase
    .from("user_digests")
    .select("acknowledged_at")
    .eq("owner_id", userId)
    .lt("period_key", beforeLocalDate)
    .not("acknowledged_at", "is", null)
    .order("acknowledged_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new ApiRouteError(
      500,
      "digest_history_load_failed",
      "Digest data could not be loaded."
    );
  }
  return data?.acknowledged_at ?? null;
}

export async function upsertDigestRow({
  supabase,
  userId,
  kind,
  periodKey,
  facts,
  suggestions,
  acknowledgedAt,
}: {
  supabase: DigestClient;
  userId: string;
  kind: DigestKind;
  periodKey: string;
  facts: DigestFacts;
  suggestions?: DigestSuggestions | null;
  acknowledgedAt?: string | null;
}) {
  const { error } = await supabase.from("user_digests").upsert(
    {
      owner_id: userId,
      kind,
      period_key: periodKey,
      facts,
      ...(suggestions !== undefined ? { suggestions } : {}),
      ...(acknowledgedAt !== undefined ? { acknowledged_at: acknowledgedAt } : {}),
    },
    { onConflict: "owner_id,kind,period_key" }
  );
  if (error) {
    throw new ApiRouteError(500, "digest_upsert_failed", "Digest could not be saved.");
  }
}

export async function updateDigestAutoShow({
  supabase,
  userId,
  digestAutoShow,
}: {
  supabase: DigestClient;
  userId: string;
  digestAutoShow: boolean;
}) {
  const { error } = await supabase
    .from("profiles")
    .update({ digest_auto_show: digestAutoShow })
    .eq("id", userId);
  if (error) {
    throw new ApiRouteError(
      500,
      "digest_settings_update_failed",
      "Digest settings could not be saved."
    );
  }
}
