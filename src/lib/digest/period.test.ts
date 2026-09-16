import { describe, expect, it } from "vitest";
import {
  extendDailyRecapToLastCheckIn,
  resolveDigestPeriod,
} from "./period";

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

  it("recaps last month and looks over this one on the first of the month", () => {
    expect(
      resolveDigestPeriod({ localDate: "2026-09-01", weekStartsOn: 1 })
    ).toEqual({
      kind: "monthly",
      periodKey: "2026-09-01",
      recapStart: "2026-08-01",
      recapEnd: "2026-08-31",
      aheadStart: "2026-09-01",
      aheadEnd: "2026-09-30",
    });
  });

  it("crosses the year boundary on January 1", () => {
    expect(
      resolveDigestPeriod({ localDate: "2027-01-01", weekStartsOn: 1 })
    ).toEqual({
      kind: "monthly",
      periodKey: "2027-01-01",
      recapStart: "2026-12-01",
      recapEnd: "2026-12-31",
      aheadStart: "2027-01-01",
      aheadEnd: "2027-01-31",
    });
  });

  it("prefers monthly when the first of the month is also the week start", () => {
    // 2026-06-01 is a Monday.
    expect(
      resolveDigestPeriod({ localDate: "2026-06-01", weekStartsOn: 1 }).kind
    ).toBe("monthly");
  });

  it("extends a daily recap back to the last displayed check-in", () => {
    const daily = resolveDigestPeriod({
      localDate: "2026-09-09",
      weekStartsOn: 1,
    });

    expect(extendDailyRecapToLastCheckIn(daily, "2026-09-06")).toEqual({
      ...daily,
      recapStart: "2026-09-06",
      recapLabel: "Since your last check-in",
    });
  });

  it("does not alter weekly, monthly, or same-day recap windows", () => {
    const weekly = resolveDigestPeriod({
      localDate: "2026-09-07",
      weekStartsOn: 1,
    });
    const daily = resolveDigestPeriod({
      localDate: "2026-09-09",
      weekStartsOn: 1,
    });

    expect(extendDailyRecapToLastCheckIn(weekly, "2026-09-03")).toBe(weekly);
    expect(extendDailyRecapToLastCheckIn(daily, "2026-09-09")).toBe(daily);
  });
});
