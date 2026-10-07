import { ApiRouteError } from "@/lib/api/route";
import { digestFactsSchema, digestSuggestionsSchema } from "@/lib/digest/contract";
import type { DigestFactItem, DigestFacts, DigestSuggestions } from "@/lib/digest/contract";
import { buildDigestFacts } from "@/lib/digest/facts";
import {
  extendDailyRecapToLastCheckIn,
  resolveDigestPeriod,
  type DigestKind,
  type DigestPeriod,
} from "@/lib/digest/period";
import { getDateInTimezone } from "@/lib/dates/timezone";
import { normalizeWeekStartsOn } from "@/lib/dates/week-start";
import type { Goal } from "@/lib/goals/types";
import { findRecoverable } from "@/lib/planner/recovery/model";
import {
  loadRecoveryContext,
  type RecoveryClient,
} from "@/lib/planner/recovery/snapshot";

export type DigestClient = RecoveryClient;

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
  const { goals, sessions, recovery } = await loadRecoveryContext({ supabase, userId, now });
  const titleByGoalId = new Map(goals.map((goal) => [goal.id, goal.title]));
  const items = sessions.flatMap((session) => {
    const title = titleByGoalId.get(session.goalId);
    return title && session.date >= period.recapStart && session.date <= period.aheadEnd
      ? [{
          goalId: session.goalId,
          title,
          scheduledDate: session.date,
          credited: session.credited,
          requirementKind: session.requirementKind,
        }]
      : [];
  });
  const recoverable = findRecoverable(recovery).map(
    ({ session, goal }): DigestFactItem => ({
      goalId: goal.id,
      title: goal.title,
      date: session.date,
      state: "open",
      requirementKind: goal.kind,
    })
  );
  return {
    profile,
    localDate,
    period,
    facts: buildDigestFacts({
      period,
      items,
      recoverable,
      goals: goalsLiveInWindow(goals, period),
    }),
    record,
  };
}

/**
 * Goals live enough to want work in the window ahead. Archived goals stay in
 * the recap (a session placed against one still belongs there) but not here.
 */
function goalsLiveInWindow(goals: Goal[], period: DigestPeriod) {
  return goals
    .filter(
      (goal) =>
        goal.archived_at === null &&
        goal.start_date <= period.aheadEnd &&
        (goal.end_date === null || goal.end_date >= period.aheadStart)
    )
    .map((goal) => ({ goalId: goal.id, title: goal.title }));
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
