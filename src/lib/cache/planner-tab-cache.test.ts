import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isTabDataCacheFresh,
  readTabDataCache,
  resetTabDataCacheForTests,
  writeTabDataCache,
} from "@/lib/cache/tab-data-cache";
import {
  CHECKLIST_DATA_CACHE_PREFIX,
  ACHIEVEMENTS_DATA_CACHE_PREFIX,
  buildGoalViewContextCacheKey,
  buildPlannerContextCacheKey,
  INSIGHTS_DATA_CACHE_PREFIX,
  PLANNER_CONTEXT_CACHE_PREFIX,
  PUBLIC_PROFILE_CACHE_PREFIX,
  invalidatePlannerRelatedTabCaches,
  resetPlannerTabCacheInvalidationForTests,
  subscribePlannerTabCacheInvalidation,
} from "@/lib/cache/planner-tab-cache";
import { INSIGHTS_STATS_CACHE_PREFIX } from "@/lib/insights/stats";

describe("invalidatePlannerRelatedTabCaches", () => {
  afterEach(() => {
    resetTabDataCacheForTests();
    resetPlannerTabCacheInvalidationForTests();
    window.sessionStorage.clear();
  });

  it("marks planner, checklist, insights, stats, and progress cache keys stale", () => {
    writeTabDataCache(`${PLANNER_CONTEXT_CACHE_PREFIX}2026-08`, { context: true });
    writeTabDataCache(`${CHECKLIST_DATA_CACHE_PREFIX}viewer:2026-08-15`, { data: true });
    writeTabDataCache(`${INSIGHTS_DATA_CACHE_PREFIX}viewer:2026:2026-08-15`, {
      data: true,
    });
    writeTabDataCache(`${INSIGHTS_STATS_CACHE_PREFIX}:viewer:viewer`, {
      data: true,
    });
    writeTabDataCache("progress-context:test", { progress: true });
    const profileKey = `${PUBLIC_PROFILE_CACHE_PREFIX}viewer:2026`;
    writeTabDataCache(profileKey, { stats: true });

    invalidatePlannerRelatedTabCaches();

    expect(readTabDataCache(`${PLANNER_CONTEXT_CACHE_PREFIX}2026-08`)).toEqual({
      context: true,
    });
    expect(isTabDataCacheFresh(`${PLANNER_CONTEXT_CACHE_PREFIX}2026-08`)).toBe(false);
    expect(
      readTabDataCache(`${CHECKLIST_DATA_CACHE_PREFIX}viewer:2026-08-15`)
    ).toEqual({ data: true });
    expect(isTabDataCacheFresh(`${CHECKLIST_DATA_CACHE_PREFIX}viewer:2026-08-15`)).toBe(
      false
    );
    expect(
      readTabDataCache(`${INSIGHTS_DATA_CACHE_PREFIX}viewer:2026:2026-08-15`)
    ).toEqual({ data: true });
    expect(
      readTabDataCache(`${INSIGHTS_STATS_CACHE_PREFIX}:viewer:viewer`)
    ).toEqual({ data: true });
    expect(readTabDataCache("progress-context:test")).toEqual({ progress: true });
    expect(isTabDataCacheFresh("progress-context:test")).toBe(false);
    expect(readTabDataCache(profileKey)).toEqual({ stats: true });
    expect(isTabDataCacheFresh(profileKey)).toBe(false);
  });

  it("invalidates wide goal windows and achievements alongside Planner", () => {
    const goalsKey = buildGoalViewContextCacheKey("2026-08", "2026-07-01", "2026-10-31");
    expect(goalsKey).not.toBe(buildPlannerContextCacheKey("2026-08"));
    writeTabDataCache(goalsKey, { goals: true });
    writeTabDataCache(`${ACHIEVEMENTS_DATA_CACHE_PREFIX}showcase`, { medals: true });
    invalidatePlannerRelatedTabCaches();
    expect(isTabDataCacheFresh(goalsKey)).toBe(false);
    expect(isTabDataCacheFresh(`${ACHIEVEMENTS_DATA_CACHE_PREFIX}showcase`)).toBe(false);
    expect(readTabDataCache(goalsKey)).toEqual({ goals: true });
  });

  it("notifies subscribers after cache invalidation", async () => {
    const listener = vi.fn();
    const unsubscribe = subscribePlannerTabCacheInvalidation(listener);

    invalidatePlannerRelatedTabCaches();
    invalidatePlannerRelatedTabCaches();
    await Promise.resolve();

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
