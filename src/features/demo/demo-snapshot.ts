import type { Completion, Goal, GoalLink, GoalShare, Profile } from "@/lib/goals/types";
import type { NotificationSchedule } from "@/features/settings/notification-schedule-utils";
import type {
  LeaderboardSeason,
  LeaderboardStanding,
  SocialChallenge,
  SocialFeedEvent,
} from "@/features/social/types";
import type { DuoContextState } from "@cadence/shared/social/duo";
import {
  addDaysIso,
  countDaysInclusive,
  eachDateInclusive,
  isoDateTime,
  spreadIsoDates,
  weekdayUtc,
} from "@/features/demo/demo-dates";
import {
  DEMO_ALEX_ID,
  DEMO_AVATAR_URLS,
  DEMO_CHALLENGE_ID,
  DEMO_GOAL_IDS,
  DEMO_JORDAN_ID,
  DEMO_SEASON_ID,
  DEMO_TEAM_ID,
  DEMO_TIMEZONE,
} from "@/features/demo/demo-ids";
import { getAnchoredPeriod } from "@/lib/goals/periods";
import { cadenceUnitKey } from "@/lib/goals/target-basis";
import { sha256Hex } from "@/lib/planner/canonical";

/** The demo profile's week start (Monday), for cadence periods. */
const DEMO_WEEK_STARTS_ON = 1;

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
  avatarUrl,
  createdAt,
}: {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  createdAt: string;
}): Profile {
  return {
    id,
    username,
    display_name: displayName,
    avatar_url: avatarUrl,
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
    target_basis: frequencyType === "fixed_milestones" ? "lifetime" : "period",
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

/**
 * Production-shaped unit keys, so the demo planner reads like a real one:
 * the nth milestone or total session, or a cadence period's slot (the demo
 * schedules one session per period).
 */
function makeItem(
  goal: Goal,
  scheduledDate: string,
  kind: DemoPlannerItem["requirement_kind"],
  label: string | null,
  ordinal = 1
): DemoPlannerItem {
  const unitKey =
    kind === "milestone_sequence"
      ? `milestone:${ordinal}`
      : kind === "deadline_total"
        ? `total:${ordinal}`
        : cadenceUnitKey(
            getAnchoredPeriod(goal.start_date, goal.recurrence_interval ?? "weekly", scheduledDate, {
              weekStartsOn: DEMO_WEEK_STARTS_ON,
            }).periodKey,
            ordinal
          );
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

function includeAsOfDate(dates: string[], asOfDate: string) {
  if (dates.includes(asOfDate)) {
    return dates;
  }
  if (dates.length === 0) {
    return [asOfDate];
  }
  const swapAt = Math.min(
    dates.length - 1,
    Math.max(
      0,
      dates.findIndex((date) => date >= asOfDate) === -1
        ? dates.length - 1
        : dates.findIndex((date) => date >= asOfDate)
    )
  );
  const next = [...dates];
  next[swapAt] = asOfDate;
  return [...new Set(next)].sort();
}

export function buildDemoSnapshot(asOfDate: string): DemoSnapshot {
  const yearStart = addDaysIso(asOfDate, -365);
  const createdAt = isoDateTime(yearStart, 9);
  const historyStart = yearStart;
  const itemStart = yearStart;
  const itemEnd = addDaysIso(asOfDate, 40);
  const historicalEnd = addDaysIso(asOfDate, -21);
  const readEnd = addDaysIso(asOfDate, 28);
  const windowDates = eachDateInclusive(itemStart, itemEnd);
  const asOfWeekday = weekdayUtc(asOfDate);
  const readSpanDays = countDaysInclusive(yearStart, readEnd);
  const readTarget = Math.max(18, Math.floor((readSpanDays - 1) / 8));

  const alex = makeProfile({
    id: DEMO_ALEX_ID,
    username: "alex",
    displayName: "Alex",
    avatarUrl: DEMO_AVATAR_URLS.alex,
    createdAt,
  });
  const jordan = makeProfile({
    id: DEMO_JORDAN_ID,
    username: "jordan",
    displayName: "Jordan",
    avatarUrl: DEMO_AVATAR_URLS.jordan,
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
      targetCount: null,
      startDate: yearStart,
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
      targetCount: null,
      startDate: yearStart,
      endDate: historicalEnd,
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
      targetCount: readTarget,
      startDate: yearStart,
      endDate: readEnd,
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
      targetCount: null,
      startDate: yearStart,
      endDate: historicalEnd,
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
      targetCount: null,
      startDate: yearStart,
      endDate: historicalEnd,
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
      startDate: yearStart,
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
      targetCount: null,
      startDate: yearStart,
      endDate: historicalEnd,
      createdAt,
    }),
    makeGoal({
      id: DEMO_GOAL_IDS.neighborhoodCleanup,
      ownerId: DEMO_ALEX_ID,
      title: "Neighborhood cleanup",
      categoryKey: "relationships",
      categoryLabel: "Interpersonal",
      color: "#f43f5e",
      frequencyType: "recurring",
      recurrenceInterval: "weekly",
      targetCount: null,
      startDate: yearStart,
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
      targetCount: null,
      startDate: yearStart,
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
      recurrenceInterval: "weekly",
      targetCount: null,
      startDate: yearStart,
      endDate: null,
      createdAt,
    }),
  ];

  const goalById = new Map(goals.map((goal) => [goal.id, goal]));
  const weeklyWeekday: Record<string, number> = {
    [DEMO_GOAL_IDS.strength]: asOfWeekday,
    [DEMO_GOAL_IDS.tempoRun]: 6,
    [DEMO_GOAL_IDS.launchCopy]: 2,
    [DEMO_GOAL_IDS.weeklyReview]: 0,
    [DEMO_GOAL_IDS.neighborhoodCleanup]: (asOfWeekday + 4) % 7,
    [DEMO_GOAL_IDS.jordanYoga]: 1,
    [DEMO_GOAL_IDS.jordanJournal]: 3,
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
          plannerItems.push(makeItem(goal, date, "milestone_sequence", name, index + 1));
        }
      });
      continue;
    }
    if (typeof goal.target_count === "number" && goal.target_count > 0) {
      const rangeEnd = goal.end_date ?? itemEnd;
      let dates = spreadIsoDates(goal.start_date, rangeEnd, goal.target_count);
      if (goal.id === DEMO_GOAL_IDS.readPages) {
        dates = includeAsOfDate(dates, asOfDate);
        goal.target_count = dates.length;
      }
      dates.forEach((date, index) => {
        plannerItems.push(makeItem(goal, date, "deadline_total", null, index + 1));
      });
      continue;
    }
    if (goal.recurrence_interval === "weekly") {
      const weekday = weeklyWeekday[goal.id] ?? 3;
      for (const date of windowDates) {
        if (date < goal.start_date) {
          continue;
        }
        if (goal.end_date && date > goal.end_date) {
          continue;
        }
        if (weekdayUtc(date) === weekday) {
          plannerItems.push(makeItem(goal, date, "cadence", null));
        }
      }
      continue;
    }
    if (goal.recurrence_interval === "monthly") {
      for (const date of windowDates) {
        if (date < goal.start_date) {
          continue;
        }
        if (goal.end_date && date > goal.end_date) {
          continue;
        }
        if (date.endsWith("-15")) {
          plannerItems.push(makeItem(goal, date, "cadence", null));
        }
      }
    }
  }

  const completions: Completion[] = [];
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
    if (item.requirement_kind === "deadline_total") {
      if (item.scheduled_date < asOfDate && weekdayUtc(item.scheduled_date) !== 0) {
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
      partnerAvatarUrl: DEMO_AVATAR_URLS.jordan,
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
      avatarUrl: DEMO_AVATAR_URLS.maya,
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
      avatarUrl: DEMO_AVATAR_URLS.chris,
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
      avatarUrl: DEMO_AVATAR_URLS.alex,
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
      avatarUrl: DEMO_AVATAR_URLS.jordan,
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
      avatarUrl: DEMO_AVATAR_URLS.sam,
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
    avatarUrl: DEMO_AVATAR_URLS.alex,
  };
  const jordanActor = {
    id: DEMO_JORDAN_ID,
    username: "jordan",
    displayName: "Jordan",
    avatarUrl: DEMO_AVATAR_URLS.jordan,
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
        message: "Complete your plan for today",
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
