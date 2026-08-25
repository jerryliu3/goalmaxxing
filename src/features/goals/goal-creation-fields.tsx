"use client";

import { ChevronDown, ChevronUp, Link2 } from "lucide-react";
import { endOfMonth, endOfYear, format, startOfMonth, startOfYear } from "date-fns";
import { type ReactNode, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipIcon } from "@/components/ui/tooltip-icon";
import {
  CategorySelect,
  GoalTypeToggle,
  RecurrenceIntervalToggle,
  TargetCountField,
} from "@/features/goals/goal-field-kit";
import { GoalLinkTargetSelect } from "@/features/goals/goal-link-target-select";
import { MilestoneNameFields } from "@/features/goals/milestone-name-fields";
import {
  GoalDateRangeFields,
  GoalDefaultTimeField,
} from "@/features/goals/goal-schedule-fields";
import {
  parseGoalCreationTargetCount,
  type GoalCreationFieldChange,
  type GoalCreationFields,
} from "@/features/goals/goal-creation-model";
import {
  GOAL_CREATE_KIND_HELP,
  type GoalCreateKind,
} from "@/lib/goals/form-options";
import { getCategorySwatchColor, type CategorySelection } from "@/lib/goals/category";
import { getLinkedTargetSchedulingNotice } from "@/lib/goals/linked-goal-labels";
import type { Goal, GoalDifficulty, RecurrenceInterval } from "@/lib/goals/types";
import { cn } from "@/lib/utils";

const lifetimeTargetLabel = "Total target completions";
const lifetimeTargetTooltip =
  "The target for the entire lifetime of this goal. Each completion counts independently.";

function perPeriodTargetLabel(interval: RecurrenceInterval): string {
  if (interval === "weekly") {
    return "Target per week";
  }
  if (interval === "monthly") {
    return "Target per month";
  }
  return "Target per period";
}

function recurringTargetLabel(
  interval: RecurrenceInterval,
  targetBasis: GoalCreationFields["target_basis"]
): string {
  if (targetBasis === "lifetime") {
    return lifetimeTargetLabel;
  }
  return perPeriodTargetLabel(interval);
}

function maxPeriodTarget(interval: RecurrenceInterval): number | undefined {
  if (interval === "weekly") {
    return 7;
  }
  if (interval === "monthly") {
    return 31;
  }
  return undefined;
}

export interface GoalCreationLinkTargetProps {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filteredLinkTargets: Goal[];
  selectedTargetGoal: Goal | null;
}

export interface GoalCreationFieldControlsProps {
  fields: GoalCreationFields;
  onFieldChange: (change: GoalCreationFieldChange) => void;
  onPatch: (patch: Partial<GoalCreationFields>) => void;
  definitionFieldsLocked: boolean;
  includePlannerTask?: boolean;
  createKind: GoalCreateKind;
  onCreateKindChange: (kind: GoalCreateKind) => void;
  isEditing: boolean;
  isPlannerTask: boolean;
  linkTarget: GoalCreationLinkTargetProps;
  teamId?: string | null;
  titlePlaceholder?: string;
  showSoftHorizonHint?: boolean;
  extraGridSlot?: ReactNode;
  middleSlot?: ReactNode;
  startDateId?: string;
  endDateId?: string;
}

