"use client";

import { Archive, Trash2, Undo2 } from "lucide-react";
import { useAppRouter } from "@/lib/navigation/use-app-router";
import { type ReactNode, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingCard } from "@/components/ui/loading-card";
import { GoalCreationFieldControls } from "@/features/goals/goal-creation-fields";
import { GoalDefaultTimeField } from "@/features/goals/goal-schedule-fields";
import {
  GoalFormLinkTargetsErrorAlert,
  GoalFormRecoveryAlert,
} from "@/features/goals/goal-form-alerts";
import { GoalFormHeader } from "@/features/goals/goal-form-header";
import {
  completeGoalEditor,
  dismissGoalEditor,
  goalEditorFallbackHref,
} from "@/features/goals/goal-editor-navigation";
import {
  applyGoalFormFieldChange,
  toGoalCreationFields,
} from "@/features/today/goal-form-model";
import { useGoalFormState } from "@/features/today/use-goal-form-state";
import { useGoalFormSubmit } from "@/features/today/use-goal-form-submit";

import { TempoGoalFields } from "@/features/goals/tempo-goal-fields";

interface GoalFormProps {
  goalId?: string;
  showBackButton?: boolean;
  modeSwitchControl?: ReactNode;
  onExit?: () => void;
  onDismiss?: () => void;
}

