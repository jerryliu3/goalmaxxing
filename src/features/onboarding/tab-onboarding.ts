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
      title: "Agenda views",
      description:
        "Today is your default. Switch to Week or Month to plan ahead.",
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
      title: "Completion history",
      description:
        "Open a goal, then tap a past or today cell to log a missed session.",
      target: "insights.history",
      fallbackTargets: ["insights.week", "insights.views"],
    },
    {
      title: "Past goals",
      description:
        "Completed, ended, and archived goals collect here with their original outcomes.",
      target: "insights.past-goals",
    },
    {
      title: "Log a missed day",
      description:
        "Open Completion history, select one goal, then tap a past or today cell.",
      target: "insights.history",
      fallbackTargets: ["insights.overall", "insights.goal-stats"],
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
    label: "Agenda",
    href: `/calendar?${TAB_ONBOARDING_QUERY_PARAM}=planner.calendar`,
  },
  {
    key: "insights.main",
    label: "Achieved",
    href: `/achievements?${TAB_ONBOARDING_QUERY_PARAM}=insights.main`,
  },
  {
    key: "social.main",
    label: "Community",
    href: `/social?${TAB_ONBOARDING_QUERY_PARAM}=social.main`,
  },
];
