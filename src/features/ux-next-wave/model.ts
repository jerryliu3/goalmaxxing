export type Concept = "prism" | "tempo" | "weave" | "mosaic" | "script";
export type Destination = "planner" | "progress" | "community";
export type Goal = "Endurance" | "Product" | "Strength" | "Personal";
export type Item = {
  id: string;
  title: string;
  goal: Goal;
  minutes: number;
  day: number | null;
  time: string;
  done: boolean;
  kind: "goal" | "task";
};
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const GOALS: Goal[] = ["Endurance", "Product", "Strength", "Personal"];
export const SEED: Item[] = [
  {
    id: "run-mon",
    title: "Easy run",
    goal: "Endurance",
    minutes: 30,
    day: 0,
    time: "07:30",
    done: true,
    kind: "goal",
  },
  {
    id: "work-mon",
    title: "Deep work",
    goal: "Product",
    minutes: 60,
    day: 0,
    time: "09:00",
    done: true,
    kind: "goal",
  },
  {
    id: "work",
    title: "Deep work",
    goal: "Product",
    minutes: 90,
    day: 1,
    time: "09:00",
    done: true,
    kind: "goal",
  },
  {
    id: "run",
    title: "Tempo run",
    goal: "Endurance",
    minutes: 45,
    day: 1,
    time: "17:30",
    done: false,
    kind: "goal",
  },
  {
    id: "notes",
    title: "Launch notes",
    goal: "Product",
    minutes: 30,
    day: 1,
    time: "19:00",
    done: false,
    kind: "task",
  },
  {
    id: "read",
    title: "Read 20 pages",
    goal: "Personal",
    minutes: 25,
    day: 1,
    time: "21:00",
    done: false,
    kind: "goal",
  },
  {
    id: "strength",
    title: "Strength session",
    goal: "Strength",
    minutes: 30,
    day: null,
    time: "18:00",
    done: false,
    kind: "goal",
  },
  {
    id: "offer",
    title: "Review offer",
    goal: "Personal",
    minutes: 20,
    day: null,
    time: "12:00",
    done: false,
    kind: "task",
  },
  {
    id: "work-wed",
    title: "Deep work",
    goal: "Product",
    minutes: 60,
    day: 2,
    time: "09:00",
    done: false,
    kind: "goal",
  },
  {
    id: "run-thu",
    title: "Easy run",
    goal: "Endurance",
    minutes: 30,
    day: 3,
    time: "07:30",
    done: false,
    kind: "goal",
  },
  {
    id: "work-thu",
    title: "Deep work",
    goal: "Product",
    minutes: 60,
    day: 3,
    time: "09:00",
    done: false,
    kind: "goal",
  },
  {
    id: "strength-fri",
    title: "Strength session",
    goal: "Strength",
    minutes: 30,
    day: 4,
    time: "18:00",
    done: false,
    kind: "goal",
  },
  {
    id: "long",
    title: "Long run",
    goal: "Endurance",
    minutes: 60,
    day: 5,
    time: "08:00",
    done: false,
    kind: "goal",
  },
];
export const CONCEPTS: {
  id: Concept;
  name: string;
  n: string;
  tagline: string;
  thesis: string;
  gesture: string;
  risk: string;
  references: string[];
}[] = [
  {
    id: "prism",
    name: "Prism",
    n: "01",
    tagline: "A little depth. A lot of clarity.",
    thesis:
      "Time has depth. Lift a day out of the week; let each completion become a tangible layer of progress.",
    gesture:
      "Open a glass day, finish Tempo run, then watch Progress gain a layer.",
    risk: "Perspective must never obscure dates. Glass belongs on navigation; readable content needs a stable backing.",
    references: ["Apple · material hierarchy", "Things · expanding objects"],
  },
  {
    id: "tempo",
    name: "Tempo",
    n: "02",
    tagline: "Make room for real life.",
    thesis:
      "Your available time is the main control. Change the budget and review a smaller, achievable day before saving.",
    gesture:
      "Reduce the time budget to 60 minutes. Preview and save the proposed move.",
    risk: "Minutes express workload, not worth. Suggestions must protect completed work and require an explicit save.",
    references: ["Structured · visible time", "Oura · one useful insight"],
  },
  {
    id: "weave",
    name: "Weave",
    n: "03",
    tagline: "See the rhythm. Shape the week.",
    thesis:
      "Goals run horizontally through time. Place sessions in their lanes and see how small actions form a repeatable rhythm.",
    gesture:
      "Select an empty lane cell to place an unplanned session, or open an existing one to move it.",
    risk: "Dense weeks need clear labels and horizontal navigation. Patterns are evidence, never an opaque score.",
    references: ["Amie · tasks in time", "Things · contextual insertion"],
  },
  {
    id: "mosaic",
    name: "Mosaic",
    n: "04",
    tagline: "Small pieces. A life taking shape.",
    thesis:
      "Make the day a composition of generous touch targets. Finished work becomes a growing, inspectable collection.",
    gesture:
      "Open a tile and mark it complete. Inspect the matching tile in Progress.",
    risk: "Different block sizes must communicate duration. A beautiful arrangement cannot hide chronology.",
    references: [
      "Apple Fitness · accumulated effort",
      "Partiful · expressive utility",
    ],
  },
  {
    id: "script",
    name: "Script",
    n: "05",
    tagline: "Less arranging. More living.",
    thesis:
      "A day reads like a clear sentence. Intent becomes an explicit plan amendment with dates, scope, and an undo.",
    gesture:
      "Choose a suggestion or enter “Move Tempo run to Friday”. Review the exact change before saving.",
    risk: "Language can hide assumptions. The prototype supports three disclosed commands; a real parser is future work.",
    references: ["Things · natural date input", "Amie · quick entry"],
  },
];
export const goalClass = (goal: Goal) => goal.toLowerCase();
export const dateLabel = (day: number | null) =>
  day === null ? "Unplanned" : `${DAYS[day]}, Sep ${day + 7}`;
export const minutesLabel = (minutes: number) =>
  minutes < 60
    ? `${minutes}m`
    : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`;
export function planMove(
  items: Item[],
  id: string,
  day: number | null,
): Item[] {
  return items.map((item) =>
    item.id === id && !item.done ? { ...item, day } : item,
  );
}
export function completeItem(items: Item[], id: string): Item[] {
  return items.map((item) =>
    item.id === id && item.day !== null ? { ...item, done: !item.done } : item,
  );
}
export function lightenDay(items: Item[], day: number, budget: number): Item[] {
  let remaining = items
    .filter((x) => x.day === day && !x.done)
    .reduce((sum, x) => sum + x.minutes, 0);
  const moveIds = new Set<string>();
  for (const item of [...items].reverse()) {
    if (item.day === day && !item.done && remaining > budget) {
      moveIds.add(item.id);
      remaining -= item.minutes;
    }
  }
  return items.map((x) =>
    moveIds.has(x.id) ? { ...x, day: day < 6 ? day + 1 : null } : x,
  );
}
export function changesBetween(before: Item[], after: Item[]) {
  return after.flatMap((item) => {
    const prev = before.find((x) => x.id === item.id);
    return prev && prev.day !== item.day
      ? [{ item, from: prev.day, to: item.day }]
      : [];
  });
}
