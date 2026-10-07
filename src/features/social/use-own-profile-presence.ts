"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { fetchPublicProfileBundle, peekPublicProfileBundle } from "@/features/social/public-profile/data";
import { subscribeXpRefresh } from "@/lib/xp/events";
import { reportError } from "@/lib/observability/report-error";
import { usePlannerTabCacheInvalidation } from "@/lib/cache/use-planner-tab-cache-invalidation";
import type { Profile } from "@/lib/goals/types";
import type { PublicProfileBundle } from "@cadence/shared/social/public-profile";

export function useOwnProfilePresence(userId: string | null, profile: Profile | null) {
  const [bundle, setBundle] = useState<PublicProfileBundle | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));

  const requestIdRef = useRef(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (forceRefresh = false) => {
    const requestId = ++requestIdRef.current;
    setError(null);
    if (!userId) {
      setBundle(null);
      setLoading(false);
      return;
    }

    const year = new Date().getFullYear();
    const cached = peekPublicProfileBundle(userId, year);
    setBundle(cached);
    setLoading(!cached);
    try {
      const item = await fetchPublicProfileBundle({ subjectUserId: userId, year, forceRefresh });
      if (requestId === requestIdRef.current) setBundle(item);
    } catch (loadError) {
      if (requestId === requestIdRef.current) {
        setError(loadError instanceof Error ? loadError.message : "Your score and activity could not be loaded.");
        reportError(loadError, { surface: "profile-presence" });
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [userId]);

  // Profile writes refresh this identity object and invalidate its bundle.
  // Apply warmed browser data before paint while preserving server hydration.
  useLayoutEffect(() => {
    void load();
    return () => { requestIdRef.current += 1; };
  }, [load, profile]);

  const reload = useCallback(() => { void load(true); }, [load]);
  usePlannerTabCacheInvalidation(reload);
  useEffect(() => subscribeXpRefresh(reload), [reload]);
  return { bundle, loading, error, reload };
}
