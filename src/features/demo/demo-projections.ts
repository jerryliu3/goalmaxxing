import { buildCompletableGoalIds, selectCompletableGoals } from "@cadence/shared/goals/completable-goals";
import { selectViewerVisibleGoals } from "@cadence/shared/goals/visible-goals";
import { defaultNotificationPreferences } from "@cadence/shared/notifications/preferences";
import type { ProgressContextResponse } from "@cadence/shared/goals/progress-context";
import type {
  PlannerActiveGoalSnapshot,
  PlannerActiveItemSnapshot,
  PlannerContextPayload,
  PlannerWorkUnit,
} from "@cadence/shared/planner/context";
import type { InsightsStatsResponse } from "@/lib/insights/types";
import { buildInsightsStatsGroup } from "@/lib/insights/metrics";
import { getGoalProgressSnapshot } from "@/lib/goals/progress";
import { getAnchoredPeriod } from "@/lib/goals/periods";
import type { Completion, Goal } from "@/lib/goals/types";
import { isTargetedRecurringGoal } from "@/lib/planner/requirements";
import { sha256Hex } from "@/lib/planner/canonical";
import { createDefaultPlannerPolicy } from "@/lib/planner/policy";
import { buildAchievementsShowcasePayload } from "@/features/achievements/build-showcase";
import type { AchievementsShowcasePayload } from "@/features/achievements/types";
import {
  DEMO_ALEX_ID,
  DEMO_CORRELATION_ID,
  DEMO_JORDAN_ID,
  DEMO_PLAN_ID,
  DEMO_TEAM_ID,
  DEMO_TIMEZONE,
  DEMO_WEEK_STARTS_ON,
} from "@/features/demo/demo-ids";
import { addDaysIso, isoDateTime } from "@/features/demo/demo-dates";
import type { DemoSnapshot } from "@/features/demo/demo-snapshot";
import { getDemoStore } from "@/features/demo/demo-store";

const WEEKLY_ANCHOR = { weekStartsOn: DEMO_WEEK_STARTS_ON };

function laterDate(left: string, right: string) {
  return left > right ? left : right;
}

function earlierDate(left: string, right: string) {
  return left < right ? left : right;
}

type DemoSessionWindows = Pick<
  PlannerWorkUnit,
  "creditWindow" | "placementWindow" | "draftMoveWindow" | "classification"
>;

function demoSessionWindows({
  goal,
  scheduledDate,
  credited,
  asOfDate,
  visibleStart,
  visibleEnd,
}: {
  goal: Goal;
  scheduledDate: string | null;
  credited: boolean;
  asOfDate: string;
  visibleStart: string;
  visibleEnd: string;
}): DemoSessionWindows {
  const lifetimeEnd = goal.end_date ?? visibleEnd;
  const creditWindow = {
    start: goal.start_date,
    end: laterDate(lifetimeEnd, scheduledDate ?? lifetimeEnd),
  };
  if (credited) {
    return {
      creditWindow,
      placementWindow: null,
      draftMoveWindow: null,
      classification: "fulfilled",
    };
  }
  const moveWindow = {
    start: laterDate(goal.start_date, visibleStart),
    end: earlierDate(lifetimeEnd, laterDate(visibleEnd, scheduledDate ?? visibleEnd)),
  };
  if (moveWindow.start > moveWindow.end) {
    return {
      creditWindow,
      placementWindow: null,
      draftMoveWindow: null,
      classification: scheduledDate && scheduledDate > asOfDate ? "future" : "open",
    };
  }
  return {
    creditWindow,
    placementWindow: moveWindow,
    draftMoveWindow: moveWindow,
    classification:
      scheduledDate && scheduledDate > asOfDate ? "future" : "open",
  };
}

function goalsForSubject(snapshot: DemoSnapshot, subjectUserId: string) {
  if (subjectUserId === DEMO_ALEX_ID) {
    return selectViewerVisibleGoals({
      goals: snapshot.goals.filter((goal) => !goal.is_deleted),
      partnerId: DEMO_JORDAN_ID,
      memberTeamIds: [DEMO_TEAM_ID],
    });
  }
  return snapshot.goals.filter(
    (goal) => goal.owner_id === subjectUserId && goal.team_id == null && !goal.is_deleted
  );
}

function completionsForSubject(snapshot: DemoSnapshot, subjectUserId: string) {
  return snapshot.completions.filter((completion) => completion.user_id === subjectUserId);
}


