import type { GoalDifficulty } from "@/lib/goals/types";

export type TempoCardMaterial = "glass" | "alloy" | "foil";

/** Difficulty picks the card material; anything without a difficulty reads as glass. */
export function resolveTempoCardMaterial(
  difficulty: GoalDifficulty | null | undefined,
): TempoCardMaterial {
  if (difficulty === "hard") {
    return "foil";
  }
  if (difficulty === "medium") {
    return "alloy";
  }
  return "glass";
}
