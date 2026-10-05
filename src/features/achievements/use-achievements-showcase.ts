"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ACHIEVEMENTS_DATA_CACHE_PREFIX } from "@/lib/cache/planner-tab-cache";
import { usePlannerTabCacheInvalidation } from "@/lib/cache/use-planner-tab-cache-invalidation";
import { isTabDataCacheFresh, readTabDataCache, markTabDataCacheStaleByPrefix } from "@/lib/cache/tab-data-cache";
import { ACHIEVEMENTS_SHOWCASE_CACHE_KEY, fetchAchievementsShowcase } from "./fetch-achievements-showcase";
import { subscribeXpRefresh } from "@/lib/xp/events";
import type { AchievementsShowcasePayload } from "@/features/achievements/types";

export function useAchievementsShowcase({ enabled = true }: { enabled?: boolean } = {}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<AchievementsShowcasePayload | null>(null);

  const requestId = useRef(0);
  const cacheKey = ACHIEVEMENTS_SHOWCASE_CACHE_KEY;
  const loadAchievements = useCallback(async (forceRefresh = false) => {
    const id = ++requestId.current;
    setError(null);
    const cached = readTabDataCache<AchievementsShowcasePayload>(cacheKey);
    if (cached) {
      setPayload(cached);
      setLoading(false);
      if (!forceRefresh && isTabDataCacheFresh(cacheKey)) return;
    } else {
      setLoading(true);
    }
    try {
      const body = await fetchAchievementsShowcase({ forceRefresh });
      if (id !== requestId.current) return;
      setPayload(body);
    } catch (loadError) {
      if (id !== requestId.current) return;
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Achievements could not be loaded."
      );
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      void loadAchievements();
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
      requestId.current += 1;
    };
  }, [enabled, loadAchievements]);

  usePlannerTabCacheInvalidation(() => {
    if (enabled) void loadAchievements(true);
  });
  useEffect(() => subscribeXpRefresh(() => {
    markTabDataCacheStaleByPrefix(ACHIEVEMENTS_DATA_CACHE_PREFIX);
    if (enabled) void loadAchievements(true);
  }), [enabled, loadAchievements]);

  return { loading, error, payload, reload: () => loadAchievements(true) };
}
