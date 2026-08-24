import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readTabDataCache,
  resetTabDataCacheForTests,
  writeTabDataCache,
} from "@/lib/cache/tab-data-cache";
import {
  CHECKLIST_DATA_CACHE_PREFIX,
  INSIGHTS_DATA_CACHE_PREFIX,
  PLANNER_CONTEXT_CACHE_PREFIX,
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

  it("clears planner, checklist, insights, stats, and progress cache keys", () => {
    writeTabDataCache(`${PLANNER_CONTEXT_CACHE_PREFIX}2026-08`, { context: true });
    writeTabDataCache(`${CHECKLIST_DATA_CACHE_PREFIX}viewer:2026-08-15`, { data: true });
    writeTabDataCache(`${INSIGHTS_DATA_CACHE_PREFIX}viewer:2026:2026-08-15`, {
      data: true,
    });
    writeTabDataCache(`${INSIGHTS_STATS_CACHE_PREFIX}:viewer:viewer`, {
      data: true,
    });
    writeTabDataCache("progress-context:test", { progress: true });

    invalidatePlannerRelatedTabCaches();

    expect(readTabDataCache(`${PLANNER_CONTEXT_CACHE_PREFIX}2026-08`)).toBeNull();
    expect(
      readTabDataCache(`${CHECKLIST_DATA_CACHE_PREFIX}viewer:2026-08-15`)
    ).toBeNull();
    expect(
      readTabDataCache(`${INSIGHTS_DATA_CACHE_PREFIX}viewer:2026:2026-08-15`)
    ).toBeNull();
    expect(
      readTabDataCache(`${INSIGHTS_STATS_CACHE_PREFIX}:viewer:viewer`)
    ).toBeNull();
    expect(readTabDataCache("progress-context:test")).toBeNull();
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
