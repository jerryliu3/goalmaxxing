export type TabOnboardingKey =
  | "insights.main"
  | "planner.calendar"
  | "social.main";

export const TAB_ONBOARDING_QUERY_PARAM = "onboarding";
export interface TabOnboardingStep {
  title: string;
  description: string;
  target: string;
  fallbackTargets?: string[];
}

export const TAB_ONBOARDING_TOURS: Record<TabOnboardingKey, TabOnboardingStep[]> = {
  "planner.calendar": [
    {
      title: "Agenda views",
      description:
        "Day opens at today by default. Use Week or Month to plan ahead, or Goal View to browse sessions by goal and see them together in a calendar.",
      target: "planner.calendar.controls",
    },
    {
      title: "Try the board",
      description:
        "Drag sessions to rearrange them. That opens Planning mode so you can preview, then Save or Discard from the bar at the bottom.",
      target: "planner.calendar.today",
      fallbackTargets: ["planner.calendar.item", "planner.calendar.board"],
    },
  ],
  "insights.main": [
    {
      title: "Achievements",
      description: "Look back on the awards you have earned through your progress.",
      target: "insights.achievements",
      fallbackTargets: ["insights.history"],
    },
    {
      title: "Progress tracker",
      description: "Track the activity that shapes your goals over time.",
      target: "insights.history",
    },
  ],
  "social.main": [
    {
      title: "Leaderboards",
      description:
        "Compare consistent progress with the rest of the community. Challenges appear here too when any are active.",
      target: "social.leaderboards",
      fallbackTargets: ["social.team"],
    },
    {
      title: "Team",
      description: "Invite a friend and keep team goals next to the people you share them with.",
      target: "social.team",
    },
  ],
};

export const APP_TAB_TOUR_STEPS: TabOnboardingStep[] = [
  { title: "Agenda", target: "nav.calendar", description: "Do today’s sessions here. Switch to Week, Month, or Goal View when you want to plan." },
  { title: "Goals", target: "nav.goals", description: "Create and refine your current goals, or open your past goals." },
  { title: "Growth", target: "nav.growth", description: "Your Goal score, achievements, stats, and progress tracker live here." },
  { title: "Community", target: "nav.social", description: "Find your team, challenges, and leaderboards. Your avatar opens profile and Settings." },
];

export interface TabOnboardingReplayLink {
  key: TabOnboardingKey;
  label: string;
  href: string;
}

export const TAB_ONBOARDING_REPLAY_LINKS: TabOnboardingReplayLink[] = [
  {
    key: "planner.calendar",
    label: "Agenda",
    href: `/calendar?${TAB_ONBOARDING_QUERY_PARAM}=planner.calendar`,
  },
  {
    key: "insights.main",
    label: "Growth",
    href: `/growth?${TAB_ONBOARDING_QUERY_PARAM}=insights.main`,
  },
  {
    key: "social.main",
    label: "Community",
    href: `/social?${TAB_ONBOARDING_QUERY_PARAM}=social.main`,
  },
];
