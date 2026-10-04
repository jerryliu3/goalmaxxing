import { fetchInsightsData, type InsightsData } from "@/features/insights/fetch-insights-data";
import { getMonthInTimezone } from "@/features/planner/calendar-format";
import { buildGoalViewWindow } from "@/features/planner/goal-view/goal-view-model";
import {
  fetchSocialChallenges,
  fetchSocialLeaderboards,
  fetchSocialTeamState,
} from "@/features/social/data";
import { fetchChecklistTodayData, type TodayData } from "@/features/today/fetch-checklist-data";
import { fetchPlannerContext } from "@/lib/planner/fetch-planner-context";
import {
  buildChecklistDataCacheKey,
  buildInsightsDataCacheKey,
  buildPartnerCacheScope,
} from "@/lib/cache/planner-tab-cache";
import {
  isTabDataCacheFresh,
  readTabDataCache,
  writeTabDataCache,
} from "@/lib/cache/tab-data-cache";
import { toLocalDateString } from "@/lib/dates/day";
import { resolveUserTimezone } from "@/lib/dates/timezone";

export async function warmAppTabData({
  userId,
  partnerId,
  forceRefresh = false,
  includeProgressContext = true,
}: {
  userId: string;
  partnerId: string | null;
  forceRefresh?: boolean;
  includeProgressContext?: boolean;
}) {
  if (!userId) {
    return;
  }

  const todayLocalDate = toLocalDateString();
  const selectedYear = todayLocalDate.slice(0, 4);
  const partnerScope = buildPartnerCacheScope(partnerId, true);
  const checklistCacheKey = buildChecklistDataCacheKey({
    subjectUserId: userId,
    viewDate: todayLocalDate,
    todayLocalDate,
    partnerScope,
  });
  const insightsCacheKey = buildInsightsDataCacheKey({
    subjectUserId: userId,
    selectedYear,
    asOfDate: todayLocalDate,
    partnerScope,
  });
  const month = getMonthInTimezone(resolveUserTimezone());

  const warmChecklist = async () => {
    const cached = readTabDataCache<TodayData>(checklistCacheKey);
    if (cached && !forceRefresh && isTabDataCacheFresh(checklistCacheKey)) {
      return;
    }
    const data = await fetchChecklistTodayData({
      userId,
      viewDate: todayLocalDate,
      todayLocalDate,
      partnerId,
      forceRefresh,
    });
    writeTabDataCache(checklistCacheKey, data);
  };

  const warmInsights = async () => {
    const cached = readTabDataCache<InsightsData>(insightsCacheKey);
    if (cached && !forceRefresh && isTabDataCacheFresh(insightsCacheKey)) {
      return;
    }
    const data = await fetchInsightsData({
      userId,
      selectedYear,
      partnerId,
      forceRefresh,
    });
    writeTabDataCache(insightsCacheKey, data);
  };

  const warmPlanner = async () => {
    // Goal/task writes invalidate this cache, then CalendarSurface (or the next
    // calendar open) force-prepares so new sessions exist. A GET /context refill
    // here would mark the cache fresh without those items and skip prepare.
    if (forceRefresh) {
      return;
    }
    const context = await fetchPlannerContext({ month });
    await fetchPlannerContext({ month, window: buildGoalViewWindow(context.asOfDate) });
  };

  await Promise.allSettled([
    includeProgressContext ? warmChecklist() : Promise.resolve(),
    includeProgressContext ? warmInsights() : Promise.resolve(),
    warmPlanner(),
    fetchSocialChallenges({ forceRefresh }),
    fetchSocialLeaderboards({ forceRefresh }),
    fetchSocialTeamState({ forceRefresh }),
  ]);
}
