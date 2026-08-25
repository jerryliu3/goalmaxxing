import { describe, expect, it } from "vitest";
import {
  createDefaultJourneyIntroPreferences,
  resolveJourneyIntroSocialActivityVisible,
} from "@/components/intro/journey-intro-preferences-step";

describe("resolveJourneyIntroSocialActivityVisible", () => {
  it("defaults to public unless visibility is explicitly false", () => {
    expect(resolveJourneyIntroSocialActivityVisible(undefined)).toBe(true);
    expect(resolveJourneyIntroSocialActivityVisible(null)).toBe(true);
    expect(resolveJourneyIntroSocialActivityVisible(true)).toBe(true);
    expect(resolveJourneyIntroSocialActivityVisible(false)).toBe(false);
  });
});

describe("createDefaultJourneyIntroPreferences", () => {
  it("starts with public account visibility", () => {
    expect(createDefaultJourneyIntroPreferences().socialActivityVisible).toBe(true);
  });
});
