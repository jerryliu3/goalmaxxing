import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChallengeList } from "@/features/social/challenges/challenge-list";
import type { SocialChallenge } from "@/features/social/types";
import * as timeLeftLabel from "@/lib/social/time-left-label";

const fetchSocialChallengesMock = vi.fn();
const fetchSocialChallengeStandingsMock = vi.fn();
const joinSocialChallengeMock = vi.fn();
const leaveSocialChallengeMock = vi.fn();

vi.mock("@/features/social/data", () => ({
  fetchSocialChallenges: (...args: unknown[]) => fetchSocialChallengesMock(...args),
  fetchSocialChallengeStandings: (...args: unknown[]) =>
    fetchSocialChallengeStandingsMock(...args),
  joinSocialChallenge: (...args: unknown[]) => joinSocialChallengeMock(...args),
  leaveSocialChallenge: (...args: unknown[]) => leaveSocialChallengeMock(...args),
  peekSocialChallengesCache: () => null,
}));

vi.mock("@/features/social/social-freshness-indicator", () => ({
  SocialFreshnessIndicator: () => <div data-testid="social-freshness-indicator" />,
}));

const DAY_MS = 24 * 60 * 60 * 1000;

function makeChallenge(
  id: string,
  title: string,
  overrides: Partial<SocialChallenge> = {}
): SocialChallenge {
  return {
    id,
    slug: title.toLowerCase().replaceAll(" ", "-"),
    title,
    description: `${title} description`,
    status: "active",
    subjectKind: "user",
    metric: "total_xp",
    metricTrackKey: null,
    targetValue: 1000,
    startsAt: new Date(Date.now() - DAY_MS).toISOString(),
    endsAt: new Date(Date.now() + 7 * DAY_MS).toISOString(),
    rewardXp: 100,
    maxParticipants: null,
    participantCount: 10,
    viewerJoined: true,
    viewerProgress: 250,
    viewerCompletedAt: null,
    viewerAwardedAt: null,
    audienceKind: "global",
    groupId: null,
    ...overrides,
  };
}

