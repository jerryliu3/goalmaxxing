import { GAZETTEER } from "@/lib/brand/gazetteer";
import type { CategoryPresetId } from "@/lib/goals/category";
import type { GoalCreationFields } from "@/lib/goals/creation-model";
import type {
  GoalDifficulty,
  GoalFrequencyType,
  GoalTargetBasis,
  RecurrenceInterval,
} from "@/lib/goals/types";

export const DAY_WORK_TODAY = "2026-09-03" as const;
export const DAY_WORK_TODAY_LABEL = "Thursday, September 3" as const;
export const DAY_WORK_TODAY_SHORT = "Thu, Sep 3" as const;

export type DayWorkKind = "goal" | "task";
export type DayWorkBand = "morning" | "midday" | "evening" | "anytime";
export type DayWorkFact =
  | "title"
  | "cadence"
  | "deadline"
  | "date"
  | "time"
  | "difficulty"
  | "lock";

export interface DayWorkInstance {
  date: string;
  weekday: string;
  short: string;
}

export interface DayWorkItem {
  id: string;
  title: string;
  kind: DayWorkKind;
  category: CategoryPresetId;
  categoryLabel: string;
  color: string;
  frequencyType: GoalFrequencyType | "task";
  recurrence: RecurrenceInterval | null;
  targetCount: number;
  targetBasis: GoalTargetBasis;
  startDate: string;
  endDate: string | null;
  time: string | null;
  difficulty: GoalDifficulty;
  private: boolean;
  locked: boolean;
  completed: boolean;
  unplaced?: boolean;
  periodDone: number;
  periodTarget: number;
  periodUnit: "week" | "month" | "day" | "total";
  band: DayWorkBand;
  instances: readonly DayWorkInstance[];
  instanceIndex: number;
  description?: string;
}

