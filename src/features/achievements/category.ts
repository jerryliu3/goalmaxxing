import type { AchievementGoalCategory } from "@/features/achievements/types";

const CATEGORY_KEYS = new Set<AchievementGoalCategory>([
  "health",
  "career",
  "personal",
  "relationships",
  "other",
]);

export function toAchievementGoalCategory(
  categoryKey?: string | null,
  categoryLabel?: string | null
): AchievementGoalCategory {
  const normalizedKey = categoryKey?.trim().toLowerCase();
  if (normalizedKey && CATEGORY_KEYS.has(normalizedKey as AchievementGoalCategory)) {
    return normalizedKey as AchievementGoalCategory;
  }

  const normalizedLabel = categoryLabel?.trim().toLowerCase() ?? "";
  if (normalizedLabel.includes("health") || normalizedLabel.includes("fitness")) {
    return "health";
  }
  if (normalizedLabel.includes("career") || normalizedLabel.includes("work")) {
    return "career";
  }
  if (normalizedLabel.includes("relationship")) {
    return "relationships";
  }
  if (normalizedLabel.includes("personal")) {
    return "personal";
  }

  return "other";
}
