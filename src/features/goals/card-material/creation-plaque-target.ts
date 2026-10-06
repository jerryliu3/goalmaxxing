import type { Goal } from "@/lib/goals/types";
import type { GoalCreationFields } from "@/lib/goals/creation-model";
import {
  artificialCadenceAssemblyTarget,
  CADENCE_ASSEMBLY_SOFT_HORIZON_DAYS,
} from "./cadence-assembly-target";

export const MIN_PLAQUE_TARGET = 1;
export const MAX_PLAQUE_TARGET = 20;

function asGoal(fields: GoalCreationFields): Goal {
  return {
    id: "draft",
    owner_id: "draft",
    title: fields.title,
    description: fields.description || null,
    category: fields.category_selection,
    color: fields.color,
    frequency_type: fields.frequency_type,
    recurrence_interval:
      fields.frequency_type === "recurring" ? fields.recurrence_interval : null,
    difficulty: fields.difficulty,
    target_count: Number(fields.target_count) || 1,
    target_basis: fields.target_basis,
    milestone_names:
      fields.frequency_type === "fixed_milestones"
        ? fields.milestone_names
        : null,
    start_date: fields.start_date,
    end_date: fields.end_date.trim() || null,
    photo_path: null,
    team_id: null,
    is_deleted: false,
    archived_at: null,
    created_at: "",
    updated_at: "",
  };
}

/**
 * Initial plaque / reassembly target shown on the creation review step.
 * Period cadence goals use the soft-horizon formula; milestones and lifetime
 * totals use their real expected units, clamped to the shard presentation range.
 */
export function creationPlaqueTarget(fields: GoalCreationFields): number {
  if (
    fields.frequency_type === "fixed_milestones" ||
    fields.target_basis === "lifetime"
  ) {
    const count = Number(fields.target_count);
    const raw = Number.isFinite(count) && count > 0 ? Math.round(count) : 1;
    return Math.min(MAX_PLAQUE_TARGET, Math.max(MIN_PLAQUE_TARGET, raw));
  }

  return (
    artificialCadenceAssemblyTarget(asGoal(fields)) ??
    Math.min(
      MAX_PLAQUE_TARGET,
      Math.max(
        MIN_PLAQUE_TARGET,
        Math.round(CADENCE_ASSEMBLY_SOFT_HORIZON_DAYS * 0.9),
      ),
    )
  );
}

export function clampPlaqueTarget(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_PLAQUE_TARGET;
  }
  return Math.min(MAX_PLAQUE_TARGET, Math.max(MIN_PLAQUE_TARGET, Math.round(value)));
}
