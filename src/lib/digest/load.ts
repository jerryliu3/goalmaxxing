import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { ApiRouteError } from "@/lib/api/route";
import { digestFactsSchema, digestSuggestionsSchema } from "@/lib/digest/contract";
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
  id: string; factsDigest: string | null; generatedAt: string | null; historicalFacts: DigestFacts | null;
  suggestions: DigestSuggestions | null;
  acknowledgedAt: string | null;
}

export interface DigestSnapshot {
  revision: number;
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
    throw new ApiRouteError(
      500,
      "digest_profile_load_failed",
      "Digest data could not be loaded.",
      undefined,
      error
    );
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

export async function loadDigestSnapshot(args: { supabase: DigestClient; userId: string; now?: Date }): Promise<DigestSnapshot> {
  const revision = async () => {
    const result = await args.supabase.from("coach_context_versions").select("revision").eq("owner_id",args.userId).maybeSingle();
    if (result.error) throw new ApiRouteError(503,"digest_context_unavailable","Check-in facts could not be refreshed.",undefined,result.error);
    return result.data?.revision ?? 0;
  };
  for(let attempt=0;attempt<2;attempt++) {
    const before=await revision(); const snapshot=await assembleDigestSnapshot(args);
    if (before===await revision()) return { ...snapshot, revision: before };
  }
  throw new ApiRouteError(409,"context_refresh_required","Your data changed while reading the check-in. Please refresh.");
}

async function assembleDigestSnapshot({
  supabase,
  userId,
  now = new Date(),
}: {
  supabase: DigestClient;
  userId: string;
  now?: Date;
}): Promise<Omit<DigestSnapshot, "revision">> {
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
async function digestRows<T>(read: (offset: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let offset=0;;offset+=MAX_DIGEST_ROWS) {
    const result = await read(offset);
    if (result.error) throw new ApiRouteError(500,"digest_data_load_failed","Check-in data could not be loaded.",undefined,result.error);
    rows.push(...result.data ?? []);
    if ((result.data?.length ?? 0)<MAX_DIGEST_ROWS) return rows;
  }
}
async function loadGoals(supabase: DigestClient, userId: string) {
  return digestRows(offset=>supabase.from("goals").select("id,title,start_date,end_date,archived_at").eq("owner_id",userId).eq("is_deleted",false).order("id").range(offset,offset+MAX_DIGEST_ROWS-1));
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

async function loadPlacedItemRows(supabase: DigestClient,userId: string,period: DigestPeriod) {
  return digestRows(offset=>supabase.from("planner_items").select("goal_id,scheduled_date").eq("owner_id",userId).gte("scheduled_date",period.recapStart).lte("scheduled_date",period.aheadEnd).order("id").range(offset,offset+MAX_DIGEST_ROWS-1));
}
async function loadCompletions(supabase: DigestClient,userId: string,period: DigestPeriod) {
  const rows=await digestRows(offset=>supabase.from("completions").select("goal_id,completed_on").eq("user_id",userId).gte("completed_on",period.recapStart).lte("completed_on",period.aheadEnd).order("id").range(offset,offset+MAX_DIGEST_ROWS-1));
  return rows.map(row=>({goalId:row.goal_id,completedOn:row.completed_on}));
}

async function loadDigestRecord(
  supabase: DigestClient,
  userId: string,
  period: DigestPeriod
): Promise<DigestRecord | null> {
  // Historical facts are optional; live rows never depend on parsing an old snapshot.
  const { data, error } = await supabase
    .from("user_digests")
    .select("id,suggestions,acknowledged_at,facts_digest,generated_at,recap_snapshot")
    .eq("owner_id", userId)
    .eq("kind", period.kind)
    .eq("period_key", period.periodKey)
    .maybeSingle();
  if (error) {
    throw new ApiRouteError(
      500,
      "digest_record_load_failed",
      "Digest data could not be loaded.",
      undefined,
      error
    );
  }
  if (!data) {
    return null;
  }
  const suggestions = digestSuggestionsSchema.safeParse(data.suggestions);
  const historical = digestFactsSchema.safeParse(data.recap_snapshot);
  return {
    id:data.id, factsDigest:data.facts_digest, generatedAt:data.generated_at, historicalFacts:historical.success ? historical.data : null,
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
      "Digest data could not be loaded.",
      undefined,
      error
    );
  }
  return data?.acknowledged_at ?? null;
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
      "Digest settings could not be saved.",
      undefined,
      error
    );
  }
}
