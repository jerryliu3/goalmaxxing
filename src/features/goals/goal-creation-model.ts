import { toLocalDateString } from "@/lib/dates/day";
import {
  type CategorySelection,
  getCategorySwatchColor,
} from "@/lib/goals/category";
import { validateGoalDefinition } from "@/lib/goals/definition-validation";
import { buildMilestoneNameDrafts } from "@/lib/goals/milestones";
import type {
  GoalDifficulty,
  GoalFrequencyType,
  GoalTargetBasis,
  RecurrenceInterval,
} from "@/lib/goals/types";

export interface GoalCreationFields {
  title: string;
  description: string;
  category_selection: CategorySelection;
  custom_category: string;
  color: string;
  frequency_type: GoalFrequencyType;
  recurrence_interval: RecurrenceInterval;
  target_count: string;
  target_basis: GoalTargetBasis;
  milestone_names: string[];
  start_date: string;
  end_date: string;
  default_local_time: string;
  difficulty: GoalDifficulty;
  is_private: boolean;
  linked_target_goal_id: string;
}

export type GoalCreationFieldChange =
  | { type: "frequency_type"; value: GoalFrequencyType }
  | { type: "recurrence_interval"; value: RecurrenceInterval }
  | { type: "target_count"; value: string }
  | { type: "target_basis"; value: GoalTargetBasis }
  | { type: "milestone_name"; index: number; value: string }
  | { type: "patch"; value: Partial<GoalCreationFields> };

const localTimePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const hexColorPattern = /^#[0-9a-f]{6}$/i;

