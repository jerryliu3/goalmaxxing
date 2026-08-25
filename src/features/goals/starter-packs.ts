import { addDaysToDateString } from "@/lib/goals/periods";

export const STARTER_PACKS = [
  {
    key: "health",
    label: "Health",
  },
  {
    key: "fitness",
    label: "Fitness",
  },
  {
    key: "career",
    label: "Career",
  },
  {
    key: "personal",
    label: "Personal",
  },
  {
    key: "relationships",
    label: "Relationships",
  },
] as const;

export type StarterPackKey = (typeof STARTER_PACKS)[number]["key"];

export const STARTER_PACKS_SEEN_PREFIX = "cadence.starter_packs_seen.v1:";
export const STARTER_PACKS_CHANGE_EVENT = "cadence.starter_packs.change";

function starterPacksSeenStorageKey(userId: string) {
  return `${STARTER_PACKS_SEEN_PREFIX}${userId || "anon"}`;
}

export function isStarterPacksSeen(userId: string) {
  if (typeof window === "undefined") {
    return true;
  }
  return window.localStorage.getItem(starterPacksSeenStorageKey(userId)) === "done";
}

export function markStarterPacksSeen(userId: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(starterPacksSeenStorageKey(userId), "done");
  window.dispatchEvent(new Event(STARTER_PACKS_CHANGE_EVENT));
}

