import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LeaderboardsPanel } from "@/features/social/leaderboards/leaderboards-panel";
import type { LeaderboardSeason, LeaderboardStanding } from "@/features/social/types";

const fetchSocialLeaderboardsMock = vi.fn();
const fetchSocialLeaderboardStandingsMock = vi.fn();

vi.mock("@/features/social/data", () => ({
  fetchSocialLeaderboards: (...args: unknown[]) => fetchSocialLeaderboardsMock(...args),
  fetchSocialLeaderboardStandings: (...args: unknown[]) =>
    fetchSocialLeaderboardStandingsMock(...args),
  peekSocialLeaderboardsCache: () => null,
}));

vi.mock("@/features/social/social-freshness-indicator", () => ({
  SocialFreshnessIndicator: () => <div data-testid="social-freshness-indicator" />,
}));

function makeSeason(): LeaderboardSeason {
  return {
    id: "season-1",
    slug: "season-1",
    title: "Season 1",
    subjectKind: "user",
    metric: "total_xp",
    metricTrackKey: null,
    startsAt: "2026-08-01T00:00:00.000Z",
    endsAt: null,
    status: "open",
    rollover: "monthly",
    scope: "global",
    groupId: null,
  };
}

function makeStandings(): LeaderboardStanding[] {
  return [];
}

describe("LeaderboardsPanel", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("keeps the Leaderboards title when no seasons are available", async () => {
    fetchSocialLeaderboardsMock.mockResolvedValueOnce({
      schemaVersion: "1",
      items: [],
    });

    render(<LeaderboardsPanel />);

    expect(await screen.findByText("Leaderboards")).toBeInTheDocument();
    expect(
      await screen.findByText(
        "Leaderboard seasons will appear once admins publish one."
      )
    ).toBeInTheDocument();
  });

  it("keeps the Leaderboards title when loading seasons fails", async () => {
    fetchSocialLeaderboardsMock.mockRejectedValueOnce(
      new Error("Leaderboards service unavailable")
    );

    render(<LeaderboardsPanel />);

    expect(await screen.findByText("Leaderboards service unavailable")).toBeInTheDocument();
    expect(screen.getByText("Leaderboards")).toBeInTheDocument();
  });

  it("shows freshness indicator with the Leaderboards heading", async () => {
    const season = makeSeason();
    fetchSocialLeaderboardsMock.mockResolvedValueOnce({
      schemaVersion: "1",
      items: [season],
    });
    fetchSocialLeaderboardStandingsMock.mockResolvedValueOnce({
      schemaVersion: "1",
      season,
      standings: makeStandings(),
      viewerRank: null,
    });

    render(<LeaderboardsPanel />);

    expect(await screen.findByRole("heading", { name: "Leaderboards" })).toBeInTheDocument();
    expect(screen.getByTestId("social-freshness-indicator")).toBeInTheDocument();
    expect(screen.getByText("Swipe between seasons")).toBeInTheDocument();
    expect(screen.getByTestId("compete-plaque")).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchSocialLeaderboardStandingsMock).toHaveBeenCalledWith("season-1");
    });
  });

  it("hides closed seasons", async () => {
    const open = makeSeason();
    const closed: LeaderboardSeason = {
      ...open,
      id: "season-closed",
      slug: "season-closed",
      title: "Finished season",
      status: "closed",
    };
    fetchSocialLeaderboardsMock.mockResolvedValueOnce({
      schemaVersion: "1",
      items: [open, closed],
    });
    fetchSocialLeaderboardStandingsMock.mockResolvedValue({
      schemaVersion: "1",
      season: open,
      standings: makeStandings(),
      viewerRank: null,
    });

    render(<LeaderboardsPanel />);

    expect(await screen.findByRole("heading", { name: "Season 1" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Finished season" })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(fetchSocialLeaderboardStandingsMock).toHaveBeenCalledTimes(1);
    });
    expect(fetchSocialLeaderboardStandingsMock).toHaveBeenCalledWith("season-1");
  });
});
