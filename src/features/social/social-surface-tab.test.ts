import { describe, expect, it } from "vitest";
import { resolveSocialSurfaceTab } from "@/features/social/social-surface-tab";

describe("resolveSocialSurfaceTab", () => {
  it("opens the team tab from the profile deep link", () => {
    expect(resolveSocialSurfaceTab("team")).toBe("team");
  });

  it("falls back to team for feed, unknown, and missing tabs", () => {
    expect(resolveSocialSurfaceTab(undefined)).toBe("team");
    expect(resolveSocialSurfaceTab("unknown")).toBe("team");
    expect(resolveSocialSurfaceTab("feed")).toBe("team");
  });

  it("sends private accounts to team regardless of the requested tab", () => {
    expect(resolveSocialSurfaceTab(undefined, { socialActivityVisible: false })).toBe("team");
    expect(resolveSocialSurfaceTab("feed", { socialActivityVisible: false })).toBe("team");
    expect(resolveSocialSurfaceTab("challenges", { socialActivityVisible: false })).toBe("team");
    expect(resolveSocialSurfaceTab("leaderboards", { socialActivityVisible: false })).toBe("team");
    expect(resolveSocialSurfaceTab("team", { socialActivityVisible: false })).toBe("team");
  });
});
