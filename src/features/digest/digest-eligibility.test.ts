import { describe, expect, it } from "vitest";
import { canAutoShowDigestAfterOnboarding } from "./digest-eligibility";

describe("check-in eligibility after account onboarding", () => {
  it("waits until setup was completed on an earlier day", () => {
    expect(canAutoShowDigestAfterOnboarding(null, "2026-09-09")).toBe(false);
    expect(canAutoShowDigestAfterOnboarding("2026-09-09T12:00:00Z", "2026-09-09")).toBe(false);
    expect(canAutoShowDigestAfterOnboarding("2026-09-08T12:00:00Z", "2026-09-09")).toBe(true);
  });
});
