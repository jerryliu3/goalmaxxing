import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicProfileContent } from "@/features/social/public-profile/public-profile-content";
import type { PublicProfileBundle } from "@cadence/shared/social/public-profile";

vi.mock("@/features/insights/grow-score-trend-chart", () => ({
  GrowScoreTrendChart: ({ title }: { title: string }) => <h3>{title}</h3>,
}));

vi.mock("@/components/xp/xp-progress-card", () => ({
  XpProgressCard: () => <p>XP progress</p>,
}));

afterEach(cleanup);

function publicBundle(overrides: Partial<PublicProfileBundle> = {}): PublicProfileBundle {
  return {
    schemaVersion: "1",
    profile: {
      subjectUserId: "subject-1",
      username: "jerry",
      displayName: "Jerry",
      avatarUrl: null,
      isPrivate: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    xp: {
      totalXp: 16350,
      currentLevel: 18,
      currentLevelMinXp: 16000,
      nextLevel: 19,
      nextLevelMinXp: 18000,
      xpToNextLevel: 1650,
    },
    globalAchievements: [],
    awardCatalogCount: 5,
    overallStats: {
      totalActivities: 20,
      totalGoalsCompleted: 4,
      todayActivities: 1,
      activeStreakDays: 3,
      currentWeekActivities: { current: 7, previous: 5, delta: 2, deltaPercent: 40 },
      currentMonthActivities: { current: 15, previous: 12, delta: 3, deltaPercent: 25 },
    },
    yearHeatmap: [{ date: "2026-01-02", count: 2 }],
    growSeries: [{ date: "2026-09-01", score: 18, pace: 16, rawCredits: 2 }],
    ...overrides,
  };
}

describe("PublicProfileContent page", () => {
  it("shows score and activity without the XP bar", () => {
    render(
      <PublicProfileContent bundle={publicBundle()} selectedYear={2026} variant="page" />
    );

    expect(screen.getByText("Jerry")).toBeInTheDocument();
    expect(screen.getByText("@jerry")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Goalmaxxing score" })).toBeInTheDocument();
    expect(screen.getByText("2026 activity")).toBeInTheDocument();
    expect(screen.queryByText("XP progress")).toBeNull();
  });

  it("keeps the XP bar on the in-app sheet", () => {
    render(
      <PublicProfileContent bundle={publicBundle()} selectedYear={2026} variant="sheet" />
    );

    expect(screen.getByText("XP progress")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Goalmaxxing score" })).toBeNull();
  });
});
