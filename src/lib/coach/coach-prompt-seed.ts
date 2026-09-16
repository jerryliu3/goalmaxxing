/**
 * A one-shot handoff for pre-filling the planner coach's input from somewhere
 * else in the app. The check-in lives in the app shell and the coach panel
 * lives on the plan surface, so the question has to survive a navigation.
 * Session storage keeps it out of the URL and clears itself with the tab.
 */
export const COACH_PROMPT_SEED_KEY = "cadence.coach.prompt-seed";

type SeedStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function stashCoachPromptSeed(storage: SeedStorage, prompt: string) {
  const trimmed = prompt.trim();
  if (trimmed.length === 0) {
    return;
  }
  try {
    storage.setItem(COACH_PROMPT_SEED_KEY, trimmed);
  } catch {
    // Private-mode storage refusals just mean the coach opens unseeded.
  }
}

/** Reads the stashed prompt and clears it, so a reload does not re-seed. */
export function takeCoachPromptSeed(storage: SeedStorage) {
  try {
    const seed = storage.getItem(COACH_PROMPT_SEED_KEY);
    storage.removeItem(COACH_PROMPT_SEED_KEY);
    return seed && seed.trim().length > 0 ? seed : null;
  } catch {
    return null;
  }
}
