import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
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

vi.mock("@/features/social/feed/feed-list", () => ({
  FeedList: ({
    isActive,
    refreshToken,
  }: {
    isActive?: boolean;
    refreshToken?: number;
  }) => (
    <div
      data-testid="feed-list"
      data-is-active={String(isActive)}
      data-refresh-token={String(refreshToken)}
    />
  ),
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
  TeamPanel: () => <div data-testid="team-panel" />,
}));

vi.mock("@/features/social/group-join-card", () => ({
  GroupJoinCard: () => <div data-testid="group-join-card" />,
}));

afterEach(() => {
  cleanup();
  mockSearch = "";
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("SocialSurface refresh behavior", () => {
  it("refreshes feed tab when an XP refresh event is requested", async () => {
    render(<SocialSurface />);

    await waitFor(() => {
      expect(screen.getByTestId("feed-list")).toHaveAttribute("data-refresh-token", "1");
    });
    expect(invalidateSocialTabCache).toHaveBeenCalledTimes(1);
    const globalRefreshCount = vi.mocked(invalidateSocialTabCache).mock.calls.length;

    act(() => {
      requestXpRefresh({
        reason: "completion",
        desiredFactState: "present",
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("feed-list")).toHaveAttribute("data-refresh-token", "2");
    });
    expect(invalidateSocialFeedCache).toHaveBeenCalledTimes(1);
    expect(invalidateSocialTabCache).toHaveBeenCalledTimes(globalRefreshCount);
  });

  it("does not refresh non-feed tabs on XP refresh events", async () => {
    mockSearch = "tab=challenges";
    const user = userEvent.setup();
    render(<SocialSurface />);

    await waitFor(() => {
      expect(invalidateSocialTabCache).toHaveBeenCalledTimes(1);
    });
    const globalRefreshCount = vi.mocked(invalidateSocialTabCache).mock.calls.length;

    await user.click(screen.getByRole("tab", { name: "Leaderboards" }));

    act(() => {
      requestXpRefresh({
        reason: "completion",
        desiredFactState: "present",
      });
    });

    expect(invalidateSocialFeedCache).not.toHaveBeenCalled();
    expect(invalidateSocialTabCache).toHaveBeenCalledTimes(globalRefreshCount);
  });

  it("refreshes once when window focus returns within cooldown window", async () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    render(<SocialSurface />);

    await waitFor(() => {
      expect(screen.getByTestId("feed-list")).toHaveAttribute("data-refresh-token", "1");
    });
    expect(invalidateSocialTabCache).toHaveBeenCalledTimes(1);

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("feed-list")).toHaveAttribute("data-refresh-token", "2");
    });
    expect(invalidateSocialTabCache).toHaveBeenCalledTimes(2);

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    await waitFor(() => {
      expect(invalidateSocialTabCache).toHaveBeenCalledTimes(2);
    });
  });

  it("polls once per minute while the document is visible", async () => {
    vi.useFakeTimers();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    render(<SocialSurface />);

    act(() => {
      vi.runOnlyPendingTimers();
    });
    const initialRefreshCount = vi.mocked(invalidateSocialTabCache).mock.calls.length;
    expect(initialRefreshCount).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(60 * 1000);
    });

    expect(invalidateSocialTabCache).toHaveBeenCalledTimes(initialRefreshCount + 1);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    act(() => {
      vi.advanceTimersByTime(60 * 1000);
    });

    expect(invalidateSocialTabCache).toHaveBeenCalledTimes(initialRefreshCount + 1);
  });

  it("shows freshness indicator only for cron-backed tabs", () => {
    mockSearch = "";
    const { rerender } = render(<SocialSurface />);
    expect(screen.queryByTestId("social-freshness-indicator")).not.toBeInTheDocument();

    mockSearch = "tab=challenges";
    rerender(<SocialSurface />);
    expect(screen.getByTestId("social-freshness-indicator")).toHaveAttribute(
      "data-source",
      "challenges"
    );

    mockSearch = "tab=leaderboards";
    rerender(<SocialSurface />);
    expect(screen.getByTestId("social-freshness-indicator")).toHaveAttribute(
      "data-source",
      "leaderboards"
    );

    mockSearch = "tab=team";
    rerender(<SocialSurface />);
    expect(screen.queryByTestId("social-freshness-indicator")).not.toBeInTheDocument();
  });
});

describe("SocialSurface tab URL", () => {
  it("writes a community chip into the tab query", async () => {
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const user = userEvent.setup();
    render(<SocialSurface />);

    await user.click(screen.getByRole("tab", { name: "Challenges" }));
    expect(pushStateSpy.mock.calls.at(-1)?.[2]).toBe("/social?tab=challenges");
  });

  it("omits the feed default from the query", async () => {
    mockSearch = "tab=challenges";
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const user = userEvent.setup();
    render(<SocialSurface />);

    await user.click(screen.getByRole("tab", { name: "Feed" }));
    expect(pushStateSpy.mock.calls.at(-1)?.[2]).toBe("/social");
  });

  it("keeps other query params when switching chips", async () => {
    mockSearch = "onboarding=social.main";
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const user = userEvent.setup();
    render(<SocialSurface />);

    await user.click(screen.getByRole("tab", { name: "Team" }));
    expect(pushStateSpy.mock.calls.at(-1)?.[2]).toBe(
      "/social?onboarding=social.main&tab=team"
    );
  });

  it("opens the tab from the query string on refresh", () => {
    mockSearch = "tab=leaderboards";
    render(<SocialSurface />);

    expect(screen.getByRole("tab", { name: "Leaderboards" })).toHaveAttribute(
      "data-state",
      "active"
    );
  });
});
