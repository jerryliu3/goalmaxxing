import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

vi.mock("@/features/social/group-join-card", () => ({
  GroupJoinCard: () => <div data-testid="group-join-card" />,
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

  it("does not refresh non-feed tabs on XP refresh events", async () => {
    mockSearch = "tab=challenges";
    const user = userEvent.setup();
    render(<SocialSurface />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Leaderboards" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("tab", { name: "Leaderboards" }));

    act(() => {
      requestXpRefresh({
        reason: "completion",
        desiredFactState: "present",
      });
    });

    expect(invalidateSocialFeedCache).not.toHaveBeenCalled();
    expect(invalidateSocialTabCache).not.toHaveBeenCalled();
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

  it("shows freshness indicator only for cron-backed tabs", async () => {
    mockSearch = "";
    const { rerender } = render(<SocialSurface />);
    await waitFor(() => {
      expect(screen.getByTestId("team-panel")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("social-freshness-indicator")).not.toBeInTheDocument();

    mockSearch = "tab=challenges";
    rerender(<SocialSurface />);
    await waitFor(() => {
      expect(screen.getByTestId("social-freshness-indicator")).toHaveAttribute(
        "data-source",
        "challenges"
      );
    });

    mockSearch = "tab=leaderboards";
    rerender(<SocialSurface />);
    await waitFor(() => {
      expect(screen.getByTestId("social-freshness-indicator")).toHaveAttribute(
        "data-source",
        "leaderboards"
      );
    });

    mockSearch = "tab=team";
    rerender(<SocialSurface />);
    await waitFor(() => {
      expect(screen.queryByTestId("social-freshness-indicator")).not.toBeInTheDocument();
    });
  });
});

describe("SocialSurface tab URL", () => {
  it("writes a community chip into the tab query", async () => {
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const user = userEvent.setup();
    render(<SocialSurface />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Challenges" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("tab", { name: "Challenges" }));
    expect(pushStateSpy.mock.calls.at(-1)?.[2]).toBe("/social?tab=challenges");
  });

  it("omits the team default from the query", async () => {
    mockSearch = "tab=challenges";
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const user = userEvent.setup();
    render(<SocialSurface />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Team" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("tab", { name: "Team" }));
    expect(pushStateSpy.mock.calls.at(-1)?.[2]).toBe("/social");
  });

  it("keeps other query params when switching chips", async () => {
    mockSearch = "onboarding=social.main";
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const user = userEvent.setup();
    render(<SocialSurface />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Team" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("tab", { name: "Challenges" }));
    expect(pushStateSpy.mock.calls.at(-1)?.[2]).toBe(
      "/social?onboarding=social.main&tab=challenges"
    );
  });

  it("opens the tab from the query string on refresh", async () => {
    mockSearch = "tab=leaderboards";
    render(<SocialSurface />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Leaderboards" })).toHaveAttribute(
        "data-state",
        "active"
      );
    });
  });
});

describe("SocialSurface private accounts", () => {
  it("shows disabled public tabs but never mounts their panels", async () => {
    mockSocialActivityVisible.value = false;
    render(<SocialSurface />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Team" })).toHaveAttribute("data-state", "active");
    });
    expect(screen.queryByRole("tab", { name: "Feed" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Challenges" })).toBeDisabled();
    expect(screen.getByRole("tab", { name: "Leaderboards" })).toBeDisabled();
    expect(screen.getByRole("tab", { name: "Team" })).not.toBeDisabled();
    expect(screen.queryByTestId("feed-list")).not.toBeInTheDocument();
    expect(screen.queryByTestId("challenge-list")).not.toBeInTheDocument();
    expect(screen.queryByTestId("leaderboards-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("team-panel")).toBeInTheDocument();
  });

  it("rewrites leftover feed links to Team", async () => {
    mockSearch = "tab=feed";
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    render(<SocialSurface />);

    await waitFor(() => {
      expect(replaceStateSpy.mock.calls.at(-1)?.[2]).toBe("/social");
    });
    expect(screen.queryByTestId("feed-list")).not.toBeInTheDocument();
    expect(screen.getByTestId("team-panel")).toBeInTheDocument();
  });

  it("rewrites public community tab links to Team", async () => {
    mockSocialActivityVisible.value = false;
    mockSearch = "tab=challenges";
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    render(<SocialSurface />);

    await waitFor(() => {
      expect(replaceStateSpy.mock.calls.at(-1)?.[2]).toBe("/social?tab=team");
    });
  });
});
