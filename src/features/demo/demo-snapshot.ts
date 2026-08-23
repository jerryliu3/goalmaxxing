import type { Completion, Goal, GoalLink, GoalShare, Profile } from "@/lib/goals/types";
import type { NotificationSchedule } from "@/features/settings/notification-schedule-utils";
import type {
  LeaderboardSeason,
  LeaderboardStanding,
  SocialChallenge,
  SocialFeedEvent,
} from "@/features/social/types";
import type { DuoContextState } from "@cadence/shared/social/duo";
import { addDaysIso, eachDateInclusive, isoDateTime, weekdayUtc } from "@/features/demo/demo-dates";
import {
  DEMO_ALEX_ID,
  DEMO_CHALLENGE_ID,
  DEMO_GOAL_IDS,
  DEMO_JORDAN_ID,
  DEMO_SEASON_ID,
  DEMO_TEAM_ID,
  DEMO_TIMEZONE,
} from "@/features/demo/demo-ids";
import { sha256Hex } from "@/lib/planner/canonical";

export interface DemoPlannerItem {
  id: string;
  goal_id: string;
  unit_key: string;
  requirement_kind: "milestone_sequence" | "cadence" | "deadline_total";
  scheduled_date: string;
  original_scheduled_date: string;
  label: string | null;
  locked: boolean;
  revision: number;
}

export interface DemoSnapshot {
  asOfDate: string;
  timezone: string;
  weekStartsOn: number;
  profiles: Profile[];
  goals: Goal[];
  completions: Completion[];
  teamMembers: Array<{ team_id: string; user_id: string }>;
  goalLinks: GoalLink[];
  goalShares: GoalShare[];
  plannerItems: DemoPlannerItem[];
  notificationSchedules: NotificationSchedule[];
  duoState: DuoContextState;
  challenge: SocialChallenge;
  season: LeaderboardSeason;
  standings: LeaderboardStanding[];
  feed: SocialFeedEvent[];
}

function stableUuid(prefix: string, seed: string) {
  const digest = sha256Hex(seed).slice(0, 12);
  return `${prefix}-0000-4000-8000-${digest}`;
}

function completionId(goalId: string, date: string) {
  return stableUuid("30000000", `${goalId}:${date}`);
}

function itemId(goalId: string, unitKey: string) {
  return stableUuid("40000000", `${goalId}:${unitKey}`);
}

function makeProfile({
  id,
  username,
  displayName,
  createdAt,
}: {
  id: string;
  username: string;
  displayName: string;
  createdAt: string;
}): Profile {
  return {
    id,
    username,
    display_name: displayName,
    avatar_url: null,
    planner_primary_tab: "calendar",
    week_starts_on: 1,
    social_activity_visible: true,
    created_at: createdAt,
  };
}

