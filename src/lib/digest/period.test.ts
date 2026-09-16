import { describe, expect, it } from "vitest";
import { resolveDigestPeriod } from "./period";

describe("resolveDigestPeriod", () => {
  it("uses a daily window on midweek days", () => {
    expect(
      resolveDigestPeriod({ localDate: "2026-09-09", weekStartsOn: 1 })
    ).toEqual({
      kind: "daily",
      periodKey: "2026-09-09",
      recapStart: "2026-09-08",
      recapEnd: "2026-09-08",
      aheadStart: "2026-09-09",
      aheadEnd: "2026-09-09",
    });
  });

  it("uses last week and this week on the configured week-start day", () => {
    expect(
      resolveDigestPeriod({ localDate: "2026-09-07", weekStartsOn: 1 })
    ).toEqual({
      kind: "weekly",
      periodKey: "2026-09-07",
      recapStart: "2026-08-31",
      recapEnd: "2026-09-06",
      aheadStart: "2026-09-07",
      aheadEnd: "2026-09-13",
    });
  });

  it("honors Sunday week starts", () => {
    expect(
      resolveDigestPeriod({ localDate: "2026-09-06", weekStartsOn: 0 })
    ).toEqual({
      kind: "weekly",
      periodKey: "2026-09-06",
      recapStart: "2026-08-30",
      recapEnd: "2026-09-05",
      aheadStart: "2026-09-06",
      aheadEnd: "2026-09-12",
    });
  });
});
