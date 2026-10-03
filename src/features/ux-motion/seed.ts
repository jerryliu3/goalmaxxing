import type { GoalCreationFields } from "@/lib/goals/creation-model";
import type { WorkQuestModel } from "@/features/planner/work-quest-model";

/** These are recorded sample outcomes, not a second linked-credit calculator. */
export interface LinkedCredit {
  goalId: string;
  title: string;
  fromTitle: string;
  before: number;
  after: number;
  target: number;
  achieved: boolean;
}

export interface SampleReceipt {
  sourceTitle: string;
  linked: readonly LinkedCredit[];
}

export const SCENARIOS = [
  { id: "cascade", label: "Two parents achieved" },
  { id: "progress", label: "Parents receive progress" },
  { id: "no-credit", label: "No new linked credit" },
  { id: "failure", label: "Recording fails" },
] as const;
export type Scenario = (typeof SCENARIOS)[number]["id"];

const parents = [
  { goalId: "ten-k", title: "Train for a 10K", fromTitle: "Tempo run", target: 12 },
  { goalId: "running-base", title: "Build my running base", fromTitle: "Train for a 10K", target: 20 },
] as const;

export function sampleReceipt(scenario: Exclude<Scenario, "failure">): SampleReceipt {
  return {
    sourceTitle: "Tempo run",
    linked: scenario === "no-credit" ? [] : parents.map((parent, index) => ({
      ...parent,
      before: scenario === "cascade" ? parent.target - 1 : index === 0 ? 6 : 10,
      after: scenario === "cascade" ? parent.target : index === 0 ? 7 : 11,
      achieved: scenario === "cascade",
    })),
  };
}

export const RUN_FIELDS: GoalCreationFields = {
  title: "Tempo run", description: "Make space to run three days each week.",
  category_selection: "health", custom_category: "", color: "#52734d",
  frequency_type: "recurring", recurrence_interval: "weekly", target_count: "3",
  target_basis: "period", milestone_names: [], start_date: "2026-09-01", end_date: "",
  default_local_time: "07:30", difficulty: "medium", is_private: true, linked_target_goal_id: "ten-k",
};

export function runQuest(completed: boolean): WorkQuestModel {
  return {
    id: "tempo", title: "Tempo run", categoryLabel: "Health", color: "#52734d",
    cadenceLabel: "3 days a week", deadlineLabel: "No deadline", completed,
    progress: { completed: completed ? 3 : 2, target: 3, label: `${completed ? 3 : 2} of 3 this week` },
  };
}
