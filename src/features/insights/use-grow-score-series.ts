"use client";

import { useMemo } from "react";
import {
  buildGrowScoreSeries,
  isIsoDateString,
  type GrowCompletionFact,
  type GrowGoalDifficultyRef,
  type GrowScorePoint,
} from "@/lib/grow-score";

const DISPLAY_DAYS = 28;
const WARMUP_DAYS = 56;

/** Shared trailing four-week score series for profile presence. */
export function useGrowScoreSeries({
  completions,
  goals,
  asOfDate,
  weekStartsOn = 1,
}: {
  completions: readonly GrowCompletionFact[];
  goals: readonly GrowGoalDifficultyRef[];
  asOfDate: string;
  weekStartsOn?: number;
}): GrowScorePoint[] {
  return useMemo(() => {
    if (!isIsoDateString(asOfDate)) {
      return [];
    }
    return buildGrowScoreSeries({
      completions,
      goals,
      asOfDate,
      displayDays: DISPLAY_DAYS,
      warmupDays: WARMUP_DAYS,
      weekStartsOn,
    });
  }, [asOfDate, completions, goals, weekStartsOn]);
}

/** A flat, all-zero series means the account has nothing to show yet. */
export function hasGrowScoreSignal(series: readonly GrowScorePoint[]): boolean {
  return series.some((point) => point.rawCredits > 0 || point.score > 0);
}
