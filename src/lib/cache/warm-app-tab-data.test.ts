import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchChecklistTodayData: vi.fn(),
  fetchInsightsData: vi.fn(),
  fetchAchievementsShowcase: vi.fn(),
  getJson: vi.fn(),
  fetchSocialChallenges: vi.fn(),
  fetchSocialLeaderboards: vi.fn(),
  fetchSocialTeamState: vi.fn(),
  fetchSettingsTabData: vi.fn(),
  fetchPublicProfileBundle: vi.fn(),
}));

vi.mock("@/features/today/fetch-checklist-data", () => ({
  fetchChecklistTodayData: mocks.fetchChecklistTodayData,
}));

vi.mock("@/features/insights/fetch-insights-data", () => ({
  fetchInsightsData: mocks.fetchInsightsData,
}));
vi.mock("@/features/achievements/fetch-achievements-showcase", () => ({
  fetchAchievementsShowcase: mocks.fetchAchievementsShowcase,
}));

vi.mock("@/lib/api/client", () => ({
  getJson: mocks.getJson,
}));

vi.mock("@/features/social/data", () => ({
  fetchSocialChallenges: mocks.fetchSocialChallenges,
  fetchSocialLeaderboards: mocks.fetchSocialLeaderboards,
  fetchSocialTeamState: mocks.fetchSocialTeamState,
}));

vi.mock("@/features/social/settings-tab-data", () => ({
  fetchSettingsTabData: mocks.fetchSettingsTabData,
}));
vi.mock("@/features/social/public-profile/data", () => ({
  fetchPublicProfileBundle: mocks.fetchPublicProfileBundle,
}));

import { warmAppTabData } from "@/lib/cache/warm-app-tab-data";
import { resetTabDataCacheForTests } from "@/lib/cache/tab-data-cache";
import { buildGoalViewWindow } from "@/features/planner/goal-view/goal-view-model";

describe("warmAppTabData", () => {
  beforeEach(() => {
    resetTabDataCacheForTests();
    mocks.fetchChecklistTodayData.mockReset().mockResolvedValue({ userId: "user-1" });
    mocks.fetchInsightsData.mockReset().mockResolvedValue({ userId: "user-1" });
    mocks.fetchAchievementsShowcase.mockReset().mockResolvedValue({});
    mocks.getJson.mockReset().mockResolvedValue({ scopeMonth: "2026-10", asOfDate: "2026-10-04" });
    mocks.fetchSocialChallenges.mockReset().mockResolvedValue({});
    mocks.fetchSocialLeaderboards.mockReset().mockResolvedValue({});
    mocks.fetchSocialTeamState.mockReset().mockResolvedValue({});
    mocks.fetchSettingsTabData.mockReset().mockResolvedValue({});
    mocks.fetchPublicProfileBundle.mockReset().mockResolvedValue({});
  });

  it("skips checklist and insights warmup when progress context should stay cold", async () => {
    await warmAppTabData({
      userId: "user-1",
      partnerId: null,
      includeProgressContext: false,
    });

    expect(mocks.fetchChecklistTodayData).not.toHaveBeenCalled();
    expect(mocks.fetchInsightsData).not.toHaveBeenCalled();
    expect(mocks.fetchAchievementsShowcase).not.toHaveBeenCalled();
    expect(mocks.getJson).toHaveBeenCalled();
    const window = buildGoalViewWindow("2026-10-04");
    expect(mocks.getJson).toHaveBeenCalledWith("/api/planner/context", {
      query: expect.objectContaining({ visibleStart: window.start, visibleEnd: window.end }),
    });
    expect(mocks.fetchSocialChallenges).toHaveBeenCalled();
    expect(mocks.fetchSocialLeaderboards).toHaveBeenCalled();
    expect(mocks.fetchSocialTeamState).toHaveBeenCalled();
    expect(mocks.fetchSettingsTabData).toHaveBeenCalledWith({ forceRefresh: false });
    expect(mocks.fetchPublicProfileBundle).toHaveBeenCalledWith({
      subjectUserId: "user-1", year: new Date().getFullYear(), forceRefresh: false,
    });
  });

  it("warms checklist and insights by default", async () => {
    await warmAppTabData({
      userId: "user-1",
      partnerId: null,
    });

    expect(mocks.fetchChecklistTodayData).toHaveBeenCalled();
    expect(mocks.fetchInsightsData).toHaveBeenCalled();
    expect(mocks.fetchAchievementsShowcase).toHaveBeenCalledWith({ forceRefresh: false });
  });

  it("does not refill planner context from GET after a forced refresh", async () => {
    await warmAppTabData({
      userId: "user-1",
      partnerId: null,
      forceRefresh: true,
    });

    expect(mocks.getJson).not.toHaveBeenCalled();
    expect(mocks.fetchChecklistTodayData).toHaveBeenCalled();
    expect(mocks.fetchInsightsData).toHaveBeenCalled();
    expect(mocks.fetchSocialChallenges).toHaveBeenCalled();
    expect(mocks.fetchSettingsTabData).toHaveBeenCalledWith({ forceRefresh: true });
    expect(mocks.fetchPublicProfileBundle).toHaveBeenCalledWith({
      subjectUserId: "user-1", year: new Date().getFullYear(), forceRefresh: true,
    });
  });

  it("keeps warming other surfaces when Profile cannot load", async () => {
    mocks.fetchSettingsTabData.mockRejectedValue(new Error("offline"));
    await warmAppTabData({ userId: "user-1", partnerId: null });
    expect(mocks.fetchPublicProfileBundle).toHaveBeenCalled();
    expect(mocks.fetchInsightsData).toHaveBeenCalled();
    expect(mocks.getJson).toHaveBeenCalledTimes(2);
  });
});
