"use client";

import { useCallback, useEffect, useState } from "react";
import { ACHIEVEMENTS_DATA_CACHE_PREFIX } from "@/lib/cache/planner-tab-cache";
import { usePlannerTabCacheInvalidation } from "@/lib/cache/use-planner-tab-cache-invalidation";
import { isTabDataCacheFresh, readTabDataCache, writeTabDataCache, markTabDataCacheStaleByPrefix } from "@/lib/cache/tab-data-cache";
import { subscribeXpRefresh } from "@/lib/xp/events";
import type { AchievementsShowcasePayload } from "@/features/achievements/types";

export function useAchievementsShowcase({ enabled = true }: { enabled?: boolean } = {}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<AchievementsShowcasePayload | null>(null);

  const cacheKey = `${ACHIEVEMENTS_DATA_CACHE_PREFIX}showcase`;
  const loadAchievements = useCallback(async (forceRefresh = false) => {
    const cached = readTabDataCache<AchievementsShowcasePayload>(cacheKey);
    if (cached) {
      setPayload(cached);
      setLoading(false);
      if (!forceRefresh && isTabDataCacheFresh(cacheKey)) return;
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await fetch("/api/xp/achievements", {
        method: "GET",
        headers: { "Cache-Control": "no-store" },
      });
      if (!response.ok) {
        throw new Error("Achievements could not be loaded.");
      }
      const body = (await response.json()) as AchievementsShowcasePayload & {
        correlationId: string;
      };
      writeTabDataCache(cacheKey, body);
      setPayload(body);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Achievements could not be loaded."
      );
    } finally {
      setLoading(false);
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
