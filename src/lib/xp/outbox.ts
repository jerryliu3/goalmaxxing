import type { Database } from "@cadence/shared/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runAfterResponse } from "@/lib/api/after";

type OutboxClient = Pick<SupabaseClient<Database>, "rpc">;

export function scheduleXpOutboxDrain(supabase: OutboxClient) {
  runAfterResponse(() =>
    supabase.rpc("drain_xp_recompute_outbox", { p_limit: 50 })
  );
}

export async function previewQueuedXpDeltaThenDrain(supabase: OutboxClient) {
  const preview = await supabase.rpc("preview_queued_xp_delta");
  scheduleXpOutboxDrain(supabase);
  return typeof preview.data === "number" && Number.isFinite(preview.data)
    ? preview.data
    : 0;
}
