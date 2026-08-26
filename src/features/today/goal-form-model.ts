import { toLocalDateString } from "@/lib/dates/day";
import {
  applyGoalCreationFieldChange,
  createDefaultGoalCreationFields,
  type GoalCreationFieldChange,
  type GoalCreationFields,
} from "@/features/goals/goal-creation-model";
import type { GoalCreateKind } from "@/lib/goals/form-options";

export interface GoalFormState extends GoalCreationFields {
  reward_text: string;
  team_id: string | null;
  task_scheduled_date: string;
}

export interface GoalFormGoalArgs {
  p_id: string;
  p_title: string;
  p_description?: string;
  p_reward_text?: string;
  p_category: string;
  p_category_key: string;
  p_color: string;
  p_frequency_type: GoalFormState["frequency_type"];
  p_recurrence_interval?: GoalFormState["recurrence_interval"];
  p_difficulty: GoalFormState["difficulty"];
  p_target_count?: number;
  p_target_basis?: GoalFormState["target_basis"];
  p_milestone_names?: string[];
  p_start_date: string;
  p_end_date?: string;
  p_default_local_time?: string;
  p_team_id?: string;
  p_is_private: boolean;
}

export type GoalFormRecovery =
  | {
      kind: "create";
      goalArgs: GoalFormGoalArgs;
    }
  | {
      kind: "update";
      goalArgs: GoalFormGoalArgs;
    }
  | {
      kind: "link";
      savedGoalId: string;
      targetGoalId: string | undefined;
    };

export const defaultGoalFormState: GoalFormState = {
  ...createDefaultGoalCreationFields(),
  reward_text: "",
  team_id: null,
  task_scheduled_date: toLocalDateString(),
};

export function toGoalCreationFields(state: GoalFormState): GoalCreationFields {
  return {
    title: state.title,
    description: state.description,
    category_selection: state.category_selection,
    custom_category: state.custom_category,
    color: state.color,
    frequency_type: state.frequency_type,
    recurrence_interval: state.recurrence_interval,
    target_count: state.target_count,
    target_basis: state.target_basis,
    milestone_names: state.milestone_names,
    start_date: state.start_date,
    end_date: state.end_date,
    default_local_time: state.default_local_time,
    difficulty: state.difficulty,
    is_private: state.is_private,
    linked_target_goal_id: "none",
  };
}

export function mergeGoalCreationFields(
  state: GoalFormState,
  fields: GoalCreationFields
): GoalFormState {
  return {
    ...state,
    title: fields.title,
    description: fields.description,
    category_selection: fields.category_selection,
    custom_category: fields.custom_category,
    color: fields.color,
    frequency_type: fields.frequency_type,
    recurrence_interval: fields.recurrence_interval,
    target_count: fields.target_count,
    target_basis: fields.target_basis,
    milestone_names: fields.milestone_names,
    start_date: fields.start_date,
    end_date: fields.end_date,
    default_local_time: fields.default_local_time,
    difficulty: fields.difficulty,
    is_private: fields.is_private,
  };
}

export function applyGoalFormFieldChange(
  state: GoalFormState,
  change: GoalCreationFieldChange
): GoalFormState {
  return mergeGoalCreationFields(
    state,
    applyGoalCreationFieldChange(toGoalCreationFields(state), change)
  );
}

export function applyGoalFormCreateKindChange(
  state: GoalFormState,
  nextKind: GoalCreateKind
): GoalFormState {
  if (nextKind === "planner_task") {
    return state;
  }
  return applyGoalFormFieldChange(state, { type: "frequency_type", value: nextKind });
}