function groupCompletions(completions: Completion[]) {
  const grouped = new Map<string, Completion[]>();
  for (const completion of completions) {
    const existing = grouped.get(completion.goal_id) ?? [];
    existing.push(completion);
    grouped.set(completion.goal_id, existing);
  }
  return grouped;
}

function creditedCompletionForItem(snapshot: DemoSnapshot, item: DemoSnapshot["plannerItems"][number]) {
  return snapshot.completions.find(
    (completion) =>
      completion.goal_id === item.goal_id && completion.completed_on === item.scheduled_date
  );
}

export function buildDemoPlannerContext(
  scopeMonth: string,
  snapshot = getDemoStore()
): PlannerContextPayload {
  const alexGoals = goalsForSubject(snapshot, DEMO_ALEX_ID);
  const policy = createDefaultPlannerPolicy(
    DEMO_TIMEZONE,
    isoDateTime(snapshot.asOfDate)
  );
  const activeGoals: PlannerActiveGoalSnapshot[] = alexGoals.map((goal) => ({
    id: goal.id,
    goal_id: goal.id,
    original_goal_id: goal.id,
    requirement_fingerprint: `${goal.frequency_type}:${goal.recurrence_interval ?? "fixed"}`,
    title: goal.title,
    category: goal.category,
    color: goal.color,
    start_date: goal.start_date,
    end_date: goal.end_date,
  }));
  const monthStart = `${scopeMonth}-01`;
  const windowStart = addDaysIso(monthStart, -40);
  const windowEnd = addDaysIso(monthStart, 70);
  const monthItems = snapshot.plannerItems.filter(
    (item) =>
      item.scheduled_date >= windowStart &&
      item.scheduled_date <= windowEnd &&
      alexGoals.some((goal) => goal.id === item.goal_id)
  );
  const activeItems: PlannerActiveItemSnapshot[] = monthItems.map((item) => {
    return {
      id: item.id,
      plan_goal_id: item.goal_id,
      unit_key: item.unit_key,
      requirement_kind: item.requirement_kind,
      scheduled_date: item.scheduled_date,
      original_scheduled_date: item.original_scheduled_date,
      locked: item.locked,
      revision: item.revision,
    };
  });
  const workUnits: PlannerWorkUnit[] = activeItems.map((item) => {
    const goal = alexGoals.find((candidate) => candidate.id === item.plan_goal_id);
    const snapshotItem = monthItems.find((candidate) => candidate.id === item.id);
    const credited = snapshotItem
      ? creditedCompletionForItem(snapshot, snapshotItem)
      : undefined;
    const windows: DemoSessionWindows = goal
      ? demoSessionWindows({
          goal,
          scheduledDate: item.scheduled_date,
          credited: Boolean(credited),
          asOfDate: snapshot.asOfDate,
          visibleStart: windowStart,
          visibleEnd: windowEnd,
        })
      : {
          creditWindow: undefined,
          placementWindow: null,
          draftMoveWindow: null,
          classification: credited ? "fulfilled" : "open",
        };
    return {
      originalGoalId: item.plan_goal_id,
      unitKey: item.unit_key,
      kind: item.requirement_kind,
      label: snapshotItem?.label ?? goal?.title ?? null,
      scheduledDate: item.scheduled_date,
      creditState: credited ? "completed_as_scheduled" : "uncredited",
      creditedCompletionDate: credited?.completed_on ?? null,
      locked: item.locked,
      ...windows,
    };
  });
  const digest = sha256Hex(
    activeItems
      .map((item) => `${item.id}:${item.scheduled_date}:${item.revision}`)
      .join("|")
  );
  const goalTitles = Object.fromEntries(alexGoals.map((goal) => [goal.id, goal.title]));

  return {
    schemaVersion: "1",
    scopeMonth,
    asOfDate: snapshot.asOfDate,
    timezone: DEMO_TIMEZONE,
    goalTitles,
    links: [],
    preferences: {
      timezone: DEMO_TIMEZONE,
      timezoneConfirmedAt: isoDateTime(snapshot.asOfDate),
      policyRevision: 1,
      defaultPolicy: policy,
    },
    capabilities: {
      crossMonthMovesEnabled: true,
    },
    activePlan: {
      plan: {
        id: DEMO_PLAN_ID,
        version: 1,
        status: "active",
      },
      goals: activeGoals,
      items: activeItems,
    },
    preview: {
      eligibilityMode: "overlap_v1",
      preserveExistingAssignments: true,
      generationInputHash: digest,
      solver: {
        placementStatus: "complete",
        searchStatus: "all_units_placed",
        capacityStatus: "unverified",
        issueCodes: [],
        invalidGoalIds: [],
        publishable: true,
        confirmationRequired: false,
      },
      workUnits,
      eligibility: alexGoals.map((goal) => ({
        goalId: goal.id,
        eligible: true,
        reason: "eligible",
      })),
    },
    revisions: {
      canonicalRevision: 1,
      executionRevision: 1,
      scheduleDigest: digest,
    },
    staleness: {
      stale: false,
      reasons: [],
    },
    unplaceableGoals: [],
  };
}

