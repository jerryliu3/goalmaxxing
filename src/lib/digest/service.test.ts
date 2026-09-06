import { describe, expect, it } from "vitest";
import { shouldAutoShowDigest } from "./service";

describe("shouldAutoShowDigest", () => {
  it("shows when auto-show is on and the period is unacknowledged", () => {
    expect(
      shouldAutoShowDigest({ digestAutoShow: true, acknowledgedAt: null })
    ).toBe(true);
  });

  it("does not auto-show after ack or when the user opted out", () => {
    expect(
      shouldAutoShowDigest({
        digestAutoShow: true,
        acknowledgedAt: "2026-09-09T12:00:00.000Z",
      })
    ).toBe(false);
    expect(
      shouldAutoShowDigest({ digestAutoShow: false, acknowledgedAt: null })
    ).toBe(false);
  });
});
