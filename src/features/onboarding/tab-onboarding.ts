export type TabOnboardingKey =
  | "insights.main"
  | "planner.calendar"
  | "social.main";

export const TAB_ONBOARDING_QUERY_PARAM = "onboarding";
export const TAB_ONBOARDING_COMPLETED_PREFIX =
  "cadence.tab_onboarding_completed.v1:";
export const TAB_ONBOARDING_CHANGE_EVENT = "cadence.tab_onboarding.change";

export interface TabOnboardingStep {
  title: string;
  description: string;
  target: string;
  fallbackTargets?: string[];
}

export const TAB_ONBOARDING_TOURS: Record<TabOnboardingKey, TabOnboardingStep[]> = {
  "planner.calendar": [
    {
      title: "Planner views",
      description: "Switch between Calendar, Checklist, and Tasks here.",
      target: "planner.surfaces",
    },
    {
      title: "Plan your sessions",
      description: "Use Month/Week/Day and Filters to shape the calendar.",
      target: "planner.calendar.controls",
    },
    {
      title: "Try the board",
      description:
        "Drag sessions to rearrange them. That opens Planning Mode so you can preview, then Save or Undo.",
      target: "planner.calendar.today",
      fallbackTargets: ["planner.calendar.item", "planner.calendar.board"],
    },
  ],
  "insights.main": [
    {
      title: "Overall stats",
      description: "See streaks and activity over time in this card.",
      target: "insights.overall",
    },
    {
      title: "Goal stats",
      description: "Open filters to focus on specific goals and dates.",
      target: "insights.goal-stats",
    },
    {
      title: "Edit a missed day",
      description:
        "Tap a past day on a goal if you forgot to mark a completion.",
      target: "insights.goal",
      fallbackTargets: ["insights.goal-stats"],
    },
  ],
  "social.main": [
    {
      title: "Feed",
      description:
        "Feed shows recent progress from you and others so you can stay connected.",
      target: "social.feed",
    },
    {
      title: "Challenges and leaderboards",
      description:
        "Join Challenges for shared competitions, and use Leaderboards to compare consistent progress.",
      target: "social.compete",
    },
    {
      title: "Partner up",
      description: "Open Team to invite a friend and keep each other accountable.",
      target: "social.team",
    },
  ],
};

function tabOnboardingStorageKey(onboardingKey: string) {
  return `${TAB_ONBOARDING_COMPLETED_PREFIX}${onboardingKey}`;
}

export function isTabOnboardingCompleted(onboardingKey: TabOnboardingKey) {
  if (typeof window === "undefined") {
    return true;
  }
  return window.localStorage.getItem(tabOnboardingStorageKey(onboardingKey)) === "done";
}

export function markTabOnboardingCompleted(onboardingKey: TabOnboardingKey) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(tabOnboardingStorageKey(onboardingKey), "done");
  window.dispatchEvent(new Event(TAB_ONBOARDING_CHANGE_EVENT));
}

export function clearAllTabOnboardingProgress() {
  if (typeof window === "undefined") {
    return;
  }
  const keysToRemove: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(TAB_ONBOARDING_COMPLETED_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    window.localStorage.removeItem(key);
  }
  window.dispatchEvent(new Event(TAB_ONBOARDING_CHANGE_EVENT));
}

export function subscribeTabOnboarding(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener(TAB_ONBOARDING_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(TAB_ONBOARDING_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export interface TabOnboardingReplayLink {
  key: TabOnboardingKey;
  label: string;
  href: string;
}

export const TAB_ONBOARDING_REPLAY_LINKS: TabOnboardingReplayLink[] = [
  {
    key: "planner.calendar",
    label: "Calendar",
    href: `/calendar?surface=calendar&${TAB_ONBOARDING_QUERY_PARAM}=planner.calendar`,
  },
  {
    key: "insights.main",
    label: "Insights",
    href: `/insights?${TAB_ONBOARDING_QUERY_PARAM}=insights.main`,
  },
  {
    key: "social.main",
    label: "Community",
    href: `/social?${TAB_ONBOARDING_QUERY_PARAM}=social.main`,
  },
];