export function buildDemoProgressContext({
  asOfDate,
  viewDate,
  factsFrom,
  factsTo,
  subjectUserId,
}: {
  asOfDate: string;
  viewDate?: string;
  factsFrom?: string;
  factsTo?: string;
  subjectUserId?: string;
}): ProgressContextResponse {
  const snapshot = getDemoStore();
  const subject = subjectUserId ?? DEMO_ALEX_ID;
  const goals = goalsForSubject(snapshot, subject);
  const completions = completionsForSubject(snapshot, subject);
  const completionsByGoal = groupCompletions(completions);
  const summaries = goals.map((goal) =>
    getGoalProgressSnapshot(goal, completionsByGoal.get(goal.id) ?? [], asOfDate, {
      weeklyAnchor: WEEKLY_ANCHOR,
    })
  );

  let facts: Completion[] = completions;
  if (viewDate) {
    facts = goals.flatMap((goal) => {
      const goalCompletions = completionsByGoal.get(goal.id) ?? [];
      if (goal.frequency_type !== "recurring" || isTargetedRecurringGoal(goal)) {
        return goalCompletions.filter((completion) => completion.completed_on === viewDate);
      }
      const period = getAnchoredPeriod(
        goal.start_date,
        goal.recurrence_interval ?? "daily",
        viewDate,
        WEEKLY_ANCHOR
      );
      return goalCompletions.filter(
        (completion) =>
          completion.completed_on >= period.start && completion.completed_on <= period.end
      );
    });
  } else if (factsFrom && factsTo) {
    facts = completions.filter(
      (completion) => completion.completed_on >= factsFrom && completion.completed_on <= factsTo
    );
  }

  return {
    schemaVersion: "1",
    asOfDate,
    timezone: snapshot.timezone,
    weekStartsOn: DEMO_WEEK_STARTS_ON,
    summaries,
    facts: facts.map((fact) => ({
      goal_id: fact.goal_id,
      completed_on: fact.completed_on,
      source: fact.source,
    })),
    truncated: false,
    correlationId: DEMO_CORRELATION_ID,
  };
}

export function buildDemoInsightsStats(subjectUserId?: string): InsightsStatsResponse {
  const snapshot = getDemoStore();
  const subject = subjectUserId ?? DEMO_ALEX_ID;
  const goals = goalsForSubject(snapshot, subject);
  const completions = completionsForSubject(snapshot, subject);
  const memberTeamIds = snapshot.teamMembers
    .filter((member) => member.user_id === subject)
    .map((member) => member.team_id);
  const completableGoalIds = buildCompletableGoalIds({
    goals,
    userId: subject,
    memberTeamIds,
  });
  const completableGoals = selectCompletableGoals(goals, completableGoalIds);
  const completionsByGoal = groupCompletions(completions);
  const summariesByGoal = new Map(
    completableGoals.map((goal) => [
      goal.id,
      getGoalProgressSnapshot(
        goal,
        completionsByGoal.get(goal.id) ?? [],
        snapshot.asOfDate,
        { weeklyAnchor: WEEKLY_ANCHOR }
      ),
    ])
  );
  const overall = buildInsightsStatsGroup({
    goals: completableGoals,
    completions,
    summariesByGoal,
    asOfDate: snapshot.asOfDate,
    weekStartsOn: DEMO_WEEK_STARTS_ON,
    accountCreatedDate: snapshot.profiles[0]?.created_at.slice(0, 10) ?? snapshot.asOfDate,
  });
  const teamGoals = completableGoals.filter((goal) => goal.team_id === DEMO_TEAM_ID);
  const team =
    subject === DEMO_ALEX_ID && teamGoals.length > 0
      ? buildInsightsStatsGroup({
          goals: teamGoals,
          completions: completions.filter((completion) =>
            teamGoals.some((goal) => goal.id === completion.goal_id)
          ),
          summariesByGoal: new Map(
            teamGoals.flatMap((goal) => {
              const summary = summariesByGoal.get(goal.id);
              return summary ? [[goal.id, summary] as const] : [];
            })
          ),
          asOfDate: snapshot.asOfDate,
          weekStartsOn: DEMO_WEEK_STARTS_ON,
          accountCreatedDate: snapshot.asOfDate,
        })
      : null;

  return {
    schemaVersion: "1",
    asOfDate: snapshot.asOfDate,
    weekStartsOn: DEMO_WEEK_STARTS_ON,
    accountCreatedDate: snapshot.profiles[0]?.created_at.slice(0, 10) ?? snapshot.asOfDate,
    overall,
    team,
    correlationId: DEMO_CORRELATION_ID,
  };
}

