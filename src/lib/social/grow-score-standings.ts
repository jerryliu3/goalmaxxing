import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiRouteError } from "@/lib/api/route";
import type { Database } from "@/lib/supabase/database.types";
import { buildProfileGrowSeries, resolveProfileHistory } from "./public-profile-model";
import { loadCompletionsForSubject, loadGoalsForSubject } from "./public-profile";

type AdminClient = SupabaseClient<Database>;

const PROFILE_PAGE_SIZE = 500;

async function loadSyntheticUserIds(admin: AdminClient) {
  const { data, error } = await admin.from("synthetic_users").select("user_id");
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.user_id));
}

/** Recompute every real account's current Goal score and store it for ranking. */
export async function refreshGrowScoreStandings(admin: AdminClient) {
  const synthetic = await loadSyntheticUserIds(admin);
  let refreshed = 0;
  let skipped = 0;
  let lastId: string | null = null;

  for (;;) {
    let query = admin
      .from("profiles")
      .select("id,timezone,week_starts_on,created_at")
      .order("id")
      .limit(PROFILE_PAGE_SIZE);
    if (lastId) query = query.gt("id", lastId);
    const { data, error } = await query;
    if (error) throw error;
    const profiles = data ?? [];

    const rows: Database["public"]["Tables"]["grow_score_standings"]["Insert"][] = [];
    for (const profile of profiles) {
      if (synthetic.has(profile.id)) continue;
      try {
        const [goals, completions] = await Promise.all([
          loadGoalsForSubject({ admin, subjectUserId: profile.id }),
          loadCompletionsForSubject({ admin, subjectUserId: profile.id }),
        ]);
        const history = resolveProfileHistory({ subjectProfile: profile, goals, completions });
        rows.push({
          user_id: profile.id,
          score: Math.max(0, buildProfileGrowSeries(history).at(-1)?.score ?? 0),
          as_of_date: history.asOfDate,
          updated_at: new Date().toISOString(),
        });
      } catch (cause) {
        // Accounts past the history bounds keep their previous snapshot.
        if (cause instanceof ApiRouteError) {
          skipped += 1;
          continue;
        }
        throw cause;
      }
    }

    if (rows.length) {
      const { error: upsertError } = await admin.from("grow_score_standings").upsert(rows);
      if (upsertError) throw upsertError;
      refreshed += rows.length;
    }
    if (profiles.length < PROFILE_PAGE_SIZE) break;
    lastId = profiles.at(-1)?.id ?? null;
  }

  return { refreshed, skipped };
}
