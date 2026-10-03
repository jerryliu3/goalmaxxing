import { describe, expect, it } from "vitest";
import { shouldAutoShowDigest } from "./service";

describe("shouldAutoShowDigest", () => {
  it("shows when auto-show is on and the period is unacknowledged", () => {
    expect(
      shouldAutoShowDigest({ digestAutoShow: true, acknowledged: false })
    ).toBe(true);
  });

  it("does not auto-show after ack or when the user opted out", () => {
    expect(
      shouldAutoShowDigest({
        digestAutoShow: true,
        acknowledged: true,
      })
    ).toBe(false);
    expect(
      shouldAutoShowDigest({ digestAutoShow: false, acknowledged: false })
    ).toBe(false);
  });
});
