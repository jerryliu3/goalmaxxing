import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChallengeList } from "@/features/social/challenges/challenge-list";
import type { SocialChallenge } from "@/features/social/types";
import * as timeLeftLabel from "@/lib/social/time-left-label";

const fetchSocialChallengesMock = vi.fn();
const joinSocialChallengeMock = vi.fn();
const leaveSocialChallengeMock = vi.fn();

vi.mock("@/features/social/data", () => ({
  fetchSocialChallenges: (...args: unknown[]) => fetchSocialChallengesMock(...args),
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

async function nextTick() {
  await new Promise((resolve) => setTimeout(resolve, 0));
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

  it("expands ranks on click without reloading the roster", async () => {
    const challenges = [
      makeChallenge("11111111-1111-4111-8111-111111111111", "Weekly XP Sprint"),
      makeChallenge("22222222-2222-4222-8222-222222222222", "Cohort Health Push"),
    ];
    fetchSocialChallengesMock.mockResolvedValue({
      schemaVersion: "1",
      items: challenges,
    });

    render(<ChallengeList />);
    expect(
      await screen.findByRole("heading", { name: "Weekly XP Sprint" })
    ).toBeInTheDocument();
    await nextTick();

    expect(fetchSocialChallengesMock).toHaveBeenCalledTimes(1);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Tap to open Cohort Health Push" }));
    expect(screen.getByRole("button", { name: "Collapse Cohort Health Push" })).toBeInTheDocument();
    expect(screen.getByText("250/1000")).toBeInTheDocument();
    await nextTick();

    expect(fetchSocialChallengesMock).toHaveBeenCalledTimes(1);
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
    expect(screen.queryByRole("button", { name: "Leave challenge" })).not.toBeInTheDocument();
    expect(screen.getByText("Ranked people stay hidden until you join or open this tile.")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Join challenge" }));
    await waitFor(() => {
      expect(joinSocialChallengeMock).toHaveBeenCalledWith(open.id);
    });
    await user.click(screen.getByRole("button", { name: /Tap to open Joined Sprint/ }));
    await user.click(screen.getByRole("button", { name: "Leave challenge" }));
    await waitFor(() => {
      expect(leaveSocialChallengeMock).toHaveBeenCalledWith(joined.id);
    });
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
