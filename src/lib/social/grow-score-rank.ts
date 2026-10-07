import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { growScoreTopPercent } from "./public-profile-model";

/** "Top N%" for a live score against every other account's stored score. */
export async function loadGrowTopPercent(
  admin: SupabaseClient<Database>,
  userId: string,
  score: number | undefined,
): Promise<number | null> {
  if (score === undefined) return null;
  const { data, error } = await admin
    .rpc("grow_score_rank", { p_user_id: userId, p_score: score })
    .maybeSingle();
  if (error || !data) return null;
  return growScoreTopPercent(data.rank, data.total);
}
