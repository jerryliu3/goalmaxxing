import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicProfileSheet } from "@/features/social/public-profile/public-profile-sheet";

const mocks = vi.hoisted(() => ({
  fetchPublicProfileBundle: vi.fn(),
}));

vi.mock("@/features/social/public-profile/data", () => ({
  fetchPublicProfileBundle: mocks.fetchPublicProfileBundle,
}));

vi.mock("@/features/goals/goal-route-sheet", () => ({
  GoalRouteSheet: ({
    children,
    title,
  }: {
    children: ReactNode;
    title: string;
  }) => (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

vi.mock("@/features/social/public-profile/public-profile-content", () => ({
  PublicProfileContent: ({
    bundle,
    headerActions,
  }: {
    bundle: { profile: { isPrivate: boolean } };
    headerActions?: ReactNode;
  }) => (
    <div>
      {headerActions}
      {bundle.profile.isPrivate ? (
        <p>This account is private</p>
      ) : (
        <div>public-profile-content</div>
      )}
    </div>
  ),
}));

describe("PublicProfileSheet", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows private account copy when profile is private", async () => {
    mocks.fetchPublicProfileBundle.mockResolvedValue({
      schemaVersion: "1",
      profile: {
        subjectUserId: "11111111-1111-4111-8111-111111111111",
        username: "hidden-user",
        displayName: "Hidden User",
        avatarUrl: null,
        isPrivate: true,
      },
      xp: null,
      globalAchievements: [],
      awardCatalogCount: 0,
      overallStats: null,
      yearHeatmap: [],
    });

    render(
      <PublicProfileSheet
        subjectUserId="11111111-1111-4111-8111-111111111111"
        onClose={vi.fn()}
      />
    );

    expect(await screen.findByText("This account is private")).toBeInTheDocument();
    expect(screen.queryByText("public-profile-content")).not.toBeInTheDocument();
  });

  it("renders profile content for public accounts", async () => {
    mocks.fetchPublicProfileBundle.mockResolvedValue({
      schemaVersion: "1",
      profile: {
        subjectUserId: "22222222-2222-4222-8222-222222222222",
        username: "visible-user",
        displayName: "Visible User",
        avatarUrl: null,
        isPrivate: false,
      },
      xp: {
        totalXp: 1200,
        currentLevel: 5,
        currentLevelMinXp: 1000,
        nextLevel: 6,
        nextLevelMinXp: 1500,
        xpToNextLevel: 300,
      },
      globalAchievements: [],
      awardCatalogCount: 0,
      overallStats: {
        totalActivities: 20,
        totalGoalsCompleted: 4,
        todayActivities: 1,
        activeStreakDays: 3,
        currentWeekActivities: {
          current: 7,
          previous: 5,
          delta: 2,
          deltaPercent: 40,
        },
        currentMonthActivities: {
          current: 15,
          previous: 12,
          delta: 3,
          deltaPercent: 25,
        },
      },
      yearHeatmap: [{ date: "2026-01-01", count: 1 }],
    });

    render(
      <PublicProfileSheet
        subjectUserId="22222222-2222-4222-8222-222222222222"
        onClose={vi.fn()}
      />
    );

    expect(await screen.findByText("public-profile-content")).toBeInTheDocument();
  });

  it("shows copy link for the signed-in subject", async () => {
    mocks.fetchPublicProfileBundle.mockResolvedValue({
      schemaVersion: "1",
      profile: {
        subjectUserId: "22222222-2222-4222-8222-222222222222",
        username: "visible-user",
        displayName: "Visible User",
        avatarUrl: null,
        isPrivate: false,
      },
      xp: null,
      globalAchievements: [],
      awardCatalogCount: 0,
      overallStats: null,
      yearHeatmap: [],
    });

    render(
      <PublicProfileSheet
        subjectUserId="22222222-2222-4222-8222-222222222222"
        viewerUserId="22222222-2222-4222-8222-222222222222"
        onClose={vi.fn()}
      />
    );

    expect(await screen.findByRole("button", { name: /copy link/i })).toBeInTheDocument();
  });
});
