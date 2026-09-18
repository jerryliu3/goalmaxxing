"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  buildCreditedGoalDateKeys,
  buildWeekRhythmRows,
  type WeekRhythmGoalRow,
} from "@/features/insights/week-rhythm-model";
import { getJson } from "@/lib/api/client";
import { buildPlannerContextCacheKey } from "@/lib/cache/planner-tab-cache";
import { readTabDataCache, writeTabDataCache } from "@/lib/cache/tab-data-cache";
import type { CompletionDateFact, Goal } from "@/lib/goals/types";
import type { PlannerContextPayload } from "@cadence/shared/planner/context";

export function useProgressWeekRhythm({
  goals,
  completions,
  asOfDate,
  weekStartsOn,
  visibleGoalIds,
  enabled,
  includePlannedSessions,
}: {
  goals: Goal[];
  completions: CompletionDateFact[];
  asOfDate: string;
  weekStartsOn: number;
  visibleGoalIds: ReadonlySet<string> | null;
  enabled: boolean;
  /**
   * Planner sessions only exist for the signed-in user, so a partner lane
   * builds its week from that subject's completions alone.
   */
  includePlannedSessions: boolean;
}) {
  const [context, setContext] = useState<PlannerContextPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scopeMonth = asOfDate ? asOfDate.slice(0, 7) : format(new Date(), "yyyy-MM");

  useEffect(() => {
    if (!enabled || !includePlannedSessions || !asOfDate) {
      return;
    }
    const cacheKey = buildPlannerContextCacheKey(scopeMonth);
    const cached = readTabDataCache<PlannerContextPayload>(cacheKey);
    if (cached) {
      setContext(cached);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getJson<PlannerContextPayload>("/api/planner/context", {
      query: { scopeMonth },
    })
      .then((payload) => {
        if (cancelled) {
          return;
        }
        writeTabDataCache(cacheKey, payload);
        setContext(payload);
        setError(null);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setContext(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Week rhythm could not be loaded."
          );
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
  }, [asOfDate, enabled, includePlannedSessions, scopeMonth]);

  const rows = useMemo<WeekRhythmGoalRow[]>(() => {
    if (!enabled || !asOfDate) {
      return [];
    }
    return buildWeekRhythmRows({
      goals,
      workUnits: includePlannedSessions ? context?.preview?.workUnits ?? [] : [],
      creditedGoalDates: buildCreditedGoalDateKeys(completions),
      asOfDate,
      weekStartsOn,
      visibleGoalIds,
    });
  }, [
    asOfDate,
    completions,
    context,
    enabled,
    goals,
    includePlannedSessions,
    visibleGoalIds,
    weekStartsOn,
  ]);

  return { rows, loading: loading && !context, error };
}