export const DAY_WORK_ITEMS: readonly DayWorkItem[] = [
  {
    id: "tempo-run",
    title: "Tempo run",
    kind: "goal",
    category: "health",
    categoryLabel: "Health",
    color: GAZETTEER.gain,
    frequencyType: "recurring",
    recurrence: "weekly",
    targetCount: 3,
    targetBasis: "period",
    startDate: "2026-06-01",
    endDate: "2026-12-31",
    time: "07:30",
    difficulty: "medium",
    private: false,
    locked: false,
    completed: false,
    periodDone: 1,
    periodTarget: 3,
    periodUnit: "week",
    band: "morning",
    instances: [
      { date: "2026-09-01", weekday: "Tuesday", short: "Tue 1" },
      { date: "2026-09-03", weekday: "Thursday", short: "Thu 3" },
      { date: "2026-09-05", weekday: "Saturday", short: "Sat 5" },
    ],
    instanceIndex: 1,
    description: "Forty-five minutes. The week’s quality session.",
  },
  {
    id: "launch-notes",
    title: "Launch notes",
    kind: "task",
    category: "career",
    categoryLabel: "Career",
    color: GAZETTEER.stamp,
    frequencyType: "task",
    recurrence: null,
    targetCount: 1,
    targetBasis: "lifetime",
    startDate: DAY_WORK_TODAY,
    endDate: DAY_WORK_TODAY,
    time: "11:00",
    difficulty: "medium",
    private: false,
    locked: false,
    completed: false,
    periodDone: 0,
    periodTarget: 1,
    periodUnit: "total",
    band: "midday",
    instances: [{ date: DAY_WORK_TODAY, weekday: "Thursday", short: "Thu 3" }],
    instanceIndex: 0,
    description: "Ship the review doc before the afternoon huddle.",
  },
  {
    id: "weekly-reset",
    title: "Weekly reset",
    kind: "goal",
    category: "career",
    categoryLabel: "Career",
    color: "#8a6a3a",
    frequencyType: "recurring",
    recurrence: "weekly",
    targetCount: 1,
    targetBasis: "period",
    startDate: "2026-01-05",
    endDate: null,
    time: null,
    difficulty: "easy",
    private: false,
    locked: false,
    completed: false,
    periodDone: 0,
    periodTarget: 1,
    periodUnit: "week",
    band: "anytime",
    instances: [
      { date: "2026-08-27", weekday: "Thursday", short: "Thu 27" },
      { date: DAY_WORK_TODAY, weekday: "Thursday", short: "Thu 3" },
      { date: "2026-09-10", weekday: "Thursday", short: "Thu 10" },
    ],
    instanceIndex: 1,
  },
  {
    id: "review-offer",
    title: "Review offer",
    kind: "task",
    category: "career",
    categoryLabel: "Career",
    color: GAZETTEER.stampLight,
    frequencyType: "task",
    recurrence: null,
    targetCount: 1,
    targetBasis: "lifetime",
    startDate: DAY_WORK_TODAY,
    endDate: null,
    time: null,
    difficulty: "hard",
    private: true,
    locked: false,
    completed: false,
    unplaced: true,
    periodDone: 0,
    periodTarget: 1,
    periodUnit: "total",
    band: "anytime",
    instances: [{ date: DAY_WORK_TODAY, weekday: "Thursday", short: "Thu 3" }],
    instanceIndex: 0,
    description: "Applicable today. Not placed on the calendar.",
  },
  {
    id: "strength",
    title: "Strength",
    kind: "goal",
    category: "health",
    categoryLabel: "Health",
    color: "#3f4a3a",
    frequencyType: "recurring",
    recurrence: "weekly",
    targetCount: 2,
    targetBasis: "period",
    startDate: "2026-04-01",
    endDate: "2026-10-15",
    time: null,
    difficulty: "hard",
    private: false,
    locked: false,
    completed: false,
    unplaced: true,
    periodDone: 0,
    periodTarget: 2,
    periodUnit: "week",
    band: "anytime",
    instances: [
      { date: "2026-09-01", weekday: "Tuesday", short: "Tue 1" },
      { date: "2026-09-04", weekday: "Friday", short: "Fri 4" },
    ],
    instanceIndex: 0,
    description: "Unplaced from Tuesday. Replanning is normal.",
  },
  {
    id: "deep-work",
    title: "Deep work",
    kind: "goal",
    category: "career",
    categoryLabel: "Career",
    color: GAZETTEER.mutedDeep,
    frequencyType: "recurring",
    recurrence: "daily",
    targetCount: 1,
    targetBasis: "period",
    startDate: "2026-03-01",
    endDate: null,
    time: "06:30",
    difficulty: "hard",
    private: false,
    locked: true,
    completed: true,
    periodDone: 1,
    periodTarget: 1,
    periodUnit: "day",
    band: "morning",
    instances: [
      { date: "2026-09-02", weekday: "Wednesday", short: "Wed 2" },
      { date: DAY_WORK_TODAY, weekday: "Thursday", short: "Thu 3" },
      { date: "2026-09-04", weekday: "Friday", short: "Fri 4" },
    ],
    instanceIndex: 1,
  },
];

export function cloneDayWorkItems(): DayWorkItem[] {
  return DAY_WORK_ITEMS.map((item) => ({
    ...item,
    instances: [...item.instances],
  }));
}

export function currentInstance(item: DayWorkItem): DayWorkInstance {
  return item.instances[item.instanceIndex] ?? item.instances[0];
}

export function cadenceLabel(item: DayWorkItem): string {
  if (item.kind === "task" || item.frequencyType === "task") return "One sitting";
  if (item.frequencyType === "fixed_milestones") {
    return item.targetCount === 1 ? "1 milestone" : `${item.targetCount} milestones`;
  }
  if (item.recurrence === "daily") return "Every day";
  if (item.targetBasis === "lifetime") {
    return item.targetCount === 1
      ? "1 time in total"
      : `${item.targetCount} times in total`;
  }
  if (item.recurrence === "monthly") {
    return item.targetCount === 1 ? "1 day a month" : `${item.targetCount} days a month`;
  }
  if (item.targetCount === 1) return "Once a week";
  return `${item.targetCount} days a week`;
}

export function cadenceCountDisplay(item: DayWorkItem): string {
  if (item.kind === "task") return "01";
  return String(item.targetCount).padStart(2, "0");
}

export function cadenceUnitDisplay(item: DayWorkItem): { primary: string; secondary: string } {
  if (item.kind === "task") return { primary: "sitting", secondary: "today" };
  if (item.recurrence === "daily") return { primary: "every", secondary: "day" };
  if (item.recurrence === "monthly") {
    return {
      primary: item.targetCount === 1 ? "day" : "days",
      secondary: "a month",
    };
  }
  if (item.targetBasis === "lifetime") {
    return {
      primary: item.targetCount === 1 ? "time" : "times",
      secondary: "in total",
    };
  }
  return {
    primary: item.targetCount === 1 ? "day" : "days",
    secondary: "a week",
  };
}

