"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDisplayCategorySwatchColor } from "@/features/planner/goal-visuals";
import {
  CATEGORY_PRESETS,
  type CategorySelection,
} from "@/lib/goals/category";
import {
  GOAL_TYPE_OPTIONS,
  PLANNER_TASK_TYPE_OPTION,
  RECURRENCE_INTERVAL_OPTIONS,
  type GoalCreateKind,
} from "@/lib/goals/form-options";
import type { GoalFrequencyType, RecurrenceInterval } from "@/lib/goals/types";
import { MAX_GOAL_TARGET_COUNT } from "@/lib/planner/contracts/bounds";
import { cn } from "@/lib/utils";

interface CategorySelectProps {
  value: CategorySelection;
  onValueChange: (value: CategorySelection) => void;
  placeholder?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

export function CategorySelect({
  value,
  onValueChange,
  placeholder = "Select category",
  triggerClassName,
  disabled = false,
}: CategorySelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue as CategorySelection)}
      disabled={disabled}
    >
      <SelectTrigger className={cn(triggerClassName)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {CATEGORY_PRESETS.map((preset) => (
          <SelectItem key={preset.id} value={preset.id}>
            <span className="inline-flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: getDisplayCategorySwatchColor(preset.id) }}
              />
              {preset.label}
            </span>
          </SelectItem>
        ))}
        <SelectItem value="custom">
          <span className="inline-flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: getDisplayCategorySwatchColor("custom") }}
            />
            Custom
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

interface GoalTypeToggleProps {
  value: GoalCreateKind;
  onValueChange: (value: GoalCreateKind) => void;
  includePlannerTask?: boolean;
  triggerClassName?: string;
  disabled?: boolean;
}

export function GoalTypeToggle({
  value,
  onValueChange,
  includePlannerTask = false,
  triggerClassName,
  disabled = false,
}: GoalTypeToggleProps) {
  const options = includePlannerTask
    ? [...GOAL_TYPE_OPTIONS, PLANNER_TASK_TYPE_OPTION]
    : GOAL_TYPE_OPTIONS;

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue as GoalCreateKind)}
      disabled={disabled}
    >
      <SelectTrigger className={cn("h-9 w-full", triggerClassName)}>
        <SelectValue placeholder="Select goal type" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface RecurrenceIntervalToggleProps {
  value: RecurrenceInterval;
  onValueChange: (value: RecurrenceInterval) => void;
  triggerClassName?: string;
  disabled?: boolean;
}

export function RecurrenceIntervalToggle({
  value,
  onValueChange,
  triggerClassName,
  disabled = false,
}: RecurrenceIntervalToggleProps) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue as RecurrenceInterval)}
      disabled={disabled}
    >
      <SelectTrigger className={cn("h-9 w-full", triggerClassName)}>
        <SelectValue placeholder="Select frequency" />
      </SelectTrigger>
      <SelectContent>
        {RECURRENCE_INTERVAL_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface TargetCountFieldProps {
  id?: string;
  frequencyType: GoalFrequencyType;
  value: string;
  onValueChange: (value: string) => void;
  showRecurringHelperText?: boolean;
  recurringHelperText?: string;
  minValue?: number;
  maxValue?: number;
  required?: boolean;
  disabled?: boolean;
}

export function TargetCountField({
  id,
  frequencyType,
  value,
  onValueChange,
  showRecurringHelperText = true,
  recurringHelperText = "Optional total by end date. Edit the target above; each completion counts independently.",
  minValue,
  maxValue,
  required,
  disabled = false,
}: TargetCountFieldProps) {
  return (
    <>
      <Input
        id={id}
        type="number"
        min={minValue ?? (frequencyType === "fixed_milestones" ? 1 : 0)}
        max={maxValue ?? MAX_GOAL_TARGET_COUNT}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        required={required ?? (frequencyType === "fixed_milestones")}
        disabled={disabled}
      />
      {frequencyType === "recurring" && showRecurringHelperText ? (
        <p className="text-xs text-muted-foreground">{recurringHelperText}</p>
      ) : null}
    </>
  );
}
