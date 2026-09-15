import { describe, expect, it, vi } from "vitest";
import { buildPublicProfileBundle } from "@/lib/social/public-profile";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

describe("loadPublicProfileBundleByUsername", () => {
  it("is exported from the public profile loader module", async () => {
    const loaderModule = await import("@/lib/social/public-profile");
    expect(typeof loaderModule.loadPublicProfileBundleByUsername).toBe("function");
  });
});

describe("buildPublicProfileBundle award catalog", () => {
  it("includes awardCatalogCount on public payloads", () => {
    const bundle = buildPublicProfileBundle({
      viewerUserId: "viewer-1",
      subjectProfile: {
        id: "subject-1",
        username: "subject",
        display_name: "Subject User",
        avatar_url: null,
        social_activity_visible: true,
        week_starts_on: 1,
        created_at: "2026-01-01T00:00:00.000Z",
        timezone: "America/New_York",
      },
      globalXpProfile: { total_xp: 0 },
      globalAchievements: [],
      awardCatalogCount: 12,
      goals: [],
      completions: [],
      selectedYear: 2026,
    });

    expect(bundle.awardCatalogCount).toBe(12);
  });
});
