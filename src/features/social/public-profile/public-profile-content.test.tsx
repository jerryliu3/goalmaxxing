import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicProfileContent } from "@/features/social/public-profile/public-profile-content";
import type { PublicProfileBundle } from "@cadence/shared/social/public-profile";

vi.mock("@/features/insights/grow-score-trend-chart", () => ({
  GrowScoreTrendChart: ({ title }: { title: string }) => <h3>{title}</h3>,
}));

vi.mock("@/features/insights/folio/current-goal-grid", () => ({
  CurrentGoalGrid: ({ entries }: { entries: Array<{ goal: { title: string } }> }) => (
    <div>{entries.map((entry) => <p key={entry.goal.title}>{entry.goal.title}</p>)}</div>
  ),
  hydratePublicCurrentGoal: (dto: { title: string }) => ({
    goal: { title: dto.title },
    progress: {},
  }),
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
    currentGoals: [],
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

  it("shows public current goals below activity", () => {
    render(
      <PublicProfileContent
        bundle={publicBundle({
          currentGoals: [
            {
              id: "goal-1",
              ownerId: "subject-1",
              title: "Daily walk",
              description: null,
              category: "Health",
              color: null,
              frequencyType: "recurring",
              recurrenceInterval: "daily",
              difficulty: null,
              targetCount: 1,
              targetBasis: "period",
              milestoneNames: null,
              startDate: "2026-01-01",
              endDate: null,
              rewardText: null,
              defaultLocalTime: null,
              createdAt: "2026-01-01T00:00:00.000Z",
              progress: {
                goalId: "goal-1",
                admissibleCompletionCount: 1,
                creditedUnitCount: 1,
                expectedUnitCount: 1,
                percent: 100,
                lifecycle: "active",
                outcome: "in_progress",
                placementTerminal: false,
                periodSatisfied: true,
                currentPeriodCompletionCount: 1,
                currentPeriodTarget: 1,
                closedPeriodHitRatePercent: 100,
                currentStreak: 1,
                longestStreak: 1,
                milestoneDates: [],
              },
            },
          ],
        })}
        selectedYear={2026}
        variant="page"
      />
    );

    expect(screen.getByRole("heading", { name: "Current goals" })).toBeInTheDocument();
    expect(screen.getByText("Daily walk")).toBeInTheDocument();
  });

  it("keeps the XP bar on the in-app sheet", () => {
    render(
      <PublicProfileContent bundle={publicBundle()} selectedYear={2026} variant="sheet" />
    );

    expect(screen.getByText("XP progress")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Goalmaxxing score" })).toBeNull();
  });
});