export function deadlineLabel(item: DayWorkItem): string {
  if (!item.endDate) return "No end date";
  if (item.kind === "task" && item.endDate === item.startDate) return "Due today";
  return `Until ${formatPrettyDate(item.endDate)}`;
}

export function periodLabel(item: DayWorkItem): string {
  if (item.kind === "task") return item.completed ? "Done" : "Open";
  const unit =
    item.periodUnit === "week"
      ? "this week"
      : item.periodUnit === "month"
        ? "this month"
        : item.periodUnit === "day"
          ? "today"
          : "in total";
  return `${item.periodDone} of ${item.periodTarget} ${unit}`;
}

export function timeLabel(item: DayWorkItem): string {
  if (!item.time) return "Any time";
  const [hours, minutes] = item.time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return minutes === 0 ? `${hour12} ${suffix}` : `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function sittingLabel(item: DayWorkItem): string {
  const instance = currentInstance(item);
  if (item.unplaced) return "Unplaced · needs a day";
  return `This ${instance.weekday}`;
}

export function formatPrettyDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function difficultyLabel(item: DayWorkItem): string {
  return item.difficulty === "easy"
    ? "Light"
    : item.difficulty === "hard"
      ? "Heavy"
      : "Steady";
}

export function effortLevel(item: DayWorkItem): 1 | 2 | 3 {
  return item.difficulty === "easy" ? 1 : item.difficulty === "hard" ? 3 : 2;
}

export function toCreationFields(item: DayWorkItem): GoalCreationFields {
  return {
    title: item.title,
    description: item.description ?? "",
    category_selection: item.category,
    custom_category: "",
    color: item.color,
    frequency_type: item.frequencyType === "task" ? "recurring" : item.frequencyType,
    recurrence_interval: item.recurrence ?? "daily",
    target_count: String(item.targetCount),
    target_basis: item.targetBasis,
    milestone_names: [],
    start_date: item.startDate,
    end_date: item.endDate ?? "",
    default_local_time: item.time ?? "",
    difficulty: item.difficulty,
    is_private: item.private,
    linked_target_goal_id: "none",
  };
}

export const CADENCE_CHOICES = [
  { id: "daily", label: "Every day", recurrence: "daily" as const, count: 1 },
  { id: "weekly-1", label: "Once a week", recurrence: "weekly" as const, count: 1 },
  { id: "weekly-2", label: "2 days a week", recurrence: "weekly" as const, count: 2 },
  { id: "weekly-3", label: "3 days a week", recurrence: "weekly" as const, count: 3 },
  { id: "task", label: "One sitting", recurrence: null, count: 1 },
] as const;

export const DEADLINE_CHOICES = [
  { id: "none", label: "No end date", value: null },
  { id: "oct", label: "Until Oct 15", value: "2026-10-15" },
  { id: "dec", label: "Until Dec 31", value: "2026-12-31" },
  { id: "mar", label: "Until Mar 1", value: "2027-03-01" },
] as const;

export const TIME_CHOICES = [
  { id: "0630", label: "6:30 AM", value: "06:30" },
  { id: "0730", label: "7:30 AM", value: "07:30" },
  { id: "1100", label: "11:00 AM", value: "11:00" },
  { id: "1600", label: "4:00 PM", value: "16:00" },
  { id: "any", label: "Any time", value: null },
] as const;

export const DATE_CHOICES = [
  { id: "tue", label: "Tue, Sep 1", value: "2026-09-01", weekday: "Tuesday", short: "Tue 1" },
  { id: "thu", label: "Thu, Sep 3", value: DAY_WORK_TODAY, weekday: "Thursday", short: "Thu 3" },
  { id: "fri", label: "Fri, Sep 4", value: "2026-09-04", weekday: "Friday", short: "Fri 4" },
  { id: "sat", label: "Sat, Sep 5", value: "2026-09-05", weekday: "Saturday", short: "Sat 5" },
] as const;

export const DIFFICULTY_CHOICES = [
  { id: "easy", label: "Light" },
  { id: "medium", label: "Steady" },
  { id: "hard", label: "Heavy" },
] as const;
