import { describe, expect, it } from "vitest";

import {
  COACH_PROMPT_SEED_KEY,
  stashCoachPromptSeed,
  takeCoachPromptSeed,
} from "@/lib/coach/coach-prompt-seed";

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    has: (key: string) => map.has(key),
  };
}

describe("coach prompt seed", () => {
  it("round-trips a prompt exactly once", () => {
    const storage = memoryStorage();
    stashCoachPromptSeed(storage, "Help me plan this week.");

    expect(takeCoachPromptSeed(storage)).toBe("Help me plan this week.");
    expect(takeCoachPromptSeed(storage)).toBeNull();
    expect(storage.has(COACH_PROMPT_SEED_KEY)).toBe(false);
  });

  it("ignores an empty prompt", () => {
    const storage = memoryStorage();
    stashCoachPromptSeed(storage, "   ");

    expect(storage.has(COACH_PROMPT_SEED_KEY)).toBe(false);
    expect(takeCoachPromptSeed(storage)).toBeNull();
  });

  it("opens unseeded when storage refuses", () => {
    const refusing = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };

    expect(() => stashCoachPromptSeed(refusing, "hello")).not.toThrow();
    expect(takeCoachPromptSeed(refusing)).toBeNull();
  });
});
