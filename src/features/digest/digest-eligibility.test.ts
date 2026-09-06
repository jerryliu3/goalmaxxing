import { describe, expect, it } from "vitest";
import {
  JOURNEY_INTRO_SEEN_KEY,
  JOURNEY_ONBOARDING_COMPLETED_KEY,
} from "@/components/intro/journey-intro-overlay";
import { canAutoShowDigestAfterOnboarding } from "./digest-eligibility";

function memoryStorage(values: Record<string, string>) {
  return {
    getItem: (key: string) => values[key] ?? null,
  };
}

describe("canAutoShowDigestAfterOnboarding", () => {
  it("waits until onboarding is finished on a previous day", () => {
    expect(
      canAutoShowDigestAfterOnboarding(memoryStorage({}), "2026-09-09")
    ).toBe(false);
    expect(
      canAutoShowDigestAfterOnboarding(
        memoryStorage({
          [JOURNEY_ONBOARDING_COMPLETED_KEY]: "done",
          [JOURNEY_INTRO_SEEN_KEY]: "2026-09-09",
        }),
        "2026-09-09"
      )
    ).toBe(false);
    expect(
      canAutoShowDigestAfterOnboarding(
        memoryStorage({
          [JOURNEY_ONBOARDING_COMPLETED_KEY]: "done",
          [JOURNEY_INTRO_SEEN_KEY]: "2026-09-08",
        }),
        "2026-09-09"
      )
    ).toBe(true);
  });
});
