import type { ConceptTone } from "@/features/ux-concepts/seed";

export type StudyGoal = {
  id: string;
  name: string;
  why: string;
  target: number;
  days: number[];
  next: string;
  parentId?: string;
  tone: ConceptTone;
};

export const STUDY_TODAY_DAY = 17;

export const STUDY_GOALS: readonly StudyGoal[] = [
  {
    id: "tempo-run",
    name: "Tempo run",
    why: "Feel strong and free on longer runs.",
    target: 8,
    days: [4, 7, 10, 14],
    next: "A comfortable 12 km",
    parentId: "move-regularly",
    tone: "emerald",
  },
  {
    id: "strength",
    name: "Strength",
    why: "Build a body I can rely on.",
    target: 8,
    days: [5, 8, 12, 16],
    next: "Three consistent training weeks",
    parentId: "move-regularly",
    tone: "violet",
  },
  {
    id: "read",
    name: "Read",
    why: "Make room for ideas outside my everyday work.",
    target: 12,
    days: [4, 5, 7, 9, 11, 14, 16],
    next: "Finish The Creative Act",
    tone: "blue",
  },
  {
    id: "thesis",
    name: "Thesis",
    why: "Turn a question I care about into something useful.",
    target: 12,
    days: [5, 8, 10, 13, 15],
    next: "Complete the first chapter",
    tone: "amber",
  },
  {
    id: "move-regularly",
    name: "Move regularly",
    why: "Keep movement part of my everyday life.",
    target: 16,
    days: [],
    next: "Keep a sustainable weekly rhythm",
    tone: "emerald",
  },
];

export const CONSTELLATION_POSITIONS: Record<string, { left: number; top: number }> =
  {
    "tempo-run": { left: 23, top: 46 },
    strength: { left: 77, top: 46 },
    read: { left: 77, top: 86 },
    thesis: { left: 23, top: 86 },
    "move-regularly": { left: 50, top: 12 },
  };

export const CONSTELLATION_LINKS = [
  { from: "tempo-run", to: "move-regularly" },
  { from: "strength", to: "move-regularly" },
] as const;

export function loggedDaysForGoal(goals: readonly StudyGoal[], id: string): number[] {
  const byId = new Map(goals.map((goal) => [goal.id, goal]));
  const collect = (goalId: string, seen: Set<string>): number[] => {
    if (seen.has(goalId)) {
      return [];
    }
    seen.add(goalId);
    const goal = byId.get(goalId);
    if (!goal) {
      return [];
    }
    const childDays = goals
      .filter((child) => child.parentId === goalId)
      .flatMap((child) => collect(child.id, seen));
    return [...new Set([...goal.days, ...childDays])].sort((a, b) => a - b);
  };
  return collect(id, new Set());
}

export function toggleGoalDay(
  goals: readonly StudyGoal[],
  id: string,
  day: number
): StudyGoal[] {
  return goals.map((goal) => {
    if (goal.id !== id) {
      return goal;
    }
    const exists = goal.days.includes(day);
    return {
      ...goal,
      days: exists ? goal.days.filter((value) => value !== day) : [...goal.days, day],
    };
  });
}
