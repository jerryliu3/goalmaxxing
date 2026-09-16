import { describe, expect, it } from "vitest";
import {
  DIGEST_DEFAULT_SESSION_MINUTES,
  estimateSessionMinutes,
  formatEstimatedDuration,
} from "./hours";

describe("estimateSessionMinutes", () => {
  it("scales with the session count", () => {
    expect(estimateSessionMinutes(0)).toBe(0);
    expect(estimateSessionMinutes(4)).toBe(4 * DIGEST_DEFAULT_SESSION_MINUTES);
  });

  it("never reports negative time", () => {
    expect(estimateSessionMinutes(-3)).toBe(0);
  });
});

describe("formatEstimatedDuration", () => {
  it("reads as hours and minutes", () => {
    expect(formatEstimatedDuration(0)).toBe("0m");
    expect(formatEstimatedDuration(45)).toBe("45m");
    expect(formatEstimatedDuration(120)).toBe("2h");
    expect(formatEstimatedDuration(150)).toBe("2h 30m");
  });
});
