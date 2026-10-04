"use client";
import { useCallback, useEffect, useState } from "react";
import { coachContextSchema, type CoachContext, type CoachPage } from "@cadence/shared/coach";
import { getJson } from "@/lib/api/client";
import { subscribePlannerTabCacheInvalidation } from "@/lib/cache/planner-tab-cache";
import { createClient } from "@/lib/supabase/client";

export function useCoachFacts(userId: string, page: CoachPage) {
  const [facts, setFacts] = useState<CoachContext | null>(null);
  const [freshness, setFreshness] = useState<"refreshing" | "fresh" | "stale">("refreshing");
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  const pageKey = JSON.stringify(page);
  useEffect(() => {
    let scheduled: ReturnType<typeof setTimeout> | undefined;
    const invalidate = () => { clearTimeout(scheduled); scheduled = setTimeout(refresh, 150); };
    const unsubscribe = subscribePlannerTabCacheInvalidation(invalidate);
    const supabase = createClient();
    const channel = supabase.channel(`coach-context:${userId}`).on("postgres_changes", {
      event: "*", schema: "public", table: "coach_context_versions", filter: `owner_id=eq.${userId}`,
    }, invalidate).subscribe();
    const resume = () => { if (!document.hidden) refresh(); };
    window.addEventListener("focus", resume);
    window.addEventListener("online", resume);
    document.addEventListener("visibilitychange", resume);
    // Also catches local-day rollover and a missed realtime event while visible.
    const interval = window.setInterval(() => { if (!document.hidden) refresh(); }, 60000);
    return () => {
      unsubscribe(); clearTimeout(scheduled); void supabase.removeChannel(channel); window.clearInterval(interval);
      window.removeEventListener("focus", resume); window.removeEventListener("online", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [userId, refresh]);
  useEffect(() => {
    const controller = new AbortController();
    setFreshness("refreshing");
    void getJson<{ context: unknown }>(`/api/coach/context?page=${encodeURIComponent(pageKey)}`, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) { setFacts(coachContextSchema.parse(result.context)); setFreshness("fresh"); } })
      .catch(() => { if (!controller.signal.aborted) setFreshness("stale"); });
    return () => controller.abort();
  }, [pageKey, revision]);
  return { facts, freshness, refresh };
}
