"use client";

import { useEffect, useState } from "react";
import { fetchPublicProfileBundle } from "@/features/social/public-profile/data";
import type { PublicProfileBundle } from "@cadence/shared/social/public-profile";

export function useOwnProfilePresence(userId: string | null) {
  const [bundle, setBundle] = useState<PublicProfileBundle | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setBundle(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void fetchPublicProfileBundle({
      subjectUserId: userId,
      year: new Date().getFullYear(),
    })
      .then((item) => {
        if (!cancelled) {
          setBundle(item);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBundle(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { bundle, loading };
}
