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
  memberNumber: 146,
};

const stats: PublicProfileOverallStats = {
  totalActivities: 20,
  totalGoalsCompleted: 4,
  todayActivities: 1,
  activeStreakWeeks: 3,
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
    expect(within(card).getByText("NO. 00146")).toBeInTheDocument();
    expect(within(card).queryByText("PEARL RESERVE")).toBeNull();
    expect(within(card).queryByText("week streak")).toBeNull();
    expect(within(card).getAllByText("Jerry")).toHaveLength(1);
    expect(within(card).getAllByText("@jerry")).toHaveLength(1);
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

  it("shows the bio and pinned records on the card instead of stats", () => {
    render(
      <ProfileMembershipCard
        profile={profile}
        overallStats={stats}
        currentLevel={18}
        bio="Running toward a spring half."
        records={[
          { kind: "record", ref: "rec-streak", label: "Best streak", value: "12d", hint: "" },
          { kind: "record", ref: "rec-goals", label: "Goals finished", value: "4", hint: "" },
        ]}
      />
    );

    const card = screen.getByRole("article", { name: "Jerry membership card" });
    expect(within(card).getByText("Running toward a spring half.")).toBeInTheDocument();
    expect(within(card).getByText("12d")).toBeInTheDocument();
    expect(within(card).getByText("Best streak")).toBeInTheDocument();
    expect(within(card).getByText("Goals finished")).toBeInTheDocument();
    expect(within(card).queryByText("activities")).toBeNull();
    expect(screen.queryByRole("button", { name: "Choose records" })).toBeNull();
  });

  it("lets the owner edit the bio and choose records from the card", async () => {
    const user = userEvent.setup();
    const onBioChange = vi.fn();
    const onEditRecords = vi.fn();

    render(
      <ProfileMembershipCard
        profile={profile}
        overallStats={null}
        currentLevel={18}
        bio=""
        records={[]}
        editor={{
          username: "jerry",
          displayName: "Jerry",
          avatarUrl: "",
          saving: false,
          canSave: false,
          onUsernameChange: vi.fn(),
          onDisplayNameChange: vi.fn(),
          onSave: vi.fn(async () => undefined),
          onUploadAvatar: vi.fn(async () => undefined),
          onRemoveAvatar: vi.fn(),
          onBioChange,
          onEditRecords,
        }}
      />
    );

    expect(screen.getAllByText("Add a record")).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: "Choose records" }));
    expect(onEditRecords).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Edit bio" }));
    await user.type(screen.getByLabelText("bio"), "H");
    expect(onBioChange).toHaveBeenCalledWith("H");
  });

  it("keeps the photo inside the horizon rings", () => {
    render(
      <ProfileMembershipCard
        profile={{ ...profile, avatarUrl: "https://example.com/alice.jpg" }}
        overallStats={stats}
        currentLevel={18}
      />
    );

    const frame = document.querySelector("[data-horizon-frame]");
    const portrait = document.querySelector("[data-portrait]");
    expect(frame).not.toBeNull();
    expect(portrait).not.toBeNull();
    expect(frame).toContainElement(portrait as HTMLElement);
    expect(portrait?.querySelector("img")).toHaveAttribute(
      "src",
      "https://example.com/alice.jpg"
    );
  });
});
