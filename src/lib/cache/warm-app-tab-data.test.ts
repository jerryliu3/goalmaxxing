import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchChecklistTodayData: vi.fn(),
  fetchInsightsData: vi.fn(),
  getJson: vi.fn(),
  fetchSocialChallenges: vi.fn(),
  fetchSocialLeaderboards: vi.fn(),
  fetchSocialTeamState: vi.fn(),
}));

vi.mock("@/features/today/fetch-checklist-data", () => ({
  fetchChecklistTodayData: mocks.fetchChecklistTodayData,
}));

vi.mock("@/features/insights/fetch-insights-data", () => ({
  fetchInsightsData: mocks.fetchInsightsData,
}));

vi.mock("@/lib/api/client", () => ({
  getJson: mocks.getJson,
}));

vi.mock("@/features/social/data", () => ({
  fetchSocialChallenges: mocks.fetchSocialChallenges,
  fetchSocialLeaderboards: mocks.fetchSocialLeaderboards,
  fetchSocialTeamState: mocks.fetchSocialTeamState,
}));

import { warmAppTabData } from "@/lib/cache/warm-app-tab-data";

describe("warmAppTabData", () => {
  beforeEach(() => {
    mocks.fetchChecklistTodayData.mockReset().mockResolvedValue({ userId: "user-1" });
    mocks.fetchInsightsData.mockReset().mockResolvedValue({ userId: "user-1" });
    mocks.getJson.mockReset().mockResolvedValue({ month: "2026-09" });
    mocks.fetchSocialChallenges.mockReset().mockResolvedValue({});
    mocks.fetchSocialLeaderboards.mockReset().mockResolvedValue({});
    mocks.fetchSocialTeamState.mockReset().mockResolvedValue({});
  });

  it("skips checklist and insights warmup when progress context should stay cold", async () => {
    await warmAppTabData({
      userId: "user-1",
      partnerId: null,
      includeProgressContext: false,
    });

    expect(mocks.fetchChecklistTodayData).not.toHaveBeenCalled();
    expect(mocks.fetchInsightsData).not.toHaveBeenCalled();
    expect(mocks.getJson).toHaveBeenCalled();
    expect(mocks.fetchSocialChallenges).toHaveBeenCalled();
    expect(mocks.fetchSocialLeaderboards).toHaveBeenCalled();
    expect(mocks.fetchSocialTeamState).toHaveBeenCalled();
  });

  it("warms checklist and insights by default", async () => {
    await warmAppTabData({
      userId: "user-1",
      partnerId: null,
    });

    expect(mocks.fetchChecklistTodayData).toHaveBeenCalled();
    expect(mocks.fetchInsightsData).toHaveBeenCalled();
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
  });
});