export function GoalCreationFieldControls({
  fields,
  onFieldChange,
  onPatch,
  definitionFieldsLocked,
  includePlannerTask = false,
  createKind,
  onCreateKindChange,
  isEditing,
  isPlannerTask,
  linkTarget,
  teamId = null,
  titlePlaceholder = "Run 20 times by Dec 31",
  showSoftHorizonHint = false,
  extraGridSlot,
  middleSlot,
  startDateId = "start-date",
  endDateId = "end-date",
}: GoalCreationFieldControlsProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [milestoneNamesOpen, setMilestoneNamesOpen] = useState(false);

  const canShowRecurrenceFields = !isPlannerTask && fields.frequency_type === "recurring";
  const isLifetimeRecurringTarget =
    fields.frequency_type === "recurring" && fields.target_basis === "lifetime";
  const canShowRecurringTargetInMain =
    !isPlannerTask &&
    fields.frequency_type === "recurring" &&
    fields.recurrence_interval !== "daily" &&
    (fields.target_basis === "period" || fields.target_basis === "lifetime");
  const canShowDailyLifetimeTarget =
    !isPlannerTask &&
    fields.frequency_type === "recurring" &&
    fields.recurrence_interval === "daily" &&
    fields.target_basis === "lifetime";
  const canShowMilestoneTarget =
    !isPlannerTask && fields.frequency_type === "fixed_milestones";
  const parsedTargetCount = parseGoalCreationTargetCount(fields.target_count);
  const fixedMilestoneCount =
    fields.frequency_type === "fixed_milestones" ? parsedTargetCount ?? 0 : 0;
  const hasLinkedTarget = linkTarget.value !== "none";
  const showTeamScopedFields = teamId === null;
  const goalTypeValue = isEditing ? fields.frequency_type : createKind;
  const goalTypeHelp = GOAL_CREATE_KIND_HELP[goalTypeValue];

  const applyThisMonthEndDate = () => {
    onPatch({ end_date: format(endOfMonth(new Date()), "yyyy-MM-dd") });
  };

  const applyThisMonthStartDate = () => {
    onPatch({ start_date: format(startOfMonth(new Date()), "yyyy-MM-dd") });
  };

  const applyThisYearStartDate = () => {
    onPatch({ start_date: format(startOfYear(new Date()), "yyyy-MM-dd") });
  };

  const applyThisYearEndDate = () => {
    onPatch({ end_date: format(endOfYear(new Date()), "yyyy-MM-dd") });
  };

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="space-y-2">
          <Label htmlFor="goal-title">Name</Label>
          <Input
            id="goal-title"
            value={fields.title}
            onChange={(event) => onPatch({ title: event.target.value })}
            placeholder={titlePlaceholder}
            className="h-8 text-sm"
            required
          />
        </div>
        {isPlannerTask ? null : (
          <div className="space-y-2 sm:justify-self-end">
            <Label>Category</Label>
            <CategorySelect
              value={fields.category_selection}
              triggerClassName="h-8"
              onValueChange={(value: CategorySelection) =>
                onPatch({
                  category_selection: value,
                  color: getCategorySwatchColor(value),
                })
              }
            />
          </div>
        )}
      </div>

      {!isPlannerTask && fields.category_selection === "custom" ? (
        <div className="space-y-2">
          <Label htmlFor="custom-category">Custom category label</Label>
          <Input
            id="custom-category"
            value={fields.custom_category}
            onChange={(event) => onPatch({ custom_category: event.target.value })}
            placeholder="Your custom category"
            required
          />
        </div>
      ) : null}

      <div
        className={cn(
          "grid items-start gap-3",
          canShowRecurrenceFields
            ? "grid-cols-2 sm:grid-cols-3"
            : "grid-cols-2"
        )}
      >
        <div className="min-w-0 space-y-2">
          <Label className="inline-flex items-center gap-1">
            <span>Goal type</span>
          </Label>
          <GoalTypeToggle
            value={goalTypeValue}
            includePlannerTask={includePlannerTask}
            onValueChange={onCreateKindChange}
            triggerClassName="h-8"
            disabled={definitionFieldsLocked}
          />
          <p className="text-xs text-muted-foreground">{goalTypeHelp}</p>
        </div>

        {canShowMilestoneTarget ? (
          <div className="space-y-2">
            <Label htmlFor="target-count" className="inline-flex items-center gap-1">
              <span>Total milestones</span>
            </Label>
            <TargetCountField
              id="target-count"
              frequencyType={fields.frequency_type}
              value={fields.target_count}
              onValueChange={(value) => onFieldChange({ type: "target_count", value })}
              disabled={definitionFieldsLocked}
              showRecurringHelperText={false}
            />
            <p className="text-xs text-muted-foreground">
              You can optionally name individual milestones under advanced settings.
            </p>
          </div>
        ) : null}

        {canShowRecurrenceFields ? (
          <div className="min-w-0 space-y-2">
            <Label className="inline-flex items-center gap-1">
              <span>Frequency</span>
              <TooltipIcon
                content="How often you want to work on this goal. Weekly and monthly goals can set a target number of completions per period."
                label="Frequency help"
              />
            </Label>
            <RecurrenceIntervalToggle
              value={fields.recurrence_interval}
              triggerClassName="h-8"
              onValueChange={(value) =>
                onFieldChange({ type: "recurrence_interval", value })
              }
              disabled={definitionFieldsLocked}
            />
          </div>
        ) : null}

        {canShowRecurringTargetInMain ? (
          <div className="space-y-2">
            <Label
              htmlFor="recurring-target-count"
              className="inline-flex items-center gap-1"
            >
              <span>
                {recurringTargetLabel(
                  fields.recurrence_interval,
                  fields.target_basis
                )}
              </span>
              <TooltipIcon
                content={
                  fields.target_basis === "lifetime"
                    ? lifetimeTargetTooltip
                    : "How many distinct days you want to complete this goal in each week or month."
                }
                label="Recurring target help"
              />
            </Label>
            <TargetCountField
              id="recurring-target-count"
              frequencyType={fields.frequency_type}
              value={fields.target_count}
              onValueChange={(value) => onFieldChange({ type: "target_count", value })}
              minValue={1}
              maxValue={maxPeriodTarget(fields.recurrence_interval)}
              required={fields.target_basis === "period" || fields.target_basis === "lifetime"}
              disabled={definitionFieldsLocked}
              showRecurringHelperText={false}
            />
          </div>
        ) : null}

        {canShowDailyLifetimeTarget ? (
          <div className="space-y-2">
            <Label
              htmlFor="daily-lifetime-target-count"
              className="inline-flex items-center gap-1"
            >
              <span>{lifetimeTargetLabel}</span>
              <TooltipIcon content={lifetimeTargetTooltip} label="Lifetime target help" />
            </Label>
            <TargetCountField
              id="daily-lifetime-target-count"
              frequencyType={fields.frequency_type}
              value={fields.target_count}
              onValueChange={(value) => onFieldChange({ type: "target_count", value })}
              minValue={1}
              required
              disabled={definitionFieldsLocked}
              showRecurringHelperText={false}
            />
          </div>
        ) : null}

        {extraGridSlot}
      </div>

      {isPlannerTask ? null : (
        <GoalDateRangeFields
          startDate={fields.start_date}
          endDate={fields.end_date}
          onStartDateChange={(value) => onPatch({ start_date: value })}
          onEndDateChange={(value) => onPatch({ end_date: value })}
          requiresEndDate={false}
          startDateId={startDateId}
          endDateId={endDateId}
          disabled={definitionFieldsLocked}
          showSoftHorizonHint={showSoftHorizonHint}
          startDateActions={
            <>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={applyThisMonthStartDate}
                disabled={definitionFieldsLocked}
              >
                month start
              </button>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={applyThisYearStartDate}
                disabled={definitionFieldsLocked}
              >
                year start
              </button>
            </>
          }
          endDateActions={
            <>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={applyThisMonthEndDate}
                disabled={definitionFieldsLocked}
              >
                month end
              </button>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={applyThisYearEndDate}
                disabled={definitionFieldsLocked}
              >
                year end
              </button>
            </>
          }
        />
      )}

      {definitionFieldsLocked ? (
        <p className="text-xs text-muted-foreground">
          Goal type, frequency, target, and start date are fixed after creation.
          Archive this goal and create a new one to change them.
        </p>
      ) : null}

      {middleSlot}

      {isPlannerTask ? null : (
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <div className="rounded-xl border bg-muted/20">
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm"
              >
                <span className="inline-flex items-center gap-2">
                  <span>Advanced settings (optional)</span>
                  {hasLinkedTarget ? <Badge variant="secondary">Linked</Badge> : null}
                </span>
                {advancedOpen ? (
                  <ChevronUp className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-4 border-t px-3 py-3">
                <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
                  {fields.frequency_type === "recurring" && !definitionFieldsLocked ? (
                    <label className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={fields.target_basis === "lifetime"}
                        onChange={(event) =>
                          onFieldChange({
                            type: "target_basis",
                            value: event.target.checked ? "lifetime" : "period",
                          })
                        }
                      />
                      <span>Use a total completion target instead of per-period.</span>
                    </label>
                  ) : null}

                  {showTeamScopedFields ? (
                    <label className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={fields.is_private}
                        onChange={(event) => onPatch({ is_private: event.target.checked })}
                        aria-label="Make this goal private (except for team)."
                      />
                      <span>Make this goal private (except for team).</span>
                    </label>
                  ) : null}
                </div>

                {isLifetimeRecurringTarget && !definitionFieldsLocked ? (
                  <p className="text-xs text-muted-foreground">
                    Total by end date — edit the target above. Each completion counts
                    independently; no per-period streak semantics.
                  </p>
                ) : null}

                {fixedMilestoneCount > 0 ? (
                  <Collapsible
                    open={fixedMilestoneCount > 0 ? milestoneNamesOpen : false}
                    onOpenChange={setMilestoneNamesOpen}
                  >
                    <div className="rounded-xl border bg-background/70">
                      <CollapsibleTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm"
                        >
                          <span>Milestone names (optional)</span>
                          {milestoneNamesOpen ? (
                            <ChevronUp className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="space-y-3 border-t px-3 py-3">
                          <MilestoneNameFields
                            count={fixedMilestoneCount}
                            values={fields.milestone_names}
                            onValueChange={(index, value) =>
                              onFieldChange({ type: "milestone_name", index, value })
                            }
                            showLabel={false}
                            keyPrefix="milestone-name"
                          />
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ) : null}

                <div className="space-y-2">
                  <div
                    className={cn(
                      "grid gap-x-3 gap-y-2",
                      showTeamScopedFields
                        ? "grid-cols-1 sm:grid-cols-3"
                        : "grid-cols-1 sm:grid-cols-2"
                    )}
                  >
                    {showTeamScopedFields ? (
                      <Label className="inline-flex min-h-8 items-center gap-2 self-start">
                        <Link2 className="size-4 shrink-0 text-muted-foreground" />
                        <span>Make this a subgoal linked to...</span>
                      </Label>
                    ) : null}

                    <div className="flex min-h-8 items-center justify-between gap-2 self-start">
                      <Label htmlFor="default-local-time">Default time of day</Label>
                      {fields.default_local_time.trim().length > 0 ? (
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() => onPatch({ default_local_time: "" })}
                        >
                          clear
                        </button>
                      ) : null}
                    </div>

                    <Label
                      htmlFor="goal-difficulty"
                      className="inline-flex min-h-8 items-center gap-1 self-start"
                    >
                      <span>Difficulty</span>
                      <TooltipIcon
                        content="Set the perceived effort level for this goal."
                        label="Goal difficulty help"
                      />
                    </Label>

                    {showTeamScopedFields ? (
                      <GoalLinkTargetSelect
                        value={linkTarget.value}
                        onValueChange={linkTarget.onValueChange}
                        open={linkTarget.open}
                        onOpenChange={linkTarget.onOpenChange}
                        searchQuery={linkTarget.searchQuery}
                        onSearchQueryChange={linkTarget.onSearchQueryChange}
                        filteredLinkTargets={linkTarget.filteredLinkTargets}
                        selectedTargetGoal={linkTarget.selectedTargetGoal}
                        sourceEndDate={fields.end_date.trim() || null}
                        showLabel={false}
                        showHelperText={false}
                        showLinkedNotice={false}
                      />
                    ) : null}

                    <GoalDefaultTimeField
                      id="default-local-time"
                      showLabel={false}
                      showHelperText={false}
                      label="Default time of day"
                      value={fields.default_local_time}
                      onValueChange={(value) => onPatch({ default_local_time: value })}
                    />

                    <Select
                      value={fields.difficulty}
                      onValueChange={(value: GoalDifficulty) =>
                        onPatch({ difficulty: value })
                      }
                    >
                      <SelectTrigger id="goal-difficulty" className="h-8 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {showTeamScopedFields ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Completing this subgoal also counts toward its linked main goal for that
                        day.
                      </p>
                      {hasLinkedTarget && linkTarget.selectedTargetGoal ? (
                        <div
                          className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-400/50 dark:bg-amber-500/10 dark:text-amber-100"
                        >
                          <p className="font-medium">
                            Linking this subgoal to {linkTarget.selectedTargetGoal.title} may hide
                            that main goal in some calendar months.
                          </p>
                          <p className="mt-1">
                            {getLinkedTargetSchedulingNotice({
                              sourceEndDate: fields.end_date.trim() || null,
                            })}
                          </p>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </>
  );
}
