"use client";

import { useCallback, useEffect, useState } from "react";
import type { AchievementsShowcasePayload } from "@/features/achievements/types";

export function useAchievementsShowcase() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<AchievementsShowcasePayload | null>(null);

  const loadAchievements = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAchievements();
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadAchievements]);

  return { loading, error, payload, reload: loadAchievements };
}
