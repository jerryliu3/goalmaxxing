import { validateGoalCreationFields } from "@/features/goals/goal-creation-model";
import {
  defaultGoalFormState,
  type GoalFormState,
} from "@/features/today/goal-form-model";
import { getCategorySwatchColor } from "@/lib/goals/category";
import type { GoalCreateKind } from "@/lib/goals/form-options";

export type Concept = "tempo" | "weave" | "script";
export const CONCEPTS = [
  {
    id: "tempo",
    name: "Tempo",
    number: "01",
    title: "Make room for what matters.",
    creation: "The commitment studio",
    history: "Victory ledger",
    score: "Momentum",
    idea: "One decision at a time. A bold, live receipt turns intention into a commitment you can see.",
    tradeoff: "Fastest to scan; the explicit steps add a little ceremony.",
  },
  {
    id: "weave",
    name: "Weave",
    number: "02",
    title: "Build a rhythm that holds.",
    creation: "The rhythm loom",
    history: "Woven history",
    score: "Rhythm",
    idea: "Shape the goal beside its emerging pattern. Each decision adds another thread to the same object.",
    tradeoff:
      "Best for understanding recurrence; wide patterns need a compact mobile summary.",
  },
  {
    id: "script",
    name: "Script",
    number: "03",
    title: "Give your next chapter a shape.",
    creation: "The living brief",
    history: "Chapters",
    score: "Form",
    idea: "Write the intention, then refine a living sentence. Structured choices keep every promise explicit.",
    tradeoff:
      "Most personal and calm; structured review is essential when language feels effortless.",
  },
] as const;
export interface Draft extends GoalFormState {
  id: string;
  kind: GoalCreateKind;
}
export function newDraft(): Draft {
  return {
    ...defaultGoalFormState,
    id: crypto.randomUUID(),
    kind: "recurring",
    category_selection: "health",
    color: getCategorySwatchColor("health"),
    recurrence_interval: "weekly",
    target_count: "3",
    task_scheduled_date: defaultGoalFormState.start_date,
  };
}
export function draftErrors(draft: Draft): string[] {
  if (draft.kind === "planner_task")
    return [
      !draft.title.trim() && "Name your task.",
      !/^\d{4}-\d{2}-\d{2}$/.test(draft.task_scheduled_date) &&
        "Choose a task date.",
    ].filter((x): x is string => Boolean(x));
  return [
    ...validateGoalCreationFields(draft),
    ...(draft.reward_text.length > 500
      ? ["Keep the reward under 500 characters."]
      : []),
  ];
}
export function rhythm(d: Draft): string {
  if (d.kind === "planner_task")
    return `One-time task · ${d.task_scheduled_date}`;
  if (d.kind === "fixed_milestones")
    return `${d.target_count || "…"} milestones`;
  if (d.target_basis === "lifetime")
    return `${d.target_count || "…"} completions total · ${d.recurrence_interval} rhythm`;
  return `${d.recurrence_interval === "daily" ? "1" : d.target_count || "…"} ${d.target_count === "1" || d.recurrence_interval === "daily" ? "day" : "days"} / ${d.recurrence_interval === "daily" ? "day" : d.recurrence_interval === "weekly" ? "week" : "month"}`;
}
export const HISTORY = [
  {
    id: "run",
    title: "Run a first 10K",
    category: "Health",
    status: "Achieved",
    count: 24,
    target: 24,
    date: "2026-09-10",
    detail: "24 training sessions. One finish line.",
  },
  {
    id: "portfolio",
    title: "Publish my portfolio",
    category: "Career",
    status: "Achieved",
    count: 5,
    target: 5,
    date: "2026-09-08",
    detail: "From first sketch to a link you can share.",
  },
  {
    id: "read",
    title: "A summer of reading",
    category: "Personal",
    status: "Ended",
    count: 8,
    target: 12,
    date: "2026-08-31",
    detail: "Eight books read. The remaining four can start a new chapter.",
  },
  {
    id: "italian",
    title: "Learn conversational Italian",
    category: "Personal",
    status: "Archived",
    count: 16,
    target: 30,
    date: "2026-08-24",
    detail: "Set aside by you. Sixteen sessions are still part of your story.",
  },
] as const;
export type HistoryItem = (typeof HISTORY)[number];
