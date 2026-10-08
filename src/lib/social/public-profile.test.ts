import { describe, expect, it } from "vitest";
import type { Completion, Goal } from "@/lib/goals/types";
import { PUBLIC_PROFILE_DEFAULT_BIO } from "@cadence/shared/social/public-profile";
import { buildPublicProfileBundle } from "@/lib/social/public-profile-model";

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    owner_id: "subject-1",
    title: "Daily walk",
    description: null,
    category: "Health",
    category_key: "health",
    color: null,
    frequency_type: "recurring",
    recurrence_interval: "daily",
    target_count: 1,
    milestone_names: null,
    start_date: "2026-01-01",
    end_date: null,
    photo_path: null,
    team_id: null,
    is_deleted: false,
    archived_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
    target_basis: overrides.target_basis ?? "period",
  };
}

function makeCompletion(overrides: Partial<Completion> = {}): Completion {
  return {
    id: "completion-1",
    goal_id: "goal-1",
    user_id: "subject-1",
    completed_on: "2026-01-02",
    source: "manual",
    created_at: "2026-01-02T08:00:00.000Z",
    ...overrides,
  };
}

describe("buildPublicProfileBundle", () => {
  it("returns private payload for non-self viewers on hidden accounts", () => {
    const bundle = buildPublicProfileBundle({
      viewerUserId: "viewer-1",
      subjectProfile: {
        id: "subject-1",
        username: "subject",
        display_name: "Subject User",
        avatar_url: "https://example.com/avatar.png",
        bio: null,
        social_activity_visible: false,
        week_starts_on: 1,
        created_at: "2026-01-01T00:00:00.000Z",
        timezone: "America/New_York",
      },
      globalXpProfile: { total_xp: 480 },
      globalAchievements: [
        {
          id: "award-1",
          unlocked_at: "2026-01-05T00:00:00.000Z",
          revoked_at: null,
          xp_rewards: {
            level: 2,
            reward_code: "lv2",
            reward_title: "Level 2",
            reward_description: "Reached level 2",
          },
        },
      ],
      awardCatalogCount: 10,
      goals: [makeGoal()],
      completions: [makeCompletion()],
      selectedYear: 2026,
    });

    expect(bundle.profile.isPrivate).toBe(true);
    expect(bundle.xp).toBeNull();
    expect(bundle.globalAchievements).toEqual([]);
    expect(bundle.awardCatalogCount).toBe(0);
    expect(bundle.overallStats).toBeNull();
    expect(bundle.yearHeatmap).toEqual([]);
    expect(bundle.growSeries).toEqual([]);
    expect(bundle.currentGoals).toEqual([]);
    expect(bundle.profile.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("returns full payload for self viewers even when social visibility is disabled", () => {
    const bundle = buildPublicProfileBundle({
      viewerUserId: "subject-1",
      subjectProfile: {
        id: "subject-1",
        username: "subject",
        display_name: "Subject User",
        avatar_url: null,
        bio: null,
        social_activity_visible: false,
        week_starts_on: 1,
        created_at: "2026-01-01T00:00:00.000Z",
        timezone: "America/New_York",
      },
      globalXpProfile: { total_xp: 480 },
      globalAchievements: [
        {
          id: "award-1",
          unlocked_at: "2026-01-05T00:00:00.000Z",
          revoked_at: null,
          xp_rewards: {
            level: 2,
            reward_code: "lv2",
            reward_title: "Level 2",
            reward_description: "Reached level 2",
          },
        },
      ],
      awardCatalogCount: 10,
      goals: [makeGoal()],
      completions: [makeCompletion()],
      selectedYear: 2026,
      memberNumber: 146,
    });

    expect(bundle.profile.isPrivate).toBe(false);
    expect(bundle.xp?.totalXp).toBe(480);
    expect(bundle.awardCatalogCount).toBe(10);
    expect(bundle.globalAchievements).toHaveLength(1);
    expect(bundle.globalAchievements[0]).toMatchObject({
      id: "award-1",
      code: "lv2",
      title: "Level 2",
    });
    expect(bundle.overallStats?.totalActivities).toBe(1);
    expect(bundle.overallStats?.todayActivities).toBeTypeOf("number");
    expect(bundle.yearHeatmap).toHaveLength(365);
    expect(
      bundle.yearHeatmap.find((entry) => entry.date === "2026-01-02")?.count
    ).toBe(1);
    // The score chart runs from signup so its history scrolls back to day one.
    expect(bundle.growSeries[0]?.date).toBe("2026-01-01");
    expect(bundle.profile.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(bundle.currentGoals.map((goal) => goal.id)).toEqual(["goal-1"]);
    expect(bundle.profile.memberNumber).toBe(146);
  });

  it("publishes only public current goals on a visible profile", () => {
    const bundle = buildPublicProfileBundle({
      viewerUserId: null,
      subjectProfile: {
        id: "subject-1",
        username: "subject",
        display_name: "Subject User",
        avatar_url: null,
        bio: null,
        social_activity_visible: true,
        week_starts_on: 1,
        created_at: "2026-01-01T00:00:00.000Z",
        timezone: "America/New_York",
      },
      globalXpProfile: { total_xp: 100 },
      globalAchievements: [],
      awardCatalogCount: 0,
      goals: [
        makeGoal({ id: "public-goal", title: "Public walk" }),
        makeGoal({ id: "private-goal", title: "Private lift", is_private: true }),
      ],
      completions: [],
      selectedYear: 2026,
    });

    expect(bundle.profile.isPrivate).toBe(false);
    expect(bundle.currentGoals.map((goal) => goal.id)).toEqual(["public-goal"]);
    expect(bundle.currentGoals[0]?.title).toBe("Public walk");
  });

  it("treats a null viewer as non-self for private accounts", () => {
    const bundle = buildPublicProfileBundle({
      viewerUserId: null,
      subjectProfile: {
        id: "subject-1",
        username: "subject",
        display_name: "Subject User",
        avatar_url: null,
        bio: null,
        social_activity_visible: false,
        week_starts_on: 1,
        created_at: "2026-01-01T00:00:00.000Z",
        timezone: "America/New_York",
      },
      globalXpProfile: { total_xp: 480 },
      globalAchievements: [],
      awardCatalogCount: 0,
      goals: [],
      completions: [],
      selectedYear: 2026,
    });

    expect(bundle.profile.isPrivate).toBe(true);
    expect(bundle.xp).toBeNull();
  });
});

describe("public profile showcase and featured goals", () => {
  const subjectProfile = {
    id: "subject-1",
    username: "subject",
    display_name: "Subject User",
    avatar_url: null,
    bio: "Training for a spring half.",
    social_activity_visible: true,
    week_starts_on: 1,
    created_at: "2026-01-01T00:00:00.000Z",
    timezone: "America/New_York",
  };
  const award = {
    id: "award-1",
    unlocked_at: "2026-01-05T00:00:00.000Z",
    revoked_at: null,
    xp_rewards: {
      level: 2,
      reward_code: "lv2",
      reward_title: "Level 2",
      reward_description: "Reached level 2",
    },
  };
  const finishedPublic = makeGoal({
    id: "finished-public",
    title: "Read a book",
    frequency_type: "fixed_milestones",
    recurrence_interval: null,
    target_count: 1,
    milestone_names: ["Book"],
    start_date: "2026-01-01",
    end_date: "2026-02-01",
  });
  const finishedPrivate = makeGoal({ ...finishedPublic, id: "finished-private", is_private: true });
  const goals = [
    makeGoal({ id: "public-featured", title: "Public walk" }),
    makeGoal({ id: "public-hidden", title: "Quiet walk", featured_on_profile: false }),
    makeGoal({ id: "private-goal", title: "Private lift", is_private: true }),
    finishedPublic,
    finishedPrivate,
  ];
  const completions = [
    makeCompletion({ id: "c-public", goal_id: "finished-public", completed_on: "2026-01-10" }),
    makeCompletion({ id: "c-private", goal_id: "finished-private", completed_on: "2026-01-10" }),
  ];
  const pins = [
    { kind: "goal" as const, ref: "finished-private" },
    { kind: "medal" as const, ref: "award-1" },
    { kind: "goal" as const, ref: "finished-public" },
  ];

  function build(viewerUserId: string | null) {
    return buildPublicProfileBundle({
      viewerUserId,
      subjectProfile,
      globalXpProfile: { total_xp: 480 },
      globalAchievements: [award],
      awardCatalogCount: 10,
      goals,
      completions,
      pins,
      selectedYear: 2026,
    });
  }

  it("never shows a private goal to a visitor", () => {
    const bundle = build("viewer-1");
    const text = JSON.stringify(bundle);

    expect(bundle.currentGoals.map((goal) => goal.id)).toEqual(["public-featured"]);
    expect(bundle.showcase.map((item) => item.ref)).toEqual(["award-1", "finished-public"]);
    expect(bundle.showcaseCatalog).toBeNull();
    expect(text).not.toContain("Private lift");
    expect(text).not.toContain("finished-private");
  });

  it("gives the owner every current goal with its flags and the pin catalog", () => {
    const bundle = build("subject-1");

    expect(bundle.bio).toBe("Training for a spring half.");
    expect(
      bundle.currentGoals.map(({ id, isPrivate, featuredOnProfile }) => ({ id, isPrivate, featuredOnProfile }))
    ).toEqual(
      expect.arrayContaining([
        { id: "public-featured", isPrivate: false, featuredOnProfile: true },
        { id: "public-hidden", isPrivate: false, featuredOnProfile: false },
        { id: "private-goal", isPrivate: true, featuredOnProfile: true },
      ])
    );
    expect(bundle.showcaseCatalog?.medals.map((medal) => medal.ref)).toEqual(["award-1"]);
    expect(bundle.showcaseCatalog?.goals.map((goal) => goal.ref)).toEqual(["finished-public"]);
    expect(bundle.showcaseCatalog?.records.map((record) => record.ref)).toContain("rec-level");
  });

  it("drops pins whose source no longer exists", () => {
    const bundle = buildPublicProfileBundle({
      viewerUserId: "viewer-1",
      subjectProfile,
      globalXpProfile: { total_xp: 480 },
      globalAchievements: [{ ...award, revoked_at: "2026-02-01T00:00:00.000Z" }],
      awardCatalogCount: 10,
      goals: [],
      completions: [],
      pins: [{ kind: "medal", ref: "award-1" }, { kind: "record", ref: "rec-level" }],
      selectedYear: 2026,
    });

    expect(bundle.showcase.map((item) => item.ref)).toEqual(["rec-level"]);
  });

  it("fills a description, a medal, and records until the owner saves the card", () => {
    const bundle = buildPublicProfileBundle({
      viewerUserId: "viewer-1",
      subjectProfile: { ...subjectProfile, bio: null },
      globalXpProfile: { total_xp: 480 },
      globalAchievements: [award],
      awardCatalogCount: 10,
      goals,
      completions,
      pins: [],
      selectedYear: 2026,
      cardConfigured: false,
    });

    expect(bundle.bio).toBe(PUBLIC_PROFILE_DEFAULT_BIO);
    const refs = bundle.showcase.map((item) => item.ref);
    expect(refs.slice(0, 2)).toEqual(["award-1", "finished-public"]);
    expect(refs.filter((ref) => ref.startsWith("rec-")).length).toBeGreaterThan(0);
    expect(refs.filter((ref) => ref.startsWith("rec-")).length).toBeLessThanOrEqual(3);
  });

  it("keeps a saved empty card empty", () => {
    const bundle = buildPublicProfileBundle({
      viewerUserId: "viewer-1",
      subjectProfile: { ...subjectProfile, bio: "" },
      globalXpProfile: { total_xp: 480 },
      globalAchievements: [award],
      awardCatalogCount: 10,
      goals,
      completions,
      pins: [],
      selectedYear: 2026,
      cardConfigured: true,
    });

    expect(bundle.bio).toBe("");
    expect(bundle.showcase).toEqual([]);
  });
});
