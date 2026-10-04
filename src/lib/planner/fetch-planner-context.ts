import type { PlannerContextPayload } from "@cadence/shared/planner/context";
import { getJson } from "@/lib/api/client";
import { buildPlannerContextCacheKey } from "@/lib/cache/planner-tab-cache";
import { loadTabDataCache, retainTabDataCacheKeyByPrefix } from "@/lib/cache/tab-data-cache";

/** Read-only warming and foreground reads share a cache and an in-flight GET. */
export function fetchPlannerContext({
  month,
  window,
  forceRefresh = false,
}: {
  month: string;
  window?: { start: string; end: string };
  forceRefresh?: boolean;
}) {
  const key = buildPlannerContextCacheKey(month, window);
  if (window) retainTabDataCacheKeyByPrefix("planner-context:goals:", key);
  return loadTabDataCache(
    key,
    () => getJson<PlannerContextPayload>("/api/planner/context", {
      query: {
        scopeMonth: month,
        ...(window ? { visibleStart: window.start, visibleEnd: window.end } : {}),
      },
    }),
    { forceRefresh }
  );
}
