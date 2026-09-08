import type { AwardTier } from "@/features/achievements/types";

export function awardTierForLevel(level: number): AwardTier {
  if (level <= 2) {
    return "bronze";
  }
  if (level <= 4) {
    return "copper";
  }
  if (level <= 6) {
    return "sage";
  }
  if (level <= 10) {
    return "gold";
  }
  return "ink";
}
