import { toLocalDateString } from "@/lib/dates/day";
import {
  applyGoalCreationFieldChange,
  createDefaultGoalCreationFields,
  resolveGoalCreationTargetCountForSave,
  type GoalCreationFieldChange,
  type GoalCreationFields,
} from "@/lib/goals/creation-model";
import type { GoalCreateKind } from "@/lib/goals/form-options";
import { getCategoryValueForWrite } from "@/lib/goals/category";
import { normalizeMilestoneNamesForSave } from "@/lib/goals/milestones";

export interface GoalFormState extends GoalCreationFields {
  reward_text: string;
  plaque_target: number | null;
  team_id: string | null;
  task_scheduled_date: string;
  task_scheduled_time: string;
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
  p_plaque_target?: number;
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
  plaque_target: null,
  team_id: null,
  task_scheduled_date: toLocalDateString(),
  task_scheduled_time: "",
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

export function buildGoalMutationArgs({
  state,
  goalId,
  stableCreateGoalId,
  recoveryGoalArgs,
}: {
  state: GoalFormState;
  goalId?: string;
  stableCreateGoalId: string | null;
  recoveryGoalArgs?: GoalFormGoalArgs;
}): GoalFormGoalArgs {
  if (recoveryGoalArgs) {
    return recoveryGoalArgs;
  }

  const resolvedTargetCountForSave = resolveGoalCreationTargetCountForSave(state);
  const targetCountForSave =
    resolvedTargetCountForSave === null ? undefined : resolvedTargetCountForSave;
  const milestoneNames =
    state.frequency_type === "fixed_milestones" && resolvedTargetCountForSave !== null
      ? normalizeMilestoneNamesForSave(
          resolvedTargetCountForSave,
          state.milestone_names
        )
      : undefined;
  const categoryValue = getCategoryValueForWrite(
    state.category_selection,
    state.custom_category
  );

  return {
    p_id: goalId ?? stableCreateGoalId ?? crypto.randomUUID(),
    p_title: state.title.trim(),
    p_description: state.description.trim() || undefined,
    p_reward_text: state.reward_text.trim() || undefined,
    p_category: categoryValue.category,
    p_category_key: categoryValue.categoryKey,
    p_color: state.color,
    p_frequency_type: state.frequency_type,
    p_recurrence_interval:
      state.frequency_type === "recurring" ? state.recurrence_interval : undefined,
    p_difficulty: state.difficulty,
    p_target_count:
      state.frequency_type === "fixed_milestones" ||
      state.frequency_type === "recurring"
        ? targetCountForSave
        : undefined,
    p_target_basis:
      state.frequency_type === "recurring" ? state.target_basis : undefined,
    p_milestone_names: milestoneNames,
    p_start_date: state.start_date,
    p_end_date: state.end_date || undefined,
    p_default_local_time: state.default_local_time.trim() || undefined,
    p_team_id: state.team_id ?? undefined,
    p_is_private: state.team_id ? false : state.is_private,
    p_plaque_target:
      state.frequency_type === "recurring" && state.target_basis === "period"
        ? state.plaque_target ?? undefined
        : undefined,
  };
}
