import { cleanup, render, screen, within } from "@testing-library/react";
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
    expect(within(card).getAllByText("Jerry").length).toBeGreaterThan(0);
    expect(within(card).getByText("4")).toBeInTheDocument();
    expect(within(card).getByText("goals completed")).toBeInTheDocument();
    expect(within(card).getByText("20")).toBeInTheDocument();
    expect(within(card).getByText("activities")).toBeInTheDocument();
    expect(within(card).getByText("3")).toBeInTheDocument();
    expect(within(card).getByText("day streak")).toBeInTheDocument();
    expect(within(card).getByText("LEVEL 18")).toBeInTheDocument();
    expect(within(card).getByText(/JANUARY 2026/)).toBeInTheDocument();
  });

  it("hides the card for private profiles and missing stats", () => {
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
    expect(screen.queryByRole("article", { name: "Jerry membership card" })).toBeNull();
  });
});
