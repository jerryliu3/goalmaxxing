import { describe, expect, it } from "vitest";
import { formatTimeLeftLabel } from "@/lib/social/time-left-label";

describe("formatTimeLeftLabel", () => {
  const now = new Date("2026-08-12T12:00:00.000Z");

  it("returns null when the end time is missing, invalid, or already passed", () => {
    expect(formatTimeLeftLabel(null, now)).toBeNull();
    expect(formatTimeLeftLabel(undefined, now)).toBeNull();
    expect(formatTimeLeftLabel("not-a-date", now)).toBeNull();
    expect(formatTimeLeftLabel("2026-08-12T11:00:00.000Z", now)).toBeNull();
  });

  it("uses hour labels inside the final day", () => {
    expect(formatTimeLeftLabel("2026-08-12T12:30:00.000Z", now)).toBe("1 hour left");
    expect(formatTimeLeftLabel("2026-08-12T20:00:00.000Z", now)).toBe("8 hours left");
  });

  it("uses day labels when at least one full day remains", () => {
    expect(formatTimeLeftLabel("2026-08-13T12:00:00.000Z", now)).toBe("1 day left");
    expect(formatTimeLeftLabel("2026-08-20T12:00:00.000Z", now)).toBe("8 days left");
  });
});
