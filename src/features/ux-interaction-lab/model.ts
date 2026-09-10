import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Goal } from "@/lib/goals/types";
import type { GoalCreateKind } from "@/lib/goals/form-options";

export const TODAY = "2026-09-09";
export type Concept = "fold" | "switchboard" | "index" | "lens" | "glide";
export type View = "month" | "week" | "day" | "list";
export type Destination = "plan" | "goals" | "progress" | "people";
export const CONCEPTS: {
  id: Concept;
  name: string;
  verb: string;
  thesis: string;
  trial: string;
  risk: string;
}[] = [
  {
    id: "fold",
    name: "Fold",
    verb: "Open in place",
    thesis:
      "A date unfolds into the work inside it. Keep the bigger picture in sight.",
    trial:
      "Open September 11 in the month. Move an item, then unfold its new date.",
    risk: "Expanding content can shift the page. Keep one day open and preserve its calendar anchor.",
  },
  {
    id: "switchboard",
    name: "Switchboard",
    verb: "Pick up & place",
    thesis:
      "Gather several items, then give them a new date in one deliberate move.",
    trial:
      "Select two items, choose a date on the board, review the pair, then undo.",
    risk: "Selection mode must stay obvious. A move must never be mistaken for completion.",
  },
  {
    id: "index",
    name: "Index",
    verb: "Browse without losing place",
    thesis:
      "A big goal collection becomes a fast, navigable index with a live detail pane.",
    trial:
      "Use the goal index to jump to Mind, open Reading, then switch from its occurrence list to its month.",
    risk: "A library can feel administrative. Keep doing and scheduling directly available.",
  },
  {
    id: "lens",
    name: "Lens",
    verb: "See a different slice",
    thesis:
      "Build a goal combination while the calendar and evidence respond in place.",
    trial:
      "Build a Running + Reading lens, switch between any/all matching days, save it, and inspect the same lens in Progress.",
    risk: "Hidden filters can look like missing data. Keep the scope and Clear action visible.",
  },
  {
    id: "glide",
    name: "Glide",
    verb: "Keep it within reach",
    thesis:
      "Move between dates on a thumb rail; expand a dock only when you need more.",
    trial:
      "Choose a date, expand the dock, finish an item, then move another. Haptics are optional.",
    risk: "A dock can cover content. Reserve space, use named controls, and make vibration redundant.",
  },
];
export const CATEGORIES = ["Body", "Mind", "Craft", "Life"] as const;
export const COLORS: Record<string, string> = {
  Body: "#346f52",
  Mind: "#5852a2",
  Craft: "#aa4b2e",
  Life: "#346b8d",
};
export type DemoGoal = Pick<
  Goal,
  | "id"
  | "title"
  | "category"
  | "frequency_type"
  | "recurrence_interval"
  | "target_count"
  | "target_basis"
  | "milestone_names"
  | "start_date"
  | "end_date"
  | "is_private"
  | "difficulty"
  | "reward_text"
> & { linkedTo?: string; team?: string };
export type Item = {
  id: string;
  goalId: string | null;
  title: string;
  date: string | null;
  time?: string;
};
export type RecordEntry = {
  id: string;
  goalId: string | null;
  itemId: string | null;
  date: string;
  title: string;
  source: "manual" | "linked_cascade";
  parentId?: string;
};
export type Snapshot = {
  goals: DemoGoal[];
  items: Item[];
  records: RecordEntry[];
  joined: boolean;
  sharing: boolean;
};
export type Move = { ids: string[]; date: string | null };
export type GoalDraft = {
  title: string;
  kind: GoalCreateKind;
  category: string;
  interval: "daily" | "weekly" | "monthly";
  target: number;
  basis: "period" | "lifetime";
  milestones: string;
  start: string;
  end: string;
  private: boolean;
  difficulty: "easy" | "medium" | "hard";
  reward: string;
  linkedTo: string;
  team: string;
};
export const dateLabel = (date: string, pattern = "EEE, d MMM") =>
  format(parseISO(date), pattern);
export const dateKey = (date: Date) => format(date, "yyyy-MM-dd");
export const offsetDate = (date: string, amount: number) =>
  dateKey(addDays(parseISO(date), amount));