function parsePositiveTargetCount(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function defaultTargetCountForBasis(basis: GoalTargetBasis): string {
  return basis === "lifetime" ? "3" : "1";
}

function resolveTargetCountOnBasisSwitch(
  previousTargetCount: string,
  nextBasis: GoalTargetBasis
): string {
  const trimmed = previousTargetCount.trim();
  if (trimmed.length > 0 && parsePositiveTargetCount(trimmed) !== null) {
    return previousTargetCount;
  }
  return defaultTargetCountForBasis(nextBasis);
}

function applyFrequencyTypeChange(
  fields: GoalCreationFields,
  nextFrequency: GoalFrequencyType
): GoalCreationFields {
  if (nextFrequency === "fixed_milestones") {
    const nextTargetCount =
      fields.target_count.trim().length === 0 ? "3" : fields.target_count;
    return {
      ...fields,
      frequency_type: nextFrequency,
      target_basis: "lifetime",
      target_count: nextTargetCount,
      milestone_names: buildMilestoneNameDrafts(
        parsePositiveTargetCount(nextTargetCount) ?? 0,
        fields.milestone_names
      ),
    };
  }

  return {
    ...fields,
    frequency_type: nextFrequency,
    target_basis: "period",
    milestone_names: [],
  };
}

function applyRecurrenceIntervalChange(
  fields: GoalCreationFields,
  nextInterval: RecurrenceInterval
): GoalCreationFields {
  const shouldDefaultPeriodTarget =
    fields.frequency_type === "recurring" &&
    fields.target_basis === "period" &&
    nextInterval !== "daily" &&
    fields.target_count.trim().length === 0;

  return {
    ...fields,
    recurrence_interval: nextInterval,
    target_count: shouldDefaultPeriodTarget ? "1" : fields.target_count,
  };
}

function applyTargetCountChange(
  fields: GoalCreationFields,
  nextTargetCount: string
): GoalCreationFields {
  const normalizedTargetCount =
    fields.frequency_type === "recurring" &&
    fields.target_basis === "period" &&
    nextTargetCount.trim().length === 0
      ? "1"
      : nextTargetCount;

  return {
    ...fields,
    target_count: normalizedTargetCount,
    milestone_names:
      fields.frequency_type === "fixed_milestones"
        ? buildMilestoneNameDrafts(
            parsePositiveTargetCount(normalizedTargetCount) ?? 0,
            fields.milestone_names
          )
        : fields.milestone_names,
  };
}

function applyTargetBasisChange(
  fields: GoalCreationFields,
  nextBasis: GoalTargetBasis
): GoalCreationFields {
  return {
    ...fields,
    target_basis: nextBasis,
    target_count: resolveTargetCountOnBasisSwitch(fields.target_count, nextBasis),
  };
}

export function createDefaultGoalCreationFields(): GoalCreationFields {
  return {
    title: "",
    description: "",
    category_selection: "personal",
    custom_category: "",
    color: getCategorySwatchColor("personal"),
    frequency_type: "recurring",
    recurrence_interval: "daily",
    target_count: "",
    target_basis: "period",
    milestone_names: [],
    start_date: toLocalDateString(),
    end_date: "",
    default_local_time: "",
    difficulty: "medium",
    is_private: false,
    linked_target_goal_id: "none",
  };
}

export function normalizeGoalCreationTarget(
  fields: Pick<
    GoalCreationFields,
    "frequency_type" | "recurrence_interval" | "target_basis" | "target_count"
  >
): string {
  if (fields.frequency_type !== "recurring") {
    return fields.target_count;
  }

  if (fields.target_basis === "period") {
    return fields.target_count.trim().length === 0 ? "1" : fields.target_count;
  }

  return fields.target_count.trim().length === 0 ? "" : fields.target_count;
}

export function updateGoalCreationFields(
  fields: GoalCreationFields,
  change: GoalCreationFieldChange
): GoalCreationFields {
  switch (change.type) {
    case "frequency_type":
      return applyFrequencyTypeChange(fields, change.value);
    case "recurrence_interval":
      return applyRecurrenceIntervalChange(fields, change.value);
    case "target_count":
      return applyTargetCountChange(fields, change.value);
    case "target_basis":
      return applyTargetBasisChange(fields, change.value);
    case "milestone_name": {
      const nextMilestoneNames = [...fields.milestone_names];
      nextMilestoneNames[change.index] = change.value;
      return {
        ...fields,
        milestone_names: nextMilestoneNames,
      };
    }
    case "patch":
      return { ...fields, ...change.value };
    default:
      return fields;
  }
}

export function validateGoalCreationFields(fields: GoalCreationFields): string[] {
  const errors: string[] = [];
  const parsedTarget = parsePositiveTargetCount(fields.target_count);

  if (!fields.title.trim()) {
    errors.push("Title is required.");
  }

  if (
    fields.category_selection === "custom" &&
    !fields.custom_category.trim()
  ) {
    errors.push("Custom category name is required.");
  }

  if (!hexColorPattern.test(fields.color.trim())) {
    errors.push("Color accent must be a valid hex color.");
  }

  if (
    fields.default_local_time.trim().length > 0 &&
    !localTimePattern.test(fields.default_local_time.trim())
  ) {
    errors.push("Default time must be a valid 24-hour HH:MM value.");
  }

  if (fields.frequency_type === "fixed_milestones") {
    if (parsedTarget === null) {
      errors.push("Milestone goals require a positive target count.");
    }
    if (parsedTarget !== null && fields.milestone_names.length !== parsedTarget) {
      errors.push("Milestone names must align with target count.");
    }
  }

  if (
    fields.frequency_type === "recurring" &&
    fields.target_basis === "lifetime" &&
    fields.target_count.trim().length === 0
  ) {
    errors.push("Total target completions requires a positive target.");
  }

  if (
    fields.frequency_type === "recurring" &&
    fields.target_basis === "lifetime" &&
    fields.target_count.trim().length > 0 &&
    parsedTarget === null
  ) {
    errors.push("Total target completions must be at least 1 when provided.");
  }

  if (
    fields.frequency_type === "recurring" &&
    fields.target_basis === "period" &&
    fields.target_count.trim().length > 0 &&
    parsedTarget === null
  ) {
    errors.push("Per-period target must be a positive whole number.");
  }

  if (!fields.start_date) {
    errors.push("Start date is required.");
  }

  const definitionTargetCount =
    fields.frequency_type === "fixed_milestones"
      ? parsedTarget
      : fields.target_count.trim()
        ? parsedTarget
        : fields.frequency_type === "recurring" && fields.target_basis === "period"
          ? parsePositiveTargetCount(normalizeGoalCreationTarget(fields))
          : null;

  for (const issue of validateGoalDefinition({
    frequencyType: fields.frequency_type,
    targetCount: definitionTargetCount,
    targetBasis:
      fields.frequency_type === "recurring" ? fields.target_basis : "lifetime",
    recurrenceInterval:
      fields.frequency_type === "recurring" ? fields.recurrence_interval : null,
    startDate: fields.start_date,
    endDate: fields.end_date || null,
  })) {
    errors.push(issue.message);
  }

  return errors;
}

export function parseGoalCreationTargetCount(raw: string): number | null {
  return parsePositiveTargetCount(raw);
}
