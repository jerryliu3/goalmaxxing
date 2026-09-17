import type { ChallengeMetric } from "@/features/social/types";

export function challengeUnitLabel(
  metric: ChallengeMetric,
  trackKey?: string | null
) {
  switch (metric) {
    case "total_xp":
      return "XP";
    case "category_xp":
      return trackKey ? `${trackKey} XP` : "category XP";
    case "completions_count":
      return "sessions";
    case "distinct_active_days":
      return "active days";
    case "max_streak_days":
      return "day streak";
    default:
      return "progress";
  }
}

export function describeChallengeTarget(
  metric: ChallengeMetric,
  trackKey: string | null,
  target: number
) {
  const amount = `${Math.round(target).toLocaleString()} ${challengeUnitLabel(metric, trackKey)}`;
  switch (metric) {
    case "total_xp":
    case "category_xp":
      return `Earn ${amount} before this challenge ends.`;
    case "completions_count":
      return `Complete ${amount} before this challenge ends.`;
    case "distinct_active_days":
      return `Show up on ${amount} before this challenge ends.`;
    case "max_streak_days":
      return `Build a ${amount} before this challenge ends.`;
    default:
      return `Reach ${amount} before this challenge ends.`;
  }
}