describe("ChallengeList", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows a time-left badge when a challenge is ending soon", async () => {
    vi.spyOn(timeLeftLabel, "formatTimeLeftLabel").mockReturnValue("1 day left");
    fetchSocialChallengesMock.mockResolvedValue({
      schemaVersion: "1",
      items: [
        makeChallenge("11111111-1111-4111-8111-111111111111", "Weekly XP Sprint"),
      ],
    });

    render(<ChallengeList />);
    expect(await screen.findByText("1 day left")).toBeInTheDocument();
  });

  it("reads out progress for targets too large to number", async () => {
    fetchSocialChallengesMock.mockResolvedValue({
      schemaVersion: "1",
      items: [
        makeChallenge("11111111-1111-4111-8111-111111111111", "Weekly XP Sprint"),
      ],
    });

    render(<ChallengeList />);
    expect(
      await screen.findByRole("heading", { name: "Weekly XP Sprint" })
    ).toBeInTheDocument();

    expect(screen.getByText("Your progress")).toBeInTheDocument();
    expect(screen.getByText("750 XP to go")).toBeInTheDocument();
    expect(screen.getByText("100 XP reward")).toBeInTheDocument();
  });

  it("numbers each requirement mark for countable targets", async () => {
    fetchSocialChallengesMock.mockResolvedValue({
      schemaVersion: "1",
      items: [
        makeChallenge("11111111-1111-4111-8111-111111111111", "Ten Sessions", {
          description: null,
          metric: "completions_count",
          targetValue: 10,
          viewerJoined: false,
          viewerProgress: null,
        }),
      ],
    });

    render(<ChallengeList />);
    expect(
      await screen.findByRole("heading", { name: "Ten Sessions" })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Complete 10 sessions before this challenge ends.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "0 of 10 sessions complete" })
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("requirement-mark")).toHaveLength(10);
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("flips a joined challenge from progress to ranked participants", async () => {
    const challenge = makeChallenge(
      "11111111-1111-4111-8111-111111111111",
      "Ten Sessions",
      {
        metric: "completions_count",
        targetValue: 10,
        viewerJoined: true,
        viewerProgress: 5,
      }
    );
    fetchSocialChallengesMock.mockResolvedValue({
      schemaVersion: "1",
      items: [challenge],
    });
    fetchSocialChallengeStandingsMock.mockResolvedValue({
      schemaVersion: "1",
      totalCount: 2,
      standings: [
        {
          challengeId: challenge.id,
          subjectKind: "user",
          subjectId: "user-2",
          displayName: "Avery",
          avatarUrl: null,
          score: 8,
          rank: 1,
          isViewer: false,
        },
        {
          challengeId: challenge.id,
          subjectKind: "user",
          subjectId: "viewer-1",
          displayName: "Alice",
          avatarUrl: null,
          score: 5,
          rank: 2,
          isViewer: true,
        },
      ],
    });

    render(<ChallengeList />);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", {
        name: "Show rankings for Ten Sessions",
      })
    );

    expect(fetchSocialChallengeStandingsMock).toHaveBeenCalledWith(
      challenge.id,
      { limit: 50, offset: 0 }
    );
    expect(await screen.findByText("Challenge standings")).toBeInTheDocument();
    expect(screen.getByText("Avery")).toBeInTheDocument();
    expect(screen.getByText("Alice · you")).toBeInTheDocument();
    expect(screen.queryByText("Your progress")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Show progress for Ten Sessions" })
    );
    expect(screen.getByText("Your progress")).toBeInTheDocument();
  });

  it("loads later standings pages from the expanded card", async () => {
    const challenge = makeChallenge(
      "11111111-1111-4111-8111-111111111111",
      "Ten Sessions",
      {
        metric: "completions_count",
        targetValue: 10,
        viewerJoined: true,
      }
    );
    fetchSocialChallengesMock.mockResolvedValue({
      schemaVersion: "1",
      items: [challenge],
    });
    fetchSocialChallengeStandingsMock
      .mockResolvedValueOnce({
        schemaVersion: "1",
        totalCount: 2,
        standings: [
          {
            challengeId: challenge.id,
            subjectKind: "user",
            subjectId: "user-1",
            displayName: "Avery",
            avatarUrl: null,
            score: 8,
            rank: 1,
            isViewer: false,
          },
        ],
      })
      .mockResolvedValueOnce({
        schemaVersion: "1",
        totalCount: 2,
        standings: [
          {
            challengeId: challenge.id,
            subjectKind: "user",
            subjectId: "viewer-1",
            displayName: "Alice",
            avatarUrl: null,
            score: 5,
            rank: 2,
            isViewer: true,
          },
        ],
      });

    render(<ChallengeList />);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", {
        name: "Show rankings for Ten Sessions",
      })
    );
    await user.click(
      await screen.findByRole("button", { name: "Show more participants" })
    );

    expect(fetchSocialChallengeStandingsMock).toHaveBeenLastCalledWith(
      challenge.id,
      { limit: 50, offset: 1 }
    );
    expect(await screen.findByText("Alice · you")).toBeInTheDocument();
  });

  it("joins and leaves from the tile foot", async () => {
    const open = makeChallenge(
      "11111111-1111-4111-8111-111111111111",
      "Open Sprint",
      { viewerJoined: false }
    );
    const joined = makeChallenge(
      "22222222-2222-4222-8222-222222222222",
      "Joined Sprint",
      { viewerJoined: true }
    );
    fetchSocialChallengesMock.mockResolvedValue({
      schemaVersion: "1",
      items: [open, joined],
    });
    joinSocialChallengeMock.mockResolvedValue({ schemaVersion: "1", joined: true });
    leaveSocialChallengeMock.mockResolvedValue({ schemaVersion: "1", joined: false });

    render(<ChallengeList />);
    expect(await screen.findByRole("button", { name: "Join challenge" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Leave challenge" })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Join challenge" }));
    await waitFor(() => {
      expect(joinSocialChallengeMock).toHaveBeenCalledWith(open.id);
    });
    await user.click(screen.getByRole("button", { name: "Leave challenge" }));
    await waitFor(() => {
      expect(leaveSocialChallengeMock).toHaveBeenCalledWith(joined.id);
    });
  });

  it("surfaces a leave failure on the challenge that failed", async () => {
    fetchSocialChallengesMock.mockResolvedValue({
      schemaVersion: "1",
      items: [
        makeChallenge("22222222-2222-4222-8222-222222222222", "Joined Sprint"),
      ],
    });
    leaveSocialChallengeMock.mockRejectedValueOnce(
      new Error("Challenge leave failed.")
    );

    render(<ChallengeList />);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Leave challenge" })
    );

    expect(await screen.findByText("Challenge leave failed.")).toBeInTheDocument();
  });

  it("keeps the Challenges title when the roster fails to load", async () => {
    fetchSocialChallengesMock.mockRejectedValueOnce(new Error("Challenges service unavailable"));

    render(<ChallengeList />);

    expect(await screen.findByText("Challenges service unavailable")).toBeInTheDocument();
    expect(screen.getByText("Challenges")).toBeInTheDocument();
  });

  it("keeps the Challenges title when no active challenges exist", async () => {
    fetchSocialChallengesMock.mockResolvedValueOnce({
      schemaVersion: "1",
      items: [],
    });

    render(<ChallengeList />);

    expect(
      await screen.findByText("New challenges will appear here when published.")
    ).toBeInTheDocument();
    expect(screen.getByText("Challenges")).toBeInTheDocument();
  });

  it("hides the empty roster when hideWhenEmpty is set", async () => {
    fetchSocialChallengesMock.mockResolvedValueOnce({
      schemaVersion: "1",
      items: [],
    });

    render(<ChallengeList hideWhenEmpty />);

    await waitFor(() => {
      expect(fetchSocialChallengesMock).toHaveBeenCalled();
    });
    expect(screen.queryByText("Challenges")).not.toBeInTheDocument();
    expect(
      screen.queryByText("New challenges will appear here when published.")
    ).not.toBeInTheDocument();
  });

  it("hides closed and archived challenges", async () => {
    fetchSocialChallengesMock.mockResolvedValue({
      schemaVersion: "1",
      items: [
        makeChallenge("11111111-1111-4111-8111-111111111111", "Closed Sprint", {
          status: "closed",
        }),
        makeChallenge("22222222-2222-4222-8222-222222222222", "Live Sprint"),
      ],
    });

    render(<ChallengeList />);
    expect(await screen.findByRole("heading", { name: "Live Sprint" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Closed Sprint" })).not.toBeInTheDocument();
  });

  it("hides challenges whose window has elapsed but whose status has not caught up", async () => {
    fetchSocialChallengesMock.mockResolvedValue({
      schemaVersion: "1",
      items: [
        makeChallenge("11111111-1111-4111-8111-111111111111", "Elapsed Sprint", {
          status: "active",
          endsAt: new Date(Date.now() - DAY_MS).toISOString(),
        }),
        makeChallenge("22222222-2222-4222-8222-222222222222", "Live Sprint"),
      ],
    });

    render(<ChallengeList />);
    expect(await screen.findByRole("heading", { name: "Live Sprint" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Elapsed Sprint" })
    ).not.toBeInTheDocument();
  });
});
