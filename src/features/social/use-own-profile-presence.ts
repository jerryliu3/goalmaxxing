"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { fetchPublicProfileBundle, peekPublicProfileBundle } from "@/features/social/public-profile/data";
import { usePlannerTabCacheInvalidation } from "@/lib/cache/use-planner-tab-cache-invalidation";
import type { Profile } from "@/lib/goals/types";
import type { PublicProfileBundle } from "@cadence/shared/social/public-profile";

export function useOwnProfilePresence(userId: string | null, profile: Profile | null) {
  const [bundle, setBundle] = useState<PublicProfileBundle | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));

  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
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
      const item = await fetchPublicProfileBundle({ subjectUserId: userId, year });
      if (requestId === requestIdRef.current) setBundle(item);
    } catch {
      // Keep the cached stats visible if background refresh fails.
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

  usePlannerTabCacheInvalidation(() => { void load(); });
  return { bundle, loading };
}
