import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TeamPanel } from "./team-panel";

const mocks = vi.hoisted(() => ({
  fetchSocialTeamState: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => {
    const query = {
      select: () => query,
      eq: () => query,
      order: async () => ({ data: [], error: null }),
    };
    return { from: () => query };
  },
}));

vi.mock("@/features/social/data", () => ({
  acceptSocialTeamInvite: vi.fn(),
  createSocialTeamInvite: vi.fn(),
  declineSocialTeamInvite: vi.fn(),
  dissolveSocialTeam: vi.fn(),
  fetchSocialTeamState: mocks.fetchSocialTeamState,
  peekSocialTeamStateCache: () => null,
}));

vi.mock("@/features/social/team/nudge-button", () => ({
  NudgeButton: () => <button type="button">Send nudge</button>,
}));

describe("TeamPanel", () => {
  beforeEach(() => {
    mocks.fetchSocialTeamState.mockResolvedValue({
      schemaVersion: "1",
      items: [
        {
          teamId: "team-1",
          status: "active",
          partnerId: "partner-1",
          partnerUsername: "partner",
          partnerDisplayName: "Partner",
          partnerAvatarUrl: null,
          inviteMessage: null,
          invitedAt: "2026-08-10T00:00:00.000Z",
          acceptedAt: "2026-08-12T14:30:00.000Z",
          closedAt: null,
          isIncoming: true,
          teamXp: 55,
        },
      ],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("shows accumulated team XP in the current team section", async () => {
    render(<TeamPanel />);

    expect(await screen.findByText("Team XP 55")).toBeInTheDocument();
  });

  it("does not treat missing team XP as zero", async () => {
    mocks.fetchSocialTeamState.mockResolvedValue({
      schemaVersion: "1",
      items: [
        {
          teamId: "team-1",
          status: "active",
          partnerId: "partner-1",
          partnerUsername: "partner",
          partnerDisplayName: "Partner",
          partnerAvatarUrl: null,
          inviteMessage: null,
          invitedAt: "2026-08-10T00:00:00.000Z",
          acceptedAt: "2026-08-12T14:30:00.000Z",
          closedAt: null,
          isIncoming: true,
          teamXp: null,
        },
      ],
    });
    render(<TeamPanel />);

    expect(await screen.findByText("Team XP unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Team XP 0")).not.toBeInTheDocument();
  });

  it("keeps invites and leave behind Team settings", async () => {
    const user = userEvent.setup();
    render(<TeamPanel />);

    expect(await screen.findByRole("button", { name: "Team settings" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Leave team" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Team settings" }));
    expect(screen.getByRole("button", { name: "Leave team" })).toBeInTheDocument();
    expect(
      screen.queryByText(/Invites and join codes stay here/)
    ).not.toBeInTheDocument();
  });
});