export function GoalForm({
  goalId,
  showBackButton = true,
  modeSwitchControl,
  onExit,
  onDismiss,
}: GoalFormProps) {
  const router = useAppRouter();
  const [createReady, setCreateReady] = useState(false);
  const GoalFields = goalId ? GoalCreationFieldControls : TempoGoalFields;
  const exitHref = goalEditorFallbackHref;
  const dismissEditor = useCallback(() => {
    if (onDismiss) {
      onDismiss();
      return;
    }
    dismissGoalEditor(router);
  }, [onDismiss, router]);
  const completeAndExit = useCallback(() => {
    if (onExit) {
      onExit();
      return;
    }
    completeGoalEditor(router);
  }, [onExit, router]);

  const {
    state,
    setState,
    selectedLinkTarget,
    setSelectedLinkTarget,
    loading,
    editingGoal,
    linkTargetsReady,
    linkTargetsError,
    linkLoadAttempt,
    setLinkLoadAttempt,
    linkTargetSearch,
    setLinkTargetSearch,
    linkTargetOpen,
    setLinkTargetOpen,
    createKind,
    updateCreateKind,
    isEditing,
    isPlannerTask,
    definitionFieldsLocked,
    completedCount,
    filteredLinkTargets,
    selectedLinkTargetGoal,
    validationError,
    validationWarning,
    supabase,
  } = useGoalFormState(goalId);

  const {
    saving,
    recovery,
    submitDisabled,
    onSubmit,
    retryGoalLink,
    toggleArchive,
    softDeleteGoal,
  } = useGoalFormSubmit({
    goalId,
    state,
    selectedLinkTarget,
    isEditing,
    isPlannerTask,
    linkTargetsReady,
    linkTargetsError,
    validationError,
    supabase,
    completeAndExit,
    dismissWithoutRefresh: dismissEditor,
    onExitRefresh: () => router.refresh(),
  });

  const goalFormId = isEditing ? "goal-form-edit" : "goal-form-create";

  if (loading && isEditing) {
    return (
      <LoadingCard
        title="Loading goal form..."
        description="Preparing your editing workspace."
      />
    );
  }

  return (
    <Card
      className={
        isEditing
          ? "gap-6 shadow-sm"
          : "h-full min-h-0 gap-0 border-0 bg-transparent py-0 shadow-none"
      }
    >
      {isEditing ? (
        <GoalFormHeader
          isEditing={isEditing}
          isPlannerTask={isPlannerTask}
          saving={saving}
          hasRecovery={recovery !== null}
          showBackButton={showBackButton}
          exitHref={exitHref}
          validationError={validationError}
          submitDisabled={submitDisabled}
          goalFormId={goalFormId}
          modeSwitchControl={modeSwitchControl}
          onBack={onExit || onDismiss ? dismissEditor : undefined}
        />
      ) : modeSwitchControl || showBackButton ? (
        <div className="flex items-center justify-between px-4">
          {modeSwitchControl}
          {showBackButton && (
            <Button
              type="button"
              variant="ghost"
              disabled={saving || recovery !== null}
              onClick={dismissEditor}
            >
              Cancel
            </Button>
          )}
        </div>
      ) : null}
      <CardContent className={isEditing ? "space-y-6" : "flex h-full min-h-0 flex-col px-2 sm:px-4"}>
        {recovery ? (
          <GoalFormRecoveryAlert
            kind={recovery.kind}
            saving={saving}
            onRetry={() =>
              recovery.kind === "link"
                ? void retryGoalLink()
                : void (
                    document.getElementById(
                      goalFormId,
                    ) as HTMLFormElement | null
                  )?.requestSubmit()
            }
          />
        ) : null}
        {linkTargetsError ? (
          <GoalFormLinkTargetsErrorAlert
            message={linkTargetsError}
            loading={loading}
            saving={saving}
            hasRecovery={recovery !== null}
            onRetry={() => setLinkLoadAttempt((attempt) => attempt + 1)}
          />
        ) : null}
        <form
          id={goalFormId}
          className={isEditing ? "space-y-6" : "flex min-h-0 flex-1 flex-col"}
          onSubmit={(event) => {
            if (!isEditing && !createReady && !recovery) {
              event.preventDefault();
              return;
            }
            void onSubmit(event);
          }}
        >
          {validationWarning ? (
            <div className="rounded-md border border-yellow-300 bg-yellow-100 px-3 py-2 text-xs text-orange-900 dark:border-yellow-300 dark:bg-yellow-100 dark:text-orange-900">
              {validationWarning}
            </div>
          ) : null}
          <GoalFields
            taskSchedule={{
              date: state.task_scheduled_date,
              time: state.task_scheduled_time,
            }}
            onReviewChange={setCreateReady}
            onPlaqueTargetChange={(target) => setState((previous) => ({ ...previous, plaque_target: target }))}
            error={validationError}
            action={
              <Button type="submit" disabled={submitDisabled}>
                {saving
                  ? "Creating…"
                  : isPlannerTask
                    ? "Create task"
                    : "Create goal"}
              </Button>
            }
            fields={toGoalCreationFields(state)}
            onFieldChange={(change) => {
              if (saving || recovery !== null) {
                return;
              }
              setState((previous) =>
                applyGoalFormFieldChange(previous, change),
              );
            }}
            onPatch={(patch) => {
              if (saving || recovery !== null) {
                return;
              }
              setState((previous) => ({ ...previous, ...patch }));
            }}
            definitionFieldsLocked={definitionFieldsLocked}
            completedCount={completedCount}
            disabled={saving || recovery !== null}
            includePlannerTask={!isEditing}
            createKind={createKind}
            onCreateKindChange={(nextKind) => {
              if (saving || recovery !== null) {
                return;
              }
              updateCreateKind(nextKind);
            }}
            isEditing={isEditing}
            isPlannerTask={isPlannerTask}
            titlePlaceholder={
              isPlannerTask
                ? "Write your top priority for today"
                : "Run 20 times by Dec 31"
            }
            teamId={state.team_id}
            linkTarget={{
              value: selectedLinkTarget,
              onValueChange: (value) => {
                if (saving || recovery !== null) {
                  return;
                }
                setSelectedLinkTarget(value);
              },
              open: linkTargetOpen,
              onOpenChange: (open) => {
                setLinkTargetOpen(open);
                if (!open) {
                  setLinkTargetSearch("");
                }
              },
              searchQuery: linkTargetSearch,
              onSearchQueryChange: setLinkTargetSearch,
              filteredLinkTargets,
              selectedTargetGoal: selectedLinkTargetGoal,
              disabled: !linkTargetsReady || saving || recovery !== null,
            }}
            extraGridSlot={
              isPlannerTask ? (
                <>
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="task-scheduled-date">Date</Label>
                    <Input
                      id="task-scheduled-date"
                      type="date"
                      required
                      value={state.task_scheduled_date}
                      onChange={(event) => {
                        if (saving || recovery !== null) {
                          return;
                        }
                        const nextDate = event.target.value;
                        if (!nextDate) {
                          return;
                        }
                        setState((previous) => ({
                          ...previous,
                          task_scheduled_date: nextDate,
                        }));
                      }}
                      disabled={saving || recovery !== null}
                      className="h-8 min-h-8 w-full min-w-0 py-0 text-sm leading-none [&::-webkit-calendar-picker-indicator]:size-3.5 [&::-webkit-datetime-edit]:p-0"
                    />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <GoalDefaultTimeField
                      id="task-scheduled-time"
                      label="Time of day (optional)"
                      showHelperText={false}
                      value={state.task_scheduled_time}
                      onValueChange={(value) => {
                        if (saving || recovery !== null) {
                          return;
                        }
                        setState((previous) => ({
                          ...previous,
                          task_scheduled_time: value,
                        }));
                      }}
                      onClear={() => {
                        if (saving || recovery !== null) {
                          return;
                        }
                        setState((previous) => ({
                          ...previous,
                          task_scheduled_time: "",
                        }));
                      }}
                    />
                  </div>
                </>
              ) : null
            }
            middleSlot={
              <div className="flex flex-wrap items-center gap-2">
                {isEditing && editingGoal?.archived_at ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving || recovery !== null}
                    onClick={() => toggleArchive(true)}
                  >
                    <Undo2 className="size-4" />
                    Restore goal
                  </Button>
                ) : null}
                {isEditing && !editingGoal?.archived_at ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving || recovery !== null}
                    onClick={() => toggleArchive(false)}
                  >
                    <Archive className="size-4" />
                    Archive goal
                  </Button>
                ) : null}
                {isEditing ? (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={saving || recovery !== null}
                    onClick={softDeleteGoal}
                  >
                    <Trash2 className="size-4" />
                    Delete goal
                  </Button>
                ) : null}
              </div>
            }
            startDateId="start-date"
            endDateId="end-date"
          />
        </form>
      </CardContent>
    </Card>
  );
}
