/**
 * A one-shot handoff for pre-filling the planner coach's input from somewhere
 * else in the app. The check-in lives in the app shell and the coach panel
 * lives on the plan surface, so the question has to survive a navigation.
 * Session storage keeps it out of the URL and clears itself with the tab.
 */
export const COACH_PROMPT_SEED_KEY = "cadence.coach.prompt-seed";

/**
 * The check-in is an app-shell overlay, so it is often sitting on top of the
 * plan surface the coach panel already lives on. Navigating there would not
 * remount the panel, so storage alone would leave the seed unread until the
 * next mount. This event covers the already-mounted case; storage covers the
 * navigation case.
 */
export const COACH_PROMPT_SEED_EVENT = "cadence.coach.prompt-seed";

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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(COACH_PROMPT_SEED_EVENT));
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
