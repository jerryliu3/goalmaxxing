import {
  CONCEPT_PARTNER_NAME,
  CONCEPT_VIEWER_NAME,
  CONCEPT_WEEK_DONE,
  CONCEPT_WEEK_PLANNED,
  type ConceptTone,
} from "@/features/ux-concepts/seed";

export interface ConceptGoalStat {
  id: string;
  title: string;
  done: number;
  planned: number;
  period: string;
  tone: ConceptTone;
  unplaced?: boolean;
}

export const conceptGoalStats: readonly ConceptGoalStat[] = [
  {
    id: "tempo-run",
    title: "Tempo run",
    done: 8,
    planned: 12,
    period: "September",
    tone: "emerald",
  },
  {
    id: "deep-work",
    title: "Deep work",
    done: 18,
    planned: 22,
    period: "September",
    tone: "blue",
  },
  {
    id: "strength",
    title: "Strength",
    done: 3,
    planned: 8,
    period: "September",
    tone: "violet",
    unplaced: true,
  },
  {
    id: "weekly-reset",
    title: "Weekly reset",
    done: 3,
    planned: 4,
    period: "September",
    tone: "blue",
  },
  {
    id: "team-sync",
    title: "Team sync",
    done: 2,
    planned: 4,
    period: "September",
    tone: "violet",
  },
  {
    id: "long-ride",
    title: "Long ride",
    done: 2,
    planned: 4,
    period: "September",
    tone: "emerald",
  },
] as const;

export const weekPulseLabel = `${CONCEPT_WEEK_DONE} of ${CONCEPT_WEEK_PLANNED}`;

export const conceptCompletionCounts: Readonly<Record<string, number>> = {
  "2026-08-30": 2,
  "2026-08-31": 1,
  "2026-09-01": 0,
  "2026-09-02": 3,
  "2026-09-03": 1,
  "2026-09-04": 0,
  "2026-09-05": 0,
  "2026-09-06": 0,
  "2026-09-07": 2,
  "2026-09-08": 2,
  "2026-09-09": 1,
};

export const conceptCompletionsOnDate: Readonly<
  Record<string, readonly { title: string; who: "self" | "partner" }[]>
> = {
  "2026-09-01": [],
  "2026-09-02": [
    { title: "Deep work", who: "self" },
    { title: "Tempo run", who: "self" },
    { title: "Yoga", who: "partner" },
  ],
  "2026-09-03": [{ title: "Deep work", who: "self" }],
};

export const partnerWeekItems = [
  {
    id: "maya-yoga-tue",
    title: "Yoga",
    date: "2026-09-01",
    completed: true,
  },
  {
    id: "maya-yoga-thu",
    title: "Yoga",
    date: "2026-09-03",
    completed: true,
  },
  {
    id: "maya-pages",
    title: "Read 20 pages",
    date: "2026-09-02",
    completed: true,
  },
  {
    id: "maya-call",
    title: "Call mom",
    date: "2026-09-04",
    completed: false,
  },
] as const;

export const quietCircleEvents = [
  {
    id: "evt-yoga",
    actor: CONCEPT_PARTNER_NAME,
    text: "completed Yoga",
    tone: "violet" as const,
  },
  {
    id: "evt-deep",
    actor: CONCEPT_VIEWER_NAME,
    text: "completed Deep work",
    tone: "blue" as const,
  },
  {
    id: "evt-challenge",
    actor: "September movement",
    text: "8 of 12 Tempo runs",
    tone: "emerald" as const,
  },
] as const;

export const conceptChallenge = {
  title: "September movement",
  metric: "8 of 12 Tempo runs",
  copy: "A challenge you joined. Not a fourth tab.",
} as const;

export const youControlGroups = [
  {
    id: "plan",
    title: "Plan",
    rows: [
      {
        id: "week-start",
        label: "First day of week",
        value: "Sunday",
      },
      {
        id: "primary-tab",
        label: "Primary planner tab",
        value: "Checklist first · stored, unused on web",
      },
    ],
  },
  {
    id: "connected",
    title: "Connected",
    rows: [
      {
        id: "notifications",
        label: "Notifications",
        value: "Daily reminders on · Team updates on",
      },
      {
        id: "privacy",
        label: "Privacy",
        value: "Social activity visible",
      },
      {
        id: "health",
        label: "Apple Health",
        value: "Not connected in this prototype",
      },
    ],
  },
  {
    id: "account",
    title: "Account",
    rows: [
      {
        id: "profile",
        label: "Username and email",
        value: `${CONCEPT_VIEWER_NAME.toLowerCase()} · alex@goalmaxxing.test`,
      },
      {
        id: "sign-out",
        label: "Sign out",
        value: "Ends the session",
      },
    ],
  },
] as const;

export const conceptGoalCompletionDates: Readonly<Record<string, readonly string[]>> =
  {
    "tempo-run": [
      "2026-08-07",
      "2026-08-11",
      "2026-08-14",
      "2026-08-18",
      "2026-08-21",
      "2026-08-25",
      "2026-08-30",
      "2026-09-02",
    ],
    "deep-work": [
      "2026-08-30",
      "2026-08-31",
      "2026-09-02",
      "2026-09-03",
    ],
    strength: ["2026-08-04", "2026-08-18", "2026-08-25"],
    "weekly-reset": ["2026-08-10", "2026-08-17", "2026-08-24"],
    "team-sync": ["2026-08-14", "2026-08-28"],
    "long-ride": ["2026-08-16", "2026-08-23"],
  };

export const partnerGoalRates: Readonly<Record<string, { done: number; planned: number }>> =
  {
    "tempo-run": { done: 6, planned: 12 },
    "deep-work": { done: 20, planned: 22 },
    strength: { done: 5, planned: 8 },
    "weekly-reset": { done: 4, planned: 4 },
    "team-sync": { done: 3, planned: 4 },
    "long-ride": { done: 3, planned: 4 },
  };

export const communityChallenges = [
  {
    id: "september-movement",
    title: "September movement",
    metric: "8 of 12 Tempo runs",
    scope: "Joined",
  },
  {
    id: "team-active-days",
    title: "Team active days",
    metric: "12 of 20 days",
    scope: "Team",
  },
] as const;

export const communityLeaderboard = [
  { rank: 1, name: "Priya", score: "14 days" },
  { rank: 2, name: CONCEPT_PARTNER_NAME, score: "11 days" },
  { rank: 4, name: CONCEPT_VIEWER_NAME, score: "7 days", you: true },
] as const;

export const communityTeamGoals = [
  {
    id: "team-sync",
    title: "Team sync",
    detail: "Weekly · placed Friday",
  },
  {
    id: "weekend-hike",
    title: "Weekend hike",
    detail: "Team goal · not on your personal week",
  },
] as const;