export function subscribeStarterPacksSeen(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener(STARTER_PACKS_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(STARTER_PACKS_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function clearAllStarterPacksSeen() {
  if (typeof window === "undefined") {
    return;
  }
  const keysToRemove: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(STARTER_PACKS_SEEN_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    window.localStorage.removeItem(key);
  }
  window.dispatchEvent(new Event(STARTER_PACKS_CHANGE_EVENT));
}

export function resolveStarterPackKey(rawValue: string | null): StarterPackKey | null {
  if (!rawValue) {
    return null;
  }
  if (STARTER_PACKS.some((pack) => pack.key === rawValue)) {
    return rawValue as StarterPackKey;
  }
  return null;
}

export function buildStarterPackRows(pack: StarterPackKey, anchorDate: string) {
  switch (pack) {
    case "health":
      return [
      {
        title: "Hydration check-ins",
        description: "Log a few intentional hydration check-ins across the next quarter.",
        category: "Health",
        color: "#14b8a6",
        frequency_type: "recurring",
        recurrence_interval: "daily",
        target_count: "6",
        target_basis: "lifetime",
        start_date: anchorDate,
        end_date: addDaysToDateString(anchorDate, 90),
      },
      {
        title: "Meal prep session",
        description: "Run a weekly meal prep block so busy weeks stay easier to eat well.",
        category: "Health",
        color: "#f97316",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        target_count: "10",
        target_basis: "lifetime",
        start_date: anchorDate,
        end_date: addDaysToDateString(anchorDate, 112),
      },
      {
        title: "Complete a health checkup",
        description: "Book, complete, and review a checkup so the follow-through is a project.",
        category: "Health",
        color: "#6366f1",
        frequency_type: "fixed_milestones",
        target_count: "3",
        milestone_names: "Book visit|Complete labs|Review results",
        start_date: anchorDate,
        end_date: addDaysToDateString(anchorDate, 150),
      },
    ] as Record<string, unknown>[];

    case "fitness":
      return [
      {
        title: "Strength training",
        description: "Complete a focused block of strength sessions over the next 12 weeks.",
        category: "Fitness",
        color: "#dc2626",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        target_count: "12",
        target_basis: "lifetime",
        start_date: anchorDate,
        end_date: addDaysToDateString(anchorDate, 84),
      },
      {
        title: "Mobility sessions",
        description: "Schedule mobility work on a weekly cadence to stay injury resistant.",
        category: "Fitness",
        color: "#0ea5e9",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        target_count: "8",
        target_basis: "lifetime",
        start_date: anchorDate,
        end_date: addDaysToDateString(anchorDate, 70),
      },
      {
        title: "Run a 5K milestone plan",
        description: "Build up to a full 5K through progressive checkpoints, not daily mileage.",
        category: "Fitness",
        color: "#22c55e",
        frequency_type: "fixed_milestones",
        target_count: "4",
        milestone_names: "1K run|2K run|3.5K run|5K run",
        start_date: anchorDate,
        end_date: addDaysToDateString(anchorDate, 90),
      },
    ] as Record<string, unknown>[];

    case "career":
      return [
      {
        title: "Weekly deep work block",
        description: "Protect focused work sessions for your highest leverage projects.",
        category: "Career",
        color: "#8b5cf6",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        target_count: "14",
        target_basis: "lifetime",
        start_date: anchorDate,
        end_date: addDaysToDateString(anchorDate, 98),
      },
      {
        title: "Portfolio update cadence",
        description: "Ship a few visible portfolio updates across the next two quarters.",
        category: "Career",
        color: "#6366f1",
        frequency_type: "recurring",
        recurrence_interval: "monthly",
        target_count: "4",
        target_basis: "lifetime",
        start_date: anchorDate,
        end_date: addDaysToDateString(anchorDate, 180),
      },
      {
        title: "Promotion packet milestones",
        description: "Collect artifacts and outcomes required for your next review cycle.",
        category: "Career",
        color: "#0ea5e9",
        frequency_type: "fixed_milestones",
        target_count: "3",
        milestone_names: "Impact evidence|Manager sync|Packet finalized",
        start_date: anchorDate,
        end_date: addDaysToDateString(anchorDate, 120),
      },
    ] as Record<string, unknown>[];

    case "personal":
      return [
      {
        title: "Weekly planning reset",
        description: "Set next-week priorities once, instead of running a daily planning habit.",
        category: "Personal",
        color: "#6366f1",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        target_count: "8",
        target_basis: "lifetime",
        start_date: anchorDate,
        end_date: addDaysToDateString(anchorDate, 70),
      },
      {
        title: "Life admin sweep",
        description: "Clear errands, docs, and inbox backlog before the next stretch starts.",
        category: "Personal",
        color: "#f59e0b",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        target_count: "6",
        target_basis: "lifetime",
        start_date: anchorDate,
        end_date: addDaysToDateString(anchorDate, 84),
      },
      {
        title: "Declutter your space",
        description: "Finish a short project to tidy the highest-friction spots at home.",
        category: "Personal",
        color: "#14b8a6",
        frequency_type: "fixed_milestones",
        target_count: "3",
        milestone_names: "Desk reset|Closet pass|Kitchen reset",
        start_date: anchorDate,
        end_date: addDaysToDateString(anchorDate, 50),
      },
    ] as Record<string, unknown>[];

    case "relationships":
      return [
    {
      title: "Weekly partner check-in",
      description: "Set intentional check-ins to align on goals and support.",
      category: "Relationships",
      color: "#f43f5e",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: "10",
      start_date: anchorDate,
      end_date: addDaysToDateString(anchorDate, 90),
    },
    {
      title: "Appreciation notes",
      description: "Send a handful of specific notes over the next quarter, not a daily streak.",
      category: "Relationships",
      color: "#fb7185",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: "8",
      start_date: anchorDate,
      end_date: addDaysToDateString(anchorDate, 84),
    },
    {
      title: "Plan quality time",
      description: "Create and complete a few meaningful shared experiences.",
      category: "Relationships",
      color: "#ec4899",
      frequency_type: "fixed_milestones",
      target_count: "3",
      milestone_names: "Pick activity|Set date|Complete activity",
      start_date: anchorDate,
      end_date: addDaysToDateString(anchorDate, 75),
    },
  ] as Record<string, unknown>[];
    default: {
      const exhaustive: never = pack;
      throw new Error(`Unsupported starter pack: ${String(exhaustive)}`);
    }
  }
}