function makeGoal({
  id,
  ownerId,
  title,
  categoryKey,
  categoryLabel,
  color,
  frequencyType,
  recurrenceInterval,
  targetCount,
  milestoneNames,
  startDate,
  endDate,
  teamId = null,
  createdAt,
}: {
  id: string;
  ownerId: string;
  title: string;
  categoryKey: string;
  categoryLabel: string;
  color: string;
  frequencyType: Goal["frequency_type"];
  recurrenceInterval: Goal["recurrence_interval"];
  targetCount: number | null;
  milestoneNames?: string[] | null;
  startDate: string;
  endDate: string | null;
  teamId?: string | null;
  createdAt: string;
}): Goal {
  return {
    id,
    owner_id: ownerId,
    title,
    description: null,
    category: categoryLabel,
    category_key: categoryKey,
    is_private: false,
    color,
    frequency_type: frequencyType,
    recurrence_interval: recurrenceInterval,
    difficulty: "medium",
    target_count: targetCount,
    milestone_names: milestoneNames ?? null,
    start_date: startDate,
    end_date: endDate,
    reward_text: null,
    default_local_time: null,
    photo_path: null,
    team_id: teamId,
    is_deleted: false,
    archived_at: null,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

function makeCompletion(goalId: string, userId: string, date: string): Completion {
  return {
    id: completionId(goalId, date),
    goal_id: goalId,
    user_id: userId,
    completed_on: date,
    source: "manual",
    created_at: isoDateTime(date, 18),
  };
}

function makeItem(
  goal: Goal,
  scheduledDate: string,
  kind: DemoPlannerItem["requirement_kind"],
  label: string | null
): DemoPlannerItem {
  const unitKey =
    kind === "milestone_sequence"
      ? `milestone:${scheduledDate}`
      : `cadence:${scheduledDate}`;
  return {
    id: itemId(goal.id, unitKey),
    goal_id: goal.id,
    unit_key: unitKey,
    requirement_kind: kind,
    scheduled_date: scheduledDate,
    original_scheduled_date: scheduledDate,
    label,
    locked: false,
    revision: 1,
  };
}

export function buildDemoSnapshot(asOfDate: string): DemoSnapshot {
  const createdDate = addDaysIso(asOfDate, -56);
  const createdAt = isoDateTime(createdDate, 9);
  const historyStart = addDaysIso(asOfDate, -56);
  const itemStart = addDaysIso(asOfDate, -70);
  const itemEnd = addDaysIso(asOfDate, 40);
  const windowDates = eachDateInclusive(itemStart, itemEnd);

  const alex = makeProfile({
    id: DEMO_ALEX_ID,
    username: "alex",
    displayName: "Alex",
    createdAt,
  });
  const jordan = makeProfile({
    id: DEMO_JORDAN_ID,
    username: "jordan",
    displayName: "Jordan",
    createdAt,
  });

  const goals: Goal[] = [
    makeGoal({
      id: DEMO_GOAL_IDS.strength,
      ownerId: DEMO_ALEX_ID,
      title: "Strength",
      categoryKey: "health",
      categoryLabel: "Health",
      color: "#10b981",
      frequencyType: "recurring",
      recurrenceInterval: "weekly",
      targetCount: 1,
      startDate: createdDate,
      endDate: null,
      createdAt,
    }),
    makeGoal({
      id: DEMO_GOAL_IDS.tempoRun,
      ownerId: DEMO_ALEX_ID,
      title: "Tempo run",
      categoryKey: "health",
      categoryLabel: "Health",
      color: "#10b981",
      frequencyType: "recurring",
      recurrenceInterval: "weekly",
      targetCount: 1,
      startDate: createdDate,
      endDate: null,
      createdAt,
    }),
    makeGoal({
      id: DEMO_GOAL_IDS.readPages,
      ownerId: DEMO_ALEX_ID,
      title: "Read 20 pages",
      categoryKey: "personal",
      categoryLabel: "Personal",
      color: "#6366f1",
      frequencyType: "recurring",
      recurrenceInterval: "daily",
      targetCount: 1,
      startDate: createdDate,
      endDate: null,
      createdAt,
    }),
    makeGoal({
      id: DEMO_GOAL_IDS.launchCopy,
      ownerId: DEMO_ALEX_ID,
      title: "Launch copy",
      categoryKey: "career",
      categoryLabel: "Career",
      color: "#8b5cf6",
      frequencyType: "recurring",
      recurrenceInterval: "weekly",
      targetCount: 1,
      startDate: createdDate,
      endDate: null,
      createdAt,
    }),
    makeGoal({
      id: DEMO_GOAL_IDS.weeklyReview,
      ownerId: DEMO_ALEX_ID,
      title: "Weekly review",
      categoryKey: "career",
      categoryLabel: "Career",
      color: "#8b5cf6",
      frequencyType: "recurring",
      recurrenceInterval: "weekly",
      targetCount: 1,
      startDate: createdDate,
      endDate: null,
      createdAt,
    }),
    makeGoal({
      id: DEMO_GOAL_IDS.conferenceProposal,
      ownerId: DEMO_ALEX_ID,
      title: "Conference proposal",
      categoryKey: "career",
      categoryLabel: "Career",
      color: "#8b5cf6",
      frequencyType: "fixed_milestones",
      recurrenceInterval: null,
      targetCount: 3,
      milestoneNames: ["Outline talk", "Draft abstract", "Submit proposal"],
      startDate: createdDate,
      endDate: addDaysIso(asOfDate, 21),
      createdAt,
    }),
    makeGoal({
      id: DEMO_GOAL_IDS.monthlyBudget,
      ownerId: DEMO_ALEX_ID,
      title: "Monthly budget review",
      categoryKey: "personal",
      categoryLabel: "Personal",
      color: "#6366f1",
      frequencyType: "recurring",
      recurrenceInterval: "monthly",
      targetCount: 1,
      startDate: addDaysIso(asOfDate, -120),
      endDate: null,
      createdAt,
    }),
    makeGoal({
      id: DEMO_GOAL_IDS.neighborhoodCleanup,
      ownerId: DEMO_ALEX_ID,
      title: "Neighborhood cleanup",
      categoryKey: "relationships",
      categoryLabel: "Relationships",
      color: "#f43f5e",
      frequencyType: "recurring",
      recurrenceInterval: "weekly",
      targetCount: 1,
      startDate: createdDate,
      endDate: null,
      teamId: DEMO_TEAM_ID,
      createdAt,
    }),
    makeGoal({
      id: DEMO_GOAL_IDS.jordanYoga,
      ownerId: DEMO_JORDAN_ID,
      title: "Morning yoga",
      categoryKey: "health",
      categoryLabel: "Health",
      color: "#10b981",
      frequencyType: "recurring",
      recurrenceInterval: "weekly",
      targetCount: 1,
      startDate: createdDate,
      endDate: null,
      createdAt,
    }),
    makeGoal({
      id: DEMO_GOAL_IDS.jordanJournal,
      ownerId: DEMO_JORDAN_ID,
      title: "Journal",
      categoryKey: "personal",
      categoryLabel: "Personal",
      color: "#6366f1",
      frequencyType: "recurring",
      recurrenceInterval: "daily",
      targetCount: 1,
      startDate: createdDate,
      endDate: null,
      createdAt,
    }),
  ];

  const goalById = new Map(goals.map((goal) => [goal.id, goal]));
  const weeklyWeekday: Record<string, number> = {
    [DEMO_GOAL_IDS.strength]: 3,
    [DEMO_GOAL_IDS.tempoRun]: 6,
    [DEMO_GOAL_IDS.launchCopy]: 2,
    [DEMO_GOAL_IDS.weeklyReview]: 0,
    [DEMO_GOAL_IDS.neighborhoodCleanup]: 4,
    [DEMO_GOAL_IDS.jordanYoga]: 1,
  };

  const plannerItems: DemoPlannerItem[] = [];
  for (const goal of goals) {
    if (goal.frequency_type === "fixed_milestones") {
      const milestoneDates = [
        addDaysIso(asOfDate, -40),
        addDaysIso(asOfDate, -18),
        addDaysIso(asOfDate, 14),
      ];
      goal.milestone_names?.forEach((name, index) => {
        const date = milestoneDates[index];
        if (date) {
          plannerItems.push(makeItem(goal, date, "milestone_sequence", name));
        }
      });
      continue;
    }
    if (goal.recurrence_interval === "daily") {
      for (const date of windowDates) {
        plannerItems.push(makeItem(goal, date, "cadence", null));
      }
      continue;
    }
    if (goal.recurrence_interval === "weekly") {
      const weekday = weeklyWeekday[goal.id] ?? 3;
      for (const date of windowDates) {
        if (weekdayUtc(date) === weekday) {
          plannerItems.push(makeItem(goal, date, "cadence", null));
        }
      }
      continue;
    }
    if (goal.recurrence_interval === "monthly") {
      for (const date of windowDates) {
        if (date.endsWith("-15")) {
          plannerItems.push(makeItem(goal, date, "cadence", null));
        }
      }
    }
  }

  const completions: Completion[] = [];
  const shouldCompleteDaily = (date: string, userId: string) => {
    if (date >= asOfDate) {
      return false;
    }
    const weekday = weekdayUtc(date);
    if (weekday === 0) {
      return false;
    }
    if (date.endsWith("3") || date.endsWith("7")) {
      return userId === DEMO_JORDAN_ID;
    }
    return true;
  };
  const shouldCompleteWeekly = (date: string, goalId: string) => {
    if (date >= asOfDate) {
      return false;
    }
    const weekIndex = Math.floor(
      (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${historyStart}T00:00:00Z`)) /
        (7 * 86_400_000)
    );
    if (goalId === DEMO_GOAL_IDS.tempoRun && weekdayUtc(date) === 6) {
      return weekIndex % 4 !== 0;
    }
    return weekIndex % 5 !== 0;
  };

  for (const item of plannerItems) {
    const goal = goalById.get(item.goal_id);
    if (!goal || item.scheduled_date < historyStart || item.scheduled_date > asOfDate) {
      continue;
    }
    if (goal.frequency_type === "fixed_milestones") {
      if (item.scheduled_date < asOfDate) {
        completions.push(makeCompletion(goal.id, goal.owner_id, item.scheduled_date));
      }
      continue;
    }
    if (goal.recurrence_interval === "daily") {
      if (shouldCompleteDaily(item.scheduled_date, goal.owner_id)) {
        completions.push(makeCompletion(goal.id, goal.owner_id, item.scheduled_date));
      }
      continue;
    }
    if (shouldCompleteWeekly(item.scheduled_date, goal.id)) {
      completions.push(makeCompletion(goal.id, goal.owner_id, item.scheduled_date));
    }
  }

  const duoState: DuoContextState = {
    activePartner: {
      teamId: DEMO_TEAM_ID,
      partnerId: DEMO_JORDAN_ID,
      partnerUsername: "jordan",
      partnerDisplayName: "Jordan",
      partnerAvatarUrl: null,
      teamXp: 1860,
      teamXpSince: createdAt,
    },
    pendingInvite: null,
  };

  const challenge: SocialChallenge = {
    id: DEMO_CHALLENGE_ID,
    slug: "august-consistency",
    title: "August consistency",
    description: "Log focused work across the month with your partner.",
    status: "active",
    subjectKind: "user",
    metric: "distinct_active_days",
    metricTrackKey: null,
    targetValue: 20,
    startsAt: isoDateTime(addDaysIso(asOfDate, -21), 0),
    endsAt: isoDateTime(addDaysIso(asOfDate, 10), 23),
    rewardXp: 250,
    maxParticipants: null,
    participantCount: 48,
    viewerJoined: true,
    viewerProgress: 14,
    viewerCompletedAt: null,
    viewerAwardedAt: null,
    audienceKind: "global",
    groupId: null,
  };

  const season: LeaderboardSeason = {
    id: DEMO_SEASON_ID,
    slug: "late-summer-builders",
    title: "Late summer builders",
    subjectKind: "user",
    metric: "total_xp",
    metricTrackKey: null,
    startsAt: isoDateTime(addDaysIso(asOfDate, -30), 0),
    endsAt: isoDateTime(addDaysIso(asOfDate, 15), 23),
    status: "open",
    rollover: "monthly",
    scope: "global",
    groupId: null,
  };

  const standings: LeaderboardStanding[] = [
    {
      seasonId: DEMO_SEASON_ID,
      subjectKind: "user",
      subjectId: "20000000-0000-4000-8000-000000000001",
      displayName: "Maya",
      avatarUrl: null,
      score: 4120,
      rank: 1,
      tieBreakAt: null,
      viewerRank: 3,
    },
    {
      seasonId: DEMO_SEASON_ID,
      subjectKind: "user",
      subjectId: "20000000-0000-4000-8000-000000000002",
      displayName: "Chris",
      avatarUrl: null,
      score: 3875,
      rank: 2,
      tieBreakAt: null,
      viewerRank: 3,
    },
    {
      seasonId: DEMO_SEASON_ID,
      subjectKind: "user",
      subjectId: DEMO_ALEX_ID,
      displayName: "Alex",
      avatarUrl: null,
      score: 2460,
      rank: 3,
      tieBreakAt: null,
      viewerRank: 3,
    },
    {
      seasonId: DEMO_SEASON_ID,
      subjectKind: "user",
      subjectId: DEMO_JORDAN_ID,
      displayName: "Jordan",
      avatarUrl: null,
      score: 1980,
      rank: 4,
      tieBreakAt: null,
      viewerRank: 3,
    },
    {
      seasonId: DEMO_SEASON_ID,
      subjectKind: "user",
      subjectId: "20000000-0000-4000-8000-000000000003",
      displayName: "Sam",
      avatarUrl: null,
      score: 1640,
      rank: 5,
      tieBreakAt: null,
      viewerRank: 3,
    },
  ];

  const alexActor = {
    id: DEMO_ALEX_ID,
    username: "alex",
    displayName: "Alex",
    avatarUrl: null,
  };
  const jordanActor = {
    id: DEMO_JORDAN_ID,
    username: "jordan",
    displayName: "Jordan",
    avatarUrl: null,
  };
  const feed: SocialFeedEvent[] = [
    {
      id: stableUuid("50000000", "feed-1"),
      eventType: "xp_earned",
      createdAt: isoDateTime(addDaysIso(asOfDate, -1), 19),
      actor: alexActor,
      trackKey: "health",
      categoryLabel: "Health",
      goalTitle: "Tempo run",
      xpDelta: 40,
      occurrenceCount: 1,
      reactionCount: 2,
      viewerReacted: false,
      payload: {},
    },
    {
      id: stableUuid("50000000", "feed-2"),
      eventType: "xp_earned",
      createdAt: isoDateTime(addDaysIso(asOfDate, -2), 8),
      actor: jordanActor,
      trackKey: "health",
      categoryLabel: "Health",
      goalTitle: "Morning yoga",
      xpDelta: 25,
      occurrenceCount: 1,
      reactionCount: 1,
      viewerReacted: true,
      payload: {},
    },
    {
      id: stableUuid("50000000", "feed-3"),
      eventType: "team_formed",
      createdAt: isoDateTime(addDaysIso(asOfDate, -20), 11),
      actor: alexActor,
      trackKey: null,
      categoryLabel: null,
      goalTitle: null,
      xpDelta: 0,
      occurrenceCount: 1,
      reactionCount: 4,
      viewerReacted: false,
      payload: { teamName: "Builders" },
    },
    {
      id: stableUuid("50000000", "feed-4"),
      eventType: "level_up",
      createdAt: isoDateTime(addDaysIso(asOfDate, -9), 21),
      actor: alexActor,
      trackKey: "global",
      categoryLabel: null,
      goalTitle: null,
      xpDelta: 0,
      occurrenceCount: 1,
      reactionCount: 3,
      viewerReacted: false,
      payload: { level: 7 },
    },
  ];

  return {
    asOfDate,
    timezone: DEMO_TIMEZONE,
    weekStartsOn: 1,
    profiles: [alex, jordan],
    goals,
    completions,
    teamMembers: [
      { team_id: DEMO_TEAM_ID, user_id: DEMO_ALEX_ID },
      { team_id: DEMO_TEAM_ID, user_id: DEMO_JORDAN_ID },
    ],
    goalLinks: [],
    goalShares: [],
    plannerItems,
    notificationSchedules: [
      {
        id: stableUuid("60000000", "default-schedule"),
        user_id: DEMO_ALEX_ID,
        hour: 21,
        timezone: DEMO_TIMEZONE,
        message: "Complete your checklist for today",
        enabled: true,
        is_default: true,
        last_sent_local_date: null,
        created_at: createdAt,
        updated_at: createdAt,
      },
    ],
    duoState,
    challenge,
    season,
    standings,
    feed,
  };
}

export function alexGoalsFromSnapshot(snapshot: DemoSnapshot) {
  return snapshot.goals.filter((goal) => goal.owner_id === DEMO_ALEX_ID);
}
