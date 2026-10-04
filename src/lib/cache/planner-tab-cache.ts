import { markTabDataCacheStaleByPrefix } from "@/lib/cache/tab-data-cache";
import { invalidateProgressContextCache } from "@/lib/goals/progress-context";
import { INSIGHTS_STATS_CACHE_PREFIX } from "@/lib/insights/stats";

export const PLANNER_CONTEXT_CACHE_PREFIX = "planner-context:";
export const CHECKLIST_DATA_CACHE_PREFIX = "checklist-data:";
export const INSIGHTS_DATA_CACHE_PREFIX = "insights-data:";
export const SETTINGS_DATA_CACHE_PREFIX = "settings-data:";
export const PUBLIC_PROFILE_CACHE_PREFIX = "social:public-profile:";
export const SOCIAL_ACTIVITY_VISIBLE_CACHE_KEY = "social-activity-visible";

const plannerTabCacheInvalidationListeners = new Set<() => void>();
let plannerTabCacheInvalidationNotifyScheduled = false;

export function buildPartnerCacheScope(
  partnerId: string | null | undefined,
  isViewer: boolean
) {
  return isViewer && partnerId ? `partner:${partnerId}` : "partner:none";
}

export function buildChecklistDataCacheKey({
  subjectUserId,
  viewDate,
  todayLocalDate,
  partnerScope,
}: {
  subjectUserId: string;
  viewDate: string;
  todayLocalDate: string;
  partnerScope: string;
}) {
  return `${CHECKLIST_DATA_CACHE_PREFIX}${subjectUserId}:${viewDate}:${todayLocalDate}:${partnerScope}`;
}

export function buildInsightsDataCacheKey({
  subjectUserId,
  selectedYear,
  asOfDate,
  partnerScope,
}: {
  subjectUserId: string;
  selectedYear: string;
  asOfDate: string;
  partnerScope: string;
}) {
  return `${INSIGHTS_DATA_CACHE_PREFIX}${subjectUserId}:${selectedYear}:${asOfDate}:${partnerScope}`;
}

export function buildPlannerContextCacheKey(month: string, window?: { start: string; end: string }) {
  return `${PLANNER_CONTEXT_CACHE_PREFIX}${month}${window ? `:${window.start}:${window.end}` : ""}`;
}

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
  markTabDataCacheStaleByPrefix(PLANNER_CONTEXT_CACHE_PREFIX);
  markTabDataCacheStaleByPrefix(CHECKLIST_DATA_CACHE_PREFIX);
  markTabDataCacheStaleByPrefix(INSIGHTS_DATA_CACHE_PREFIX);
  markTabDataCacheStaleByPrefix(INSIGHTS_STATS_CACHE_PREFIX);
  markTabDataCacheStaleByPrefix(SETTINGS_DATA_CACHE_PREFIX);
  markTabDataCacheStaleByPrefix(PUBLIC_PROFILE_CACHE_PREFIX);
  invalidateProgressContextCache();
  notifyPlannerTabCacheInvalidation();
}
