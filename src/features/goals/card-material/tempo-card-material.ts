import type { GoalDifficulty } from "@/lib/goals/types";

export type TempoCardMaterial = "glass" | "alloy" | "chromatic";

/** Difficulty picks the card material; anything without a difficulty reads as glass. */
export function resolveTempoCardMaterial(
  difficulty: GoalDifficulty | null | undefined,
): TempoCardMaterial {
  if (difficulty === "hard") {
    return "chromatic";
  }
  if (difficulty === "medium") {
    return "alloy";
  }
  return "glass";
}
