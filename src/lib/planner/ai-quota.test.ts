import { afterEach, describe, expect, it, vi } from "vitest";
import { resetEnvCacheForTests } from "@/lib/env";
import {
  readDigestQuotaLimit,
  readPlannerCoachQuotaLimit,
  shouldBypassPlannerCoachQuota,
} from "./ai-quota";

describe("planner AI quota limits", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    resetEnvCacheForTests();
  });

  it("keeps local bypass behavior for coach development mode", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("CALENDAR_COACH_DISABLE_QUOTA", "true");
    resetEnvCacheForTests();

    expect(shouldBypassPlannerCoachQuota()).toBe(true);
    expect(readPlannerCoachQuotaLimit()).toBe(1_000_000);
  });

  it("clamps non-bypass coach limit above provider maximum", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("CALENDAR_COACH_DISABLE_QUOTA", "false");
    vi.stubEnv("CALENDAR_COACH_DAILY_LIMIT", "500");
    resetEnvCacheForTests();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(readPlannerCoachQuotaLimit()).toBe(100);
    expect(warnSpy).toHaveBeenCalledWith(
      "[planner-ai-quota] configured limit 500 exceeds provider limit 100; clamping."
    );
  });

  it("uses explicit in-range coach limits", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("CALENDAR_COACH_DISABLE_QUOTA", "false");
    vi.stubEnv("CALENDAR_COACH_DAILY_LIMIT", "75");
    resetEnvCacheForTests();

    expect(readPlannerCoachQuotaLimit()).toBe(75);
  });

  it("defaults digest quota to four requests per UTC day", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("CALENDAR_COACH_DISABLE_QUOTA", "false");
    resetEnvCacheForTests();

    expect(readDigestQuotaLimit()).toBe(4);
  });

  it("uses explicit in-range digest limits", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("CALENDAR_COACH_DISABLE_QUOTA", "false");
    vi.stubEnv("DIGEST_DAILY_LIMIT", "8");
    resetEnvCacheForTests();

    expect(readDigestQuotaLimit()).toBe(8);
  });
});
