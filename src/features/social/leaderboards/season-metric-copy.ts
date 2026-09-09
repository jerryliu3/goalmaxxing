import type { ChallengeMetric } from "@/features/social/types";

export function describeSeasonMetric(
  metric: ChallengeMetric,
  trackKey?: string | null
) {
  switch (metric) {
    case "total_xp":
      return "Ranked by total XP earned this season.";
    case "category_xp":
      return trackKey
        ? `Ranked by ${trackKey} XP earned this season.`
        : "Ranked by category XP earned this season.";
    case "completions_count":
      return "Ranked by completed sessions this season.";
    case "distinct_active_days":
      return "Ranked by distinct active days this season.";
    case "max_streak_days":
      return "Ranked by the longest streak this season.";
    default:
      return "Ranked by season activity.";
  }
}
