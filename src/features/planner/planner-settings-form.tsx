"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CheckboxDropdown } from "@/components/ui/checkbox-dropdown";
import { restWeekdayOptions } from "@/features/planner/calendar-format";
import type { PlannerResetGoalOption } from "@/features/planner/planner-reset-goal-options";
import { cn } from "@/lib/utils";

interface PlannerSettingsFormProps {
  setupRestWeekdays: number[];
  onSetupRestWeekdaysChange: (next: number[]) => void;
  setupLoading: boolean;
  plannerReadOnly: boolean;
  loading: boolean;
  canResetPlan: boolean;
  resetLoading: boolean;
  rebuildLoading: boolean;
  hasDraftSession: boolean;
  canShowSaveAction: boolean;
  rebuildBlockedMessage: string | undefined;
  fullResetLoading: boolean;
  goalResetLoading: boolean;
  openGoals: PlannerResetGoalOption[];
  onSaveSettings: () => void;
  onUnlockAllGoals: () => void;
  onRefreshCalendar: () => void;
  onFullReset: () => void;
  onResetGoals: (goals: PlannerResetGoalOption[]) => void;
}

export function PlannerSettingsForm({
  setupRestWeekdays,
  onSetupRestWeekdaysChange,
  setupLoading,
  plannerReadOnly,
  loading,
  canResetPlan,
  resetLoading,
  rebuildLoading,
  hasDraftSession,
  canShowSaveAction,
  rebuildBlockedMessage,
  fullResetLoading,
  goalResetLoading,
  openGoals,
  onSaveSettings,
  onUnlockAllGoals,
  onRefreshCalendar,
  onFullReset,
  onResetGoals,
}: PlannerSettingsFormProps) {
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const goalOptions = useMemo(
    () =>
      openGoals.map((goal) => ({
        value: goal.goalId,
        label: goal.title,
      })),
    [openGoals]
  );
  const openGoalIds = useMemo(
    () => new Set(openGoals.map((goal) => goal.goalId)),
    [openGoals]
  );
  const visibleSelectedGoalIds = useMemo(
    () => selectedGoalIds.filter((goalId) => openGoalIds.has(goalId)),
    [openGoalIds, selectedGoalIds]
  );
  const selectedGoals = useMemo(
    () => openGoals.filter((goal) => visibleSelectedGoalIds.includes(goal.goalId)),
    [openGoals, visibleSelectedGoalIds]
  );

  const toggleRestWeekday = (weekday: number) =>
    onSetupRestWeekdaysChange(
      setupRestWeekdays.includes(weekday)
        ? setupRestWeekdays.filter((value) => value !== weekday)
        : [...setupRestWeekdays, weekday].sort((left, right) => left - right)
    );

  return (
    <div className="divide-y divide-border">
      <SettingsSection title="Rest days" description="New sessions are not scheduled on these days.">
        <div role="group" aria-label="Rest weekdays" className="flex flex-wrap gap-1.5">
          {restWeekdayOptions.map((option) => {
            const rest = setupRestWeekdays.includes(option.value);
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={rest}
                onClick={() => toggleRestWeekday(option.value)}
                className={cn(
                  "inline-flex h-8 min-w-11 items-center justify-center rounded-full border px-3 text-[13px] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  rest
                    ? "border-foreground bg-foreground font-medium text-background"
                    : "border-border bg-background text-foreground/80 hover:border-foreground/40 hover:text-foreground"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <Button type="button" size="sm" onClick={onSaveSettings} disabled={setupLoading}>
          {setupLoading ? "Saving..." : "Save rest days"}
        </Button>
      </SettingsSection>
      {!plannerReadOnly ? (
        <SettingsSection
          title="Calendar"
          description="Move unlocked sessions onto open days. Slipped sessions are reviewed from Agenda."
        >
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefreshCalendar}
              title={rebuildBlockedMessage}
              disabled={rebuildLoading || loading || hasDraftSession || !canShowSaveAction}
            >
              {rebuildLoading ? "Refreshing..." : "Refresh calendar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onUnlockAllGoals}
              title={!canResetPlan ? "No locked goals to unlock." : undefined}
              disabled={loading || resetLoading || !canResetPlan}
            >
              {resetLoading ? "Unlocking..." : "Unlock all goals"}
            </Button>
          </div>
        </SettingsSection>
      ) : null}
      <SettingsSection
        title="Reset"
        tone="destructive"
        description="Clears scheduled sessions across the 24-month planning horizon, for chosen goals or the whole plan."
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <CheckboxDropdown
            options={goalOptions}
            selectedValues={visibleSelectedGoalIds}
            onSelectedValuesChange={setSelectedGoalIds}
            placeholder={
              openGoals.length === 0 ? "No open goals available" : "Select goals to reset"
            }
            allLabel="No goals selected"
            enableSearch
            searchPlaceholder="Search goals"
            className="w-full sm:flex-1"
            triggerClassName="h-8 rounded-full text-sm"
            menuClassName="z-[220]"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={
              selectedGoals.length === 0 ||
              goalResetLoading ||
              loading ||
              resetLoading ||
              fullResetLoading
            }
            onClick={() => {
              if (selectedGoals.length === 0) {
                return;
              }
              onResetGoals(selectedGoals);
            }}
          >
            {goalResetLoading
              ? "Resetting goals..."
              : selectedGoals.length > 1
                ? `Reset ${selectedGoals.length} goals`
                : "Reset goal"}
          </Button>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="self-start"
          onClick={onFullReset}
          disabled={fullResetLoading || loading || resetLoading || goalResetLoading}
        >
          {fullResetLoading ? "Running full reset..." : "Full reset planner"}
        </Button>
      </SettingsSection>
    </div>
  );
}

function SettingsSection({
  title,
  description,
  tone,
  children,
}: {
  title: string;
  description: string;
  tone?: "destructive";
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2.5 py-4 first:pt-0 last:pb-0">
      <div>
        <h3 id={id} className={cn("text-sm font-medium", tone === "destructive" && "text-destructive")}>
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}
