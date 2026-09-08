import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockSocialActivityVisible = vi.hoisted(() => ({ value: true as boolean }));
import {
  invalidateSocialFeedCache,
  invalidateSocialTabCache,
} from "@/features/social/data";
import { SocialSurface } from "@/features/social/social-surface";
import { requestXpRefresh } from "@/lib/xp/events";

let mockSearch = "";

vi.mock("next/navigation", () => ({
  usePathname: () => "/social",
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

vi.mock("@/features/social/data", () => ({
  invalidateSocialFeedCache: vi.fn(),
  invalidateSocialTabCache: vi.fn(),
}));

vi.mock("@/features/social/challenges/challenge-list", () => ({
  ChallengeList: ({ refreshToken }: { refreshToken?: number }) => (
    <div
      data-testid="challenge-list"
      data-refresh-token={String(refreshToken)}
    >
      <div data-testid="social-freshness-indicator" data-source="challenges" />
    </div>
  ),
}));

vi.mock("@/features/social/leaderboards/leaderboards-panel", () => ({
  LeaderboardsPanel: ({ refreshToken }: { refreshToken?: number }) => (
    <div
      data-testid="leaderboards-panel"
      data-refresh-token={String(refreshToken)}
    >
      <div data-testid="social-freshness-indicator" data-source="leaderboards" />
    </div>
  ),
}));

vi.mock("@/features/social/team/team-panel", () => ({
  TeamPanel: ({ refreshToken }: { refreshToken?: number }) => (
    <div
      data-testid="team-panel"
      data-refresh-token={String(refreshToken)}
    />
  ),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: () =>
        Promise.resolve({ data: { user: { id: "user-1" } }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { social_activity_visible: mockSocialActivityVisible.value },
              error: null,
            }),
        }),
      }),
    }),
  }),
}));

afterEach(() => {
  cleanup();
  mockSearch = "";
  mockSocialActivityVisible.value = true;
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("SocialSurface refresh behavior", () => {
  async function expectTeamRefreshToken(token: string) {
    await waitFor(
      () => {
        expect(screen.getByTestId("team-panel")).toHaveAttribute(
          "data-refresh-token",
          token
        );
      },
      { timeout: 5000 }
    );
  }

  it("does not wipe social cache on enter", async () => {
    render(<SocialSurface />);

    await waitFor(() => {
      expect(screen.getByTestId("team-panel")).toBeInTheDocument();
    });
    expect(invalidateSocialTabCache).not.toHaveBeenCalled();
    expect(screen.queryByTestId("feed-list")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Feed" })).not.toBeInTheDocument();
  });

  it("does not refresh community tabs on XP refresh events", async () => {
    render(<SocialSurface />);

    await expectTeamRefreshToken("0");

    act(() => {
      requestXpRefresh({
        reason: "completion",
        desiredFactState: "present",
      });
    });

    expect(invalidateSocialFeedCache).not.toHaveBeenCalled();
    expect(invalidateSocialTabCache).not.toHaveBeenCalled();
    expect(screen.getByTestId("team-panel")).toHaveAttribute(
      "data-refresh-token",
      "0"
    );
  });

  it("renders team, challenges, and leaderboards on one page", async () => {
    render(<SocialSurface />);

    await waitFor(() => {
      expect(screen.getByTestId("team-panel")).toBeInTheDocument();
    });
    expect(screen.getByTestId("challenge-list")).toBeInTheDocument();
    expect(screen.getByTestId("leaderboards-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("group-join-card")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Team" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Challenges" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Leaderboards" })).not.toBeInTheDocument();

    const page = screen.getByTestId("team-panel").closest(".flex");
    const sections = page?.querySelectorAll("section") ?? [];
    expect(sections[0]).toContainElement(screen.getByTestId("leaderboards-panel"));
    expect(sections[1]).toContainElement(screen.getByTestId("challenge-list"));
    expect(sections[2]).toContainElement(screen.getByTestId("team-panel"));
  });

  it("refreshes once when window focus returns within cooldown window", async () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    render(<SocialSurface />);

    await expectTeamRefreshToken("0");
    expect(invalidateSocialTabCache).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    await expectTeamRefreshToken("1");
    expect(invalidateSocialTabCache).toHaveBeenCalledTimes(1);

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    await waitFor(() => {
      expect(invalidateSocialTabCache).toHaveBeenCalledTimes(1);
    });
  });

  it("polls once per minute while the document is visible", async () => {
    vi.useFakeTimers();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    render(<SocialSurface />);
    expect(vi.mocked(invalidateSocialTabCache).mock.calls.length).toBe(0);

    act(() => {
      vi.advanceTimersByTime(60 * 1000);
    });

    expect(invalidateSocialTabCache).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    act(() => {
      vi.advanceTimersByTime(60 * 1000);
    });

    expect(invalidateSocialTabCache).toHaveBeenCalledTimes(1);
  });

  it("shows cron freshness on leaderboards and challenges", async () => {
    render(<SocialSurface />);
    await waitFor(() => {
      expect(screen.getByTestId("leaderboards-panel")).toBeInTheDocument();
    });
    expect(
      screen.getAllByTestId("social-freshness-indicator").map((node) =>
        node.getAttribute("data-source")
      )
    ).toEqual(["leaderboards", "challenges"]);
  });
});

describe("SocialSurface leftover tab query", () => {
  it("strips leftover community tab query params", async () => {
    mockSearch = "tab=challenges";
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    render(<SocialSurface />);

    await waitFor(() => {
      expect(replaceStateSpy.mock.calls.at(-1)?.[2]).toBe("/social");
    });
  });

  it("keeps other query params when stripping leftover tabs", async () => {
    mockSearch = "onboarding=social.main&tab=leaderboards";
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    render(<SocialSurface />);

    await waitFor(() => {
      expect(replaceStateSpy.mock.calls.at(-1)?.[2]).toBe(
        "/social?onboarding=social.main"
      );
    });
  });
});

describe("SocialSurface private accounts", () => {
  it("shows team only and never mounts public community panels", async () => {
    mockSocialActivityVisible.value = false;
    render(<SocialSurface />);

    await waitFor(() => {
      expect(screen.getByTestId("team-panel")).toBeInTheDocument();
      expect(screen.queryByTestId("leaderboards-panel")).not.toBeInTheDocument();
    });
    expect(screen.queryByTestId("feed-list")).not.toBeInTheDocument();
    expect(screen.queryByTestId("challenge-list")).not.toBeInTheDocument();
    expect(screen.queryByTestId("leaderboards-panel")).not.toBeInTheDocument();
  });

  it("rewrites leftover feed links to the single community page", async () => {
    mockSearch = "tab=feed";
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    render(<SocialSurface />);

    await waitFor(() => {
      expect(replaceStateSpy.mock.calls.at(-1)?.[2]).toBe("/social");
    });
    expect(screen.queryByTestId("feed-list")).not.toBeInTheDocument();
    expect(screen.getByTestId("team-panel")).toBeInTheDocument();
  });

  it("rewrites public community tab links away on private accounts", async () => {
    mockSocialActivityVisible.value = false;
    mockSearch = "tab=challenges";
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    render(<SocialSurface />);

    await waitFor(() => {
      expect(replaceStateSpy.mock.calls.at(-1)?.[2]).toBe("/social");
    });
  });
});
