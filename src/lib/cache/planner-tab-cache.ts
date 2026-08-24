import { invalidateTabDataCacheByPrefix } from "@/lib/cache/tab-data-cache";
import { invalidateProgressContextCache } from "@/lib/goals/progress-context";
import { INSIGHTS_STATS_CACHE_PREFIX } from "@/lib/insights/stats";

export const PLANNER_CONTEXT_CACHE_PREFIX = "planner-context:";
export const CHECKLIST_DATA_CACHE_PREFIX = "checklist-data:";
export const INSIGHTS_DATA_CACHE_PREFIX = "insights-data:";

const plannerTabCacheInvalidationListeners = new Set<() => void>();
let plannerTabCacheInvalidationNotifyScheduled = false;

export function subscribePlannerTabCacheInvalidation(listener: () => void) {
  plannerTabCacheInvalidationListeners.add(listener);
  return () => {
    plannerTabCacheInvalidationListeners.delete(listener);
  };
}

export function resetPlannerTabCacheInvalidationForTests() {
  plannerTabCacheInvalidationListeners.clear();
  plannerTabCacheInvalidationNotifyScheduled = false;
}

function notifyPlannerTabCacheInvalidation() {
  if (plannerTabCacheInvalidationNotifyScheduled) {
    return;
  }
  plannerTabCacheInvalidationNotifyScheduled = true;
  queueMicrotask(() => {
    plannerTabCacheInvalidationNotifyScheduled = false;
    for (const listener of plannerTabCacheInvalidationListeners) {
      listener();
    }
  });
}

export function invalidatePlannerRelatedTabCaches() {
  invalidateTabDataCacheByPrefix(PLANNER_CONTEXT_CACHE_PREFIX);
  invalidateTabDataCacheByPrefix(CHECKLIST_DATA_CACHE_PREFIX);
  invalidateTabDataCacheByPrefix(INSIGHTS_DATA_CACHE_PREFIX);
  invalidateTabDataCacheByPrefix(INSIGHTS_STATS_CACHE_PREFIX);
  invalidateProgressContextCache();
  notifyPlannerTabCacheInvalidation();
}
