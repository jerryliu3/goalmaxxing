import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  PublicProfileBundle,
  PublicProfileCurrentGoal,
} from "@cadence/shared/social/public-profile";
import { PublicProfileView } from "@/features/social/public-profile/public-profile-view";

vi.mock("@/features/social/profile-membership-card", () => ({
  ProfileMembershipCard: () => <div>Membership card</div>,
}));

vi.mock("@/features/goals/goal-progress-card", () => ({
  GoalProgressCard: ({ goal }: { goal: { title: string } }) => <div>{goal.title}</div>,
}));

vi.mock("@/features/achievements/medals", () => ({
  MedalMark: ({ level }: { level: number }) => <span>medal {level}</span>,
}));

function goal(id: string, title: string, flags: Partial<PublicProfileCurrentGoal> = {}): PublicProfileCurrentGoal {
  return {
    id,
    ownerId: "owner-1",
    title,
    description: null,
    category: "Health",
    color: null,
    frequencyType: "recurring",
    recurrenceInterval: "weekly",
    difficulty: null,
    targetCount: 3,
    targetBasis: "period",
    milestoneNames: null,
    startDate: "2026-09-01",
    endDate: null,
    rewardText: null,
    defaultLocalTime: null,
    createdAt: "2026-09-01T00:00:00Z",
    progress: {} as PublicProfileCurrentGoal["progress"],
    isPrivate: false,
    featuredOnProfile: true,
    ...flags,
  };
}

function bundle(overrides: Partial<PublicProfileBundle> = {}): PublicProfileBundle {
  return {
    schemaVersion: "1",
    profile: {
      subjectUserId: "owner-1",
      username: "runner",
      displayName: "Runner",
      avatarUrl: null,
      isPrivate: false,
      createdAt: null,
    },
    xp: { totalXp: 900, currentLevel: 3, currentLevelMinXp: 800, nextLevel: 4, nextLevelMinXp: 1200, xpToNextLevel: 300 },
    globalAchievements: [],
    awardCatalogCount: 0,
    overallStats: null,
    yearHeatmap: [],
    growSeries: [],
    growTopPercent: null,
    currentGoals: [
      goal("g1", "Run 3x a week"),
      goal("g2", "Quiet goal", { featuredOnProfile: false }),
      goal("g3", "Private journal", { isPrivate: true }),
    ],
    bio: "Running toward a spring half.",
    showcase: [{ kind: "medal", ref: "award-1", level: 3, title: "Level 3", unlockedAt: "2026-05-01T00:00:00Z" }],
    showcaseCatalog: null,
    ...overrides,
  };
}

describe("PublicProfileView", () => {
  afterEach(cleanup);

  it("shows the bio, pins, link, and only featured public goals", () => {
    render(<PublicProfileView bundle={bundle()} />);

    expect(screen.getByText("Running toward a spring half.")).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Level 3" })).toBeInTheDocument();
    expect(screen.getByText(/\/user\/runner$/)).toBeInTheDocument();
    expect(screen.getByText("Run 3x a week")).toBeInTheDocument();
    expect(screen.queryByText("Quiet goal")).toBeNull();
    expect(screen.queryByText("Private journal")).toBeNull();
    expect(screen.queryByRole("button", { name: "Copy link" })).toBeNull();
  });

  it("renders the compact variant with level and a link to the full page", () => {
    render(<PublicProfileView bundle={bundle()} variant="compact" />);

    expect(screen.getByText("@runner · Lv 3")).toBeInTheDocument();
    expect(screen.getByText("Working on")).toBeInTheDocument();
    expect(screen.queryByText("Private journal")).toBeNull();
    expect(screen.getByRole("link", { name: "View full profile" })).toHaveAttribute("href", "/user/runner");
  });

  it("hides medals when XP is off", () => {
    render(<PublicProfileView bundle={bundle()} xpEnabled={false} />);
    expect(screen.queryByRole("article", { name: "Level 3" })).toBeNull();
  });

  it("shows only the private notice for a private account", () => {
    render(
      <PublicProfileView
        bundle={bundle({ profile: { ...bundle().profile, isPrivate: true }, currentGoals: [], showcase: [], bio: null })}
      />
    );
    expect(screen.getByText("This account is private")).toBeInTheDocument();
    expect(screen.queryByText("Membership card")).toBeNull();
  });
});
