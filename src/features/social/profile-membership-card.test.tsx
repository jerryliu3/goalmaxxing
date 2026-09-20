import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfileMembershipCard } from "@/features/social/profile-membership-card";
import type { PublicProfileIdentity, PublicProfileOverallStats } from "@cadence/shared/social/public-profile";

vi.mock("@/features/ux-brand/card-materials/material-stage", () => ({
  MaterialStage: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

afterEach(cleanup);

const profile: PublicProfileIdentity = {
  subjectUserId: "subject-1",
  username: "jerry",
  displayName: "Jerry",
  avatarUrl: null,
  isPrivate: false,
  createdAt: "2026-01-02T00:00:00.000Z",
};

const stats: PublicProfileOverallStats = {
  totalActivities: 20,
  totalGoalsCompleted: 4,
  todayActivities: 1,
  activeStreakDays: 3,
  currentWeekActivities: { current: 7, previous: 5, delta: 2, deltaPercent: 40 },
  currentMonthActivities: { current: 15, previous: 12, delta: 3, deltaPercent: 25 },
};

describe("ProfileMembershipCard", () => {
  it("renders Pearl Reserve stats from the public profile bundle", () => {
    render(
      <ProfileMembershipCard profile={profile} overallStats={stats} currentLevel={18} />
    );

    const card = screen.getByRole("article", { name: "Jerry membership card" });
    expect(card.closest(".tempo-card-frame")).not.toBeNull();
    expect(within(card).getByText("4")).toBeInTheDocument();
    expect(within(card).getByText("goals completed")).toBeInTheDocument();
    expect(within(card).getByText("20")).toBeInTheDocument();
    expect(within(card).getByText("activities")).toBeInTheDocument();
    expect(within(card).getByText("18")).toBeInTheDocument();
    expect(within(card).getByText("level")).toBeInTheDocument();
    expect(within(card).getByText("MEMBER SINCE JANUARY 2026")).toBeInTheDocument();
    expect(within(card).queryByText("PEARL RESERVE")).toBeNull();
    expect(within(card).queryByText("day streak")).toBeNull();
    expect(within(card).getAllByText("Jerry")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Change profile photo" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit username" })).toBeNull();
    expect(screen.queryByLabelText("username")).toBeNull();
  });

  it("hides the card for private profiles without an editor", () => {
    const { rerender } = render(
      <ProfileMembershipCard
        profile={{ ...profile, isPrivate: true }}
        overallStats={stats}
        currentLevel={18}
      />
    );
    expect(screen.queryByRole("article", { name: "Jerry membership card" })).toBeNull();

    rerender(
      <ProfileMembershipCard profile={profile} overallStats={null} currentLevel={18} />
    );
    expect(screen.getByRole("article", { name: "Jerry membership card" })).toBeInTheDocument();
  });

  it("puts identity fields on the card and edits them in place", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => undefined);
    const onUploadAvatar = vi.fn(async () => undefined);
    const onRemoveAvatar = vi.fn();

    render(
      <ProfileMembershipCard
        profile={{ ...profile, isPrivate: true }}
        overallStats={stats}
        currentLevel={18}
        editor={{
          username: "jerry",
          displayName: "Jerry",
          email: "jerry@example.com",
          avatarUrl: "",
          saving: false,
          canSave: true,
          onUsernameChange: vi.fn(),
          onDisplayNameChange: vi.fn(),
          onSave,
          onUploadAvatar,
          onRemoveAvatar,
        }}
      />
    );

    expect(screen.queryByLabelText("username")).toBeNull();
    expect(screen.queryByLabelText("display name")).toBeNull();
    expect(screen.getByText("jerry@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit username" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit display name" }));
    expect(screen.getByLabelText("display name")).toHaveValue("Jerry");
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "SAVE" }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("opens a photo dialog with upload and remove actions", async () => {
    const user = userEvent.setup();
    const onUploadAvatar = vi.fn(async () => undefined);
    const onRemoveAvatar = vi.fn();

    render(
      <ProfileMembershipCard
        profile={profile}
        overallStats={stats}
        currentLevel={18}
        editor={{
          username: "jerry",
          displayName: "Jerry",
          email: "jerry@example.com",
          avatarUrl: "https://example.com/avatar.jpg",
          saving: false,
          canSave: false,
          onUsernameChange: vi.fn(),
          onDisplayNameChange: vi.fn(),
          onSave: vi.fn(async () => undefined),
          onUploadAvatar,
          onRemoveAvatar,
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: "Change profile photo" }));
    expect(screen.getByRole("dialog", { name: "Profile photo" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove photo" }));
    expect(onRemoveAvatar).toHaveBeenCalledTimes(1);

    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    await user.upload(
      document.querySelector('input[type="file"]') as HTMLInputElement,
      file
    );
    expect(onUploadAvatar).toHaveBeenCalledTimes(1);
  });
});
