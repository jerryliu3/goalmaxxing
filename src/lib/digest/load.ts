import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { ApiRouteError } from "@/lib/api/route";
import { digestFactsSchema, digestSuggestionsSchema } from "@/lib/digest/contract";
import type { DigestFacts, DigestSuggestions } from "@/lib/digest/contract";
import { buildDigestFacts } from "@/lib/digest/facts";
import { resolveDigestPeriod, type DigestKind, type DigestPeriod } from "@/lib/digest/period";
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
  facts: DigestFacts;
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
  const period = resolveDigestPeriod({
    localDate,
    weekStartsOn: profile.weekStartsOn,
  });
  const [items, completions, record] = await Promise.all([
    loadPlacedItems(supabase, userId, period),
    loadCompletions(supabase, userId, period),
    loadDigestRecord(supabase, userId, period),
  ]);
  return {
    profile,
    localDate,
    period,
    facts: buildDigestFacts({ period, items, completions }),
    record,
  };
}

async function loadPlacedItems(
  supabase: DigestClient,
  userId: string,
  period: DigestPeriod
) {
  const { data: itemRows, error: itemsError } = await supabase
    .from("planner_items")
    .select("goal_id,scheduled_date")
    .eq("owner_id", userId)
    .gte("scheduled_date", period.recapStart)
    .lte("scheduled_date", period.aheadEnd)
    .order("scheduled_date")
    .limit(MAX_DIGEST_ROWS);
  if (itemsError) {
    throw new ApiRouteError(500, "digest_items_load_failed", "Digest data could not be loaded.");
  }
  const rows = itemRows ?? [];
  const goalIds = [...new Set(rows.map((row) => row.goal_id))];
  const titles = new Map<string, string>();
  if (goalIds.length > 0) {
    const { data: goals, error: goalsError } = await supabase
      .from("goals")
      .select("id,title")
      .eq("owner_id", userId)
      .in("id", goalIds)
      .limit(MAX_DIGEST_ROWS);
    if (goalsError) {
      throw new ApiRouteError(500, "digest_goals_load_failed", "Digest data could not be loaded.");
    }
    for (const goal of goals ?? []) {
      titles.set(goal.id, goal.title);
    }
  }
  return rows.flatMap((row) => {
    const title = titles.get(row.goal_id);
    if (!title) {
      return [];
    }
    return [
      {
        goalId: row.goal_id,
        title,
        scheduledDate: row.scheduled_date,
      },
    ];
  });
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
  const { data, error } = await supabase
    .from("user_digests")
    .select("facts,suggestions,acknowledged_at")
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
  const facts = digestFactsSchema.safeParse(data.facts);
  const suggestions = digestSuggestionsSchema.safeParse(data.suggestions);
  return {
    facts: facts.success
      ? facts.data
      : buildDigestFacts({ period, items: [], completions: [] }),
    suggestions: suggestions.success ? suggestions.data : null,
    acknowledgedAt: data.acknowledged_at,
  };
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
