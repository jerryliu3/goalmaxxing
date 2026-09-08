import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadPlannerProfileTimezone,
  PlannerRouteError,
  resolveCanonicalAsOfDate,
} from "@/lib/planner/api";

describe("resolveCanonicalAsOfDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-05T13:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the canonical server-local day when asOfDate is omitted", () => {
    expect(
      resolveCanonicalAsOfDate({
        timezone: "UTC",
      })
    ).toBe("2026-08-05");
  });

  it("accepts an explicitly matching asOfDate", () => {
    expect(
      resolveCanonicalAsOfDate({
        timezone: "Pacific/Auckland",
        requestedAsOfDate: "2026-08-06",
      })
    ).toBe("2026-08-06");
  });

  it("rejects a conflicting asOfDate", () => {
    expect(() =>
      resolveCanonicalAsOfDate({
        timezone: "UTC",
        requestedAsOfDate: "2026-08-04",
      })
    ).toThrowError(PlannerRouteError);

    try {
      resolveCanonicalAsOfDate({
        timezone: "UTC",
        requestedAsOfDate: "2026-08-04",
      });
    } catch (error) {
      const routeError = error as PlannerRouteError;
      expect(routeError.status).toBe(409);
      expect(routeError.code).toBe("as_of_date_conflict");
      expect(routeError.details).toEqual({ canonicalAsOfDate: "2026-08-05" });
    }
  });
});

describe("loadPlannerProfileTimezone", () => {
  function profileClient(result: {
    data: { timezone: string | null } | null;
    error: { message: string } | null;
  }) {
    return {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => result,
          }),
        }),
      }),
    } as unknown as Parameters<typeof loadPlannerProfileTimezone>[0]["supabase"];
  }

  it("returns a confirmed profile timezone", async () => {
    await expect(
      loadPlannerProfileTimezone({
        supabase: profileClient({
          data: { timezone: "America/New_York" },
          error: null,
        }),
        userId: "11111111-1111-4111-8111-111111111111",
      })
    ).resolves.toBe("America/New_York");
  });

  it("falls back to UTC when the profile timezone is missing", async () => {
    await expect(
      loadPlannerProfileTimezone({
        supabase: profileClient({ data: { timezone: null }, error: null }),
        userId: "11111111-1111-4111-8111-111111111111",
      })
    ).resolves.toBe("UTC");
  });

  it("fails closed when the profile timezone cannot be loaded", async () => {
    await expect(
      loadPlannerProfileTimezone({
        supabase: profileClient({
          data: null,
          error: { message: "unavailable" },
        }),
        userId: "11111111-1111-4111-8111-111111111111",
      })
    ).rejects.toMatchObject({
      status: 503,
      code: "profile_timezone_lookup_failed",
    });
  });
});