export function periodDays(date: string, view: "month" | "week") {
  const d = parseISO(date);
  return eachDayOfInterval(
    view === "month"
      ? {
          start: startOfWeek(startOfMonth(d), { weekStartsOn: 1 }),
          end: endOfWeek(endOfMonth(d), { weekStartsOn: 1 }),
        }
      : {
          start: startOfWeek(d, { weekStartsOn: 1 }),
          end: endOfWeek(d, { weekStartsOn: 1 }),
        },
  ).map(dateKey);
}
export function navigateDate(date: string, view: View, direction: number) {
  return view === "month"
    ? dateKey(addMonths(parseISO(date), direction))
    : offsetDate(date, direction * (view === "week" ? 7 : 1));
}
export function goalLabel(goal: DemoGoal) {
  if (goal.frequency_type === "fixed_milestones")
    return `${goal.target_count} milestones`;
  if (goal.target_basis === "lifetime")
    return `${goal.target_count} total · ${goal.recurrence_interval}`;
  return `${goal.target_count} × ${goal.recurrence_interval}`;
}
const titles = [
  ["Running", "Strength", "Mobility", "Long walks", "Swimming", "Cycling"],
  [
    "Reading",
    "Spanish",
    "Journaling",
    "Meditation",
    "Piano practice",
    "Film journal",
  ],
  [
    "Launch portfolio",
    "Writing",
    "Sketchbook",
    "Photography",
    "Build a side project",
    "Design practice",
  ],
  [
    "Weekly reset",
    "Call family",
    "Cook something new",
    "Declutter",
    "Garden",
    "Explore the city",
  ],
];
export function createSeed(): Snapshot {
  const goals: DemoGoal[] = CATEGORIES.flatMap((category, c) =>
    titles[c].map((title, i) => ({
      id: `g${c * 6 + i}`,
      title,
      category,
      frequency_type: c === 2 && i === 0 ? "fixed_milestones" : "recurring",
      recurrence_interval:
        c === 2 && i === 0
          ? null
          : i === 3
            ? "daily"
            : i === 5
              ? "monthly"
              : "weekly",
      target_count: c === 2 && i === 0 ? 3 : i === 3 ? 1 : i === 5 ? 4 : 3,
      target_basis: i === 4 ? "lifetime" : "period",
      milestone_names:
        c === 2 && i === 0
          ? ["Choose work", "Build the site", "Publish"]
          : null,
      start_date: "2026-01-01",
      end_date: i === 4 ? "2026-12-31" : null,
      is_private: category === "Mind",
      difficulty: "medium",
      reward_text: "",
      ...(i === 1 && c === 0 ? { team: "Small Steps Club" } : {}),
    })),
  );
  const items: Item[] = [];
  for (let d = 1; d <= 30; d++) {
    const date = `2026-09-${String(d).padStart(2, "0")}`;
    const ids = d % 2 ? [0, 6, 13] : [1, 7, 18];
    ids.forEach((n, i) =>
      items.push({
        id: `p${d}-${n}`,
        goalId: `g${n}`,
        title: goals[n].title,
        date,
        ...(i === 0 ? { time: "07:30" } : {}),
      }),
    );
    if (d % 7 === 4)
      items.push({
        id: `m${d}`,
        goalId: "g12",
        title: goals[12].milestone_names![Math.min(2, Math.floor(d / 10))],
        date,
      });
  }
  items.push(
    { id: "u1", goalId: "g2", title: "Mobility", date: null },
    { id: "u2", goalId: "g8", title: "Journaling", date: null },
    { id: "u3", goalId: null, title: "Book the dentist", date: null },
    { id: "task1", goalId: null, title: "Pick up the parcel", date: TODAY },
  );
  const records: RecordEntry[] = items
    .filter(
      (x) =>
        x.date &&
        x.date < TODAY &&
        !x.id.startsWith("m") &&
        Number(x.date.slice(-2)) % 4 !== 0,
    )
    .map((x) => ({
      id: `r-${x.id}`,
      goalId: x.goalId,
      itemId: x.id,
      date: x.date!,
      title: x.title,
      source: "manual",
    }));
  for (let d = 1; d <= 31; d++) {
    [0, 6, 1, 7]
      .filter((n) => (d + n) % 3 === 0)
      .forEach((n) =>
        records.push({
          id: `aug-${d}-${n}`,
          goalId: `g${n}`,
          itemId: null,
          date: `2026-08-${String(d).padStart(2, "0")}`,
          title: goals[n].title,
          source: "manual",
        }),
      );
  }
  return { goals, items, records, joined: false, sharing: false };
}
export function moveItems(snapshot: Snapshot, move: Move): Snapshot {
  return {
    ...snapshot,
    items: snapshot.items.map((item) =>
      move.ids.includes(item.id) ? { ...item, date: move.date } : item,
    ),
  };
}
export function toggleCompletion(
  snapshot: Snapshot,
  item: Item,
  date: string,
): Snapshot {
  const existing = snapshot.records.find(
    (r) => r.itemId === item.id && r.date === date && r.source === "manual",
  );
  if (existing)
    return {
      ...snapshot,
      records: snapshot.records.filter(
        (r) => r.id !== existing.id && r.parentId !== existing.id,
      ),
    };
  const id = `manual-${item.id}-${date}`;
  const entry: RecordEntry = {
    id,
    goalId: item.goalId,
    itemId: item.id,
    date,
    title: item.title,
    source: "manual",
  };
  const linkedTo = snapshot.goals.find((g) => g.id === item.goalId)?.linkedTo;
  return {
    ...snapshot,
    records: [
      ...snapshot.records,
      entry,
      ...(linkedTo
        ? [
            {
              ...entry,
              id: `${id}-linked`,
              itemId: null,
              goalId: linkedTo,
              title: snapshot.goals.find((g) => g.id === linkedTo)!.title,
              source: "linked_cascade" as const,
              parentId: id,
            },
          ]
        : []),
    ],
  };
}
export function goalMatches(
  goal: DemoGoal,
  query: string,
  category: string,
  ids: string[],
) {
  return (
    (!query || goal.title.toLowerCase().includes(query.toLowerCase())) &&
    (category === "All" || goal.category === category) &&
    (!ids.length || ids.includes(goal.id))
  );
}
export function defaultDraft(date: string): GoalDraft {
  return {
    title: "",
    kind: "recurring",
    category: "Body",
    interval: "weekly",
    target: 3,
    basis: "period",
    milestones: "First step\nNext step\nFinish",
    start: date,
    end: "",
    private: true,
    difficulty: "medium",
    reward: "",
    linkedTo: "",
    team: "",
  };
}
export function draftError(d: GoalDraft) {
  if (!d.title.trim()) return "Give this goal a name.";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(d.start) ||
    Number.isNaN(parseISO(d.start).getTime())
  )
    return "Choose a valid start date.";
  if (d.end && (Number.isNaN(parseISO(d.end).getTime()) || d.end < d.start))
    return "The end date must be on or after the start date.";
  if (
    d.kind !== "planner_task" &&
    (!Number.isInteger(d.target) || d.target < 1 || d.target > 99)
  )
    return "Use a whole-number target from 1 to 99 in this study.";
  if (
    d.kind === "fixed_milestones" &&
    d.milestones.split("\n").filter((x) => x.trim()).length < 1
  )
    return "Name at least one milestone.";
  return null;
}
export function addGoal(snapshot: Snapshot, d: GoalDraft): Snapshot {
  if (draftError(d)) return snapshot;
  const id = `new-${snapshot.goals.length}-${snapshot.items.length}`;
  if (d.kind === "planner_task")
    return {
      ...snapshot,
      items: [
        ...snapshot.items,
        { id, goalId: null, title: d.title.trim(), date: null },
      ],
    };
  const milestones = d.milestones
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
  const goal: DemoGoal = {
    id,
    title: d.title.trim(),
    category: d.category,
    frequency_type: d.kind,
    recurrence_interval: d.kind === "recurring" ? d.interval : null,
    target_count: d.kind === "fixed_milestones" ? milestones.length : d.target,
    target_basis: d.kind === "fixed_milestones" ? "lifetime" : d.basis,
    milestone_names: d.kind === "fixed_milestones" ? milestones : null,
    start_date: d.start,
    end_date: d.end || null,
    is_private: d.private,
    difficulty: d.difficulty,
    reward_text: d.reward,
    linkedTo: d.linkedTo || undefined,
    team: d.team || undefined,
  };
  return {
    ...snapshot,
    goals: [...snapshot.goals, goal],
    items: [
      ...snapshot.items,
      ...(d.kind === "fixed_milestones" ? milestones : [d.title.trim()]).map(
        (title, i) => ({ id: `${id}-${i}`, goalId: id, title, date: null }),
      ),
    ],
  };
}

export type SavedLens = {
  id: string;
  name: string;
  goalIds: string[];
  match: "any" | "all";
};
export const DEFAULT_LENSES: SavedLens[] = [
  {
    id: "move",
    name: "Move & recharge",
    match: "any",
    goalIds: ["g0", "g1", "g2"],
  },
  {
    id: "make",
    name: "Learn & make",
    match: "any",
    goalIds: ["g6", "g7", "g12", "g13"],
  },
];
/** Dates where every selected goal is represented; plans and records remain separate inputs. */
export function datesWithEveryGoal(
  entries: { goalId: string | null; date: string | null }[],
  goalIds: string[],
) {
  const byDate = new Map<string, Set<string>>();
  for (const entry of entries) {
    if (entry.date && entry.goalId && goalIds.includes(entry.goalId)) {
      const ids = byDate.get(entry.date) || new Set<string>();
      ids.add(entry.goalId);
      byDate.set(entry.date, ids);
    }
  }
  return new Set(
    [...byDate]
      .filter(([, ids]) => goalIds.every((id) => ids.has(id)))
      .map(([date]) => date),
  );
}
