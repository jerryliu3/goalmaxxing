import type { AchievementsShowcasePayload } from "./types";
import { ACHIEVEMENTS_DATA_CACHE_PREFIX } from "@/lib/cache/planner-tab-cache";
import { loadTabDataCache } from "@/lib/cache/tab-data-cache";

export const ACHIEVEMENTS_SHOWCASE_CACHE_KEY = `${ACHIEVEMENTS_DATA_CACHE_PREFIX}showcase`;

/** Prefetch and mounted viewers share one session cache and in-flight read. */
export function fetchAchievementsShowcase({ forceRefresh = false } = {}) {
  return loadTabDataCache(ACHIEVEMENTS_SHOWCASE_CACHE_KEY, async () => {
    const response = await fetch("/api/xp/achievements", {
      method: "GET",
      headers: { "Cache-Control": "no-store" },
    });
    if (!response.ok) throw new Error("Achievements could not be loaded.");
    return await response.json() as AchievementsShowcasePayload;
  }, { forceRefresh });
}