export function buildDemoXpProfile() {
  const totalXp = 2460;
  const progression = progressionForTotalXp(totalXp);
  return {
    schemaVersion: "1" as const,
    correlationId: DEMO_CORRELATION_ID,
    profile: {
      totalXp,
      currentLevel: progression.currentLevel,
      currentLevelMinXp: progression.currentLevelMinXp,
      nextLevel: progression.nextLevel,
      nextLevelMinXp: progression.nextLevelMinXp,
      xpToNextLevel: progression.xpToNextLevel,
    },
    tracks: [
      {
        trackKey: "health",
        label: "Health",
        totalXp: 980,
        currentLevel: progressionForTotalXp(980).currentLevel,
      },
      {
        trackKey: "career",
        label: "Career",
        totalXp: 720,
        currentLevel: progressionForTotalXp(720).currentLevel,
      },
    ],
    nextReward: {
      level: (progression.nextLevel ?? progression.currentLevel + 1),
      code: "altitude_band",
      title: "Next altitude",
      description: "Keep completing planned work to climb.",
    },
    pendingAwards: [] as Array<{
      awardId: string;
      trackKey: string;
      level: number;
      title: string;
      description: string;
    }>,
  };
}

export function buildDemoAchievements(): AchievementsShowcasePayload {
  const snapshot = getDemoStore();
  const goals = goalsForSubject(snapshot, DEMO_ALEX_ID);
  const completions = completionsForSubject(snapshot, DEMO_ALEX_ID);
  const progression = progressionForTotalXp(420);
  const unlockedAt = isoDateTime(snapshot.asOfDate, 8);

  return buildAchievementsShowcasePayload({
    goals,
    completions,
    asOfDate: snapshot.asOfDate,
    totalXp: 420,
    rewardCatalog: [
      {
        id: "70000000-0000-4000-8000-000000000010",
        level: 2,
        reward_code: "xp.level.2",
        reward_title: "Level 2 unlocked",
        reward_description: "You reached Level 2.",
      },
      {
        id: "70000000-0000-4000-8000-000000000011",
        level: 4,
        reward_code: "xp.level.4",
        reward_title: "Level 4 unlocked",
        reward_description: "You reached Level 4.",
      },
      {
        id: "70000000-0000-4000-8000-000000000012",
        level: 6,
        reward_code: "xp.level.6",
        reward_title: "Level 6 unlocked",
        reward_description: "You reached Level 6.",
      },
      {
        id: "70000000-0000-4000-8000-000000000013",
        level: 8,
        reward_code: "xp.level.8",
        reward_title: "Level 8 unlocked",
        reward_description: "You reached Level 8.",
      },
      {
        id: "70000000-0000-4000-8000-000000000014",
        level: 10,
        reward_code: "xp.level.10",
        reward_title: "Level 10 unlocked",
        reward_description: "You reached Level 10.",
      },
    ],
    userAwards: progression.currentLevel >= 5
      ? [
          {
            id: "70000000-0000-4000-8000-000000000001",
            unlocked_at: unlockedAt,
            acknowledged_at: null,
            revoked_at: null,
            xp_rewards: {
              level: 4,
              reward_code: "xp.level.4",
              reward_title: "Level 4 unlocked",
              reward_description: "You reached Level 4.",
            },
          },
        ]
      : [],
    truncated: {
      goals: false,
      completions: false,
    },
  });
}

export function buildDemoNotificationPreferences() {
  return {
    notificationPreferences: defaultNotificationPreferences,
  };
}
