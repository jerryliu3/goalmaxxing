import { afterEach, describe, expect, it, vi } from "vitest";
import { resetEnvCacheForTests } from "@/lib/env";
import { getFeatureFlags, isFeatureEnabled } from "./feature-flags";

const defaultFlags = {
  crossMonthMovesEnabled: false,
  xpEnabled: false,
  socialEnabled: false,
  integrationsEnabled: false,
  journeyEnabled: false,
  digestEnabled: false,
} as const;

describe("feature flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetEnvCacheForTests();
  });

  it("defaults launch flags off", () => {
    expect(getFeatureFlags()).toEqual(defaultFlags);
    expect(isFeatureEnabled("crossMonthMovesEnabled")).toBe(false);
    expect(isFeatureEnabled("xpEnabled")).toBe(false);
    expect(isFeatureEnabled("socialEnabled")).toBe(false);
    expect(isFeatureEnabled("integrationsEnabled")).toBe(false);
    expect(isFeatureEnabled("journeyEnabled")).toBe(false);
    expect(isFeatureEnabled("digestEnabled")).toBe(false);
  });

  it("reads the cross-month moves kill switch from env", () => {
    vi.stubEnv("FEATURE_CROSS_MONTH_MOVES", "true");
    resetEnvCacheForTests();
    expect(getFeatureFlags()).toEqual({
      ...defaultFlags,
      crossMonthMovesEnabled: true,
    });
  });

  it("reads the XP kill switch from env", () => {
    vi.stubEnv("XP_ENABLED", "true");
    resetEnvCacheForTests();
    expect(getFeatureFlags()).toEqual({
      ...defaultFlags,
      xpEnabled: true,
    });
  });

  it("reads the social kill switch from env", () => {
    vi.stubEnv("SOCIAL_ENABLED", "true");
    resetEnvCacheForTests();
    expect(getFeatureFlags()).toEqual({
      ...defaultFlags,
      socialEnabled: true,
    });
  });

  it("enables XP and social by default in local development", () => {
    vi.stubEnv("NODE_ENV", "development");
    resetEnvCacheForTests();
    expect(getFeatureFlags()).toMatchObject({
      xpEnabled: true,
      socialEnabled: true,
    });
  });

  it("reads the integrations kill switch from env", () => {
    vi.stubEnv("INTEGRATIONS_ENABLED", "true");
    resetEnvCacheForTests();
    expect(getFeatureFlags()).toEqual({
      ...defaultFlags,
      integrationsEnabled: true,
    });
  });

  it("reads journey rollout flag from env", () => {
    vi.stubEnv("JOURNEY_ENABLED", "true");
    resetEnvCacheForTests();
    expect(getFeatureFlags()).toEqual({
      ...defaultFlags,
      journeyEnabled: true,
    });
  });

  it("reads digest rollout flag from env", () => {
    vi.stubEnv("DIGEST_ENABLED", "true");
    resetEnvCacheForTests();
    expect(getFeatureFlags()).toEqual({
      ...defaultFlags,
      digestEnabled: true,
    });
  });

  it("enables digest by default in local development", () => {
    vi.stubEnv("NODE_ENV", "development");
    resetEnvCacheForTests();
    expect(isFeatureEnabled("digestEnabled")).toBe(true);
  });
});
