"use client";

import {
  ArrowLeft,
  Archive,
  CircleAlert,
  LoaderCircle,
  Save,
  Trash2,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useAppRouter } from "@/lib/navigation/use-app-router";
import { type ReactNode, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingCard } from "@/components/ui/loading-card";
import { Tooltip } from "@/components/ui/tooltip";
import { GoalCreationFieldControls } from "@/features/goals/goal-creation-fields";
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

  if (loading) {
    return (
      <LoadingCard
        title="Loading goal form..."
        description="Preparing your editing workspace."
      />
    );
  }

  return (
    <Card className="gap-6 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{isEditing ? "Edit goal" : "New goal"}</CardTitle>
            {modeSwitchControl}
          </div>
          <div className="flex items-center gap-2">
            {showBackButton ? (
              saving || recovery !== null ? (
                <Button type="button" variant="outline" disabled>
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
              ) : onExit || onDismiss ? (
                <Button type="button" variant="outline" onClick={dismissEditor}>
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link href={exitHref}>
                    <ArrowLeft className="size-4" />
                    Back
                  </Link>
                </Button>
              )
            ) : null}
            <div className="flex items-center gap-0">
              {validationError ? (
                <Tooltip content={validationError} side="bottom" align="end">
                  <span
                    className="inline-flex size-9 items-center justify-center text-destructive"
                    title={validationError}
                    tabIndex={0}
                    aria-label={validationError}
                  >
                    <CircleAlert className="size-4" />
                    <span className="sr-only">{validationError}</span>
                  </span>
                </Tooltip>
              ) : null}
              <Button type="submit" form={goalFormId} disabled={submitDisabled}>
                {saving ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {isEditing ? "Save changes" : isPlannerTask ? "Create task" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {recovery ? (
          <div
            role="alert"
            className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          >
            <p>
              {recovery.kind === "link"
                ? "The goal was saved, but its selected link was not. Retry to finish saving it."
                : recovery.kind === "update"
                  ? "The goal update could not be confirmed. Retry to safely reconcile it."
                  : "Goal creation could not be confirmed. Retry to safely reconcile this draft."}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={() =>
                recovery.kind === "link"
                  ? void retryGoalLink()
                  : void (
                      document.getElementById(goalFormId) as HTMLFormElement | null
                    )?.requestSubmit()
              }
              disabled={saving}
            >
              {recovery.kind === "link"
                ? "Retry saving link"
                : recovery.kind === "update"
                  ? "Retry saving goal"
                  : "Retry creating goal"}
            </Button>
          </div>
        ) : null}
        {linkTargetsError ? (
          <div
            role="alert"
            className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          >
            <p>{linkTargetsError}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={() => setLinkLoadAttempt((attempt) => attempt + 1)}
              disabled={loading || saving || recovery !== null}
            >
              Retry loading link targets
            </Button>
          </div>
        ) : null}
        <form id={goalFormId} className="space-y-6" onSubmit={onSubmit}>
          {validationWarning ? (
            <div className="rounded-md border border-yellow-300 bg-yellow-100 px-3 py-2 text-xs text-orange-900 dark:border-yellow-300 dark:bg-yellow-100 dark:text-orange-900">
              {validationWarning}
            </div>
          ) : null}
          <GoalCreationFieldControls
            fields={toGoalCreationFields(state)}
            onFieldChange={(change) => {
              if (saving || recovery !== null) {
                return;
              }
              setState((previous) => applyGoalFormFieldChange(previous, change));
            }}
            onPatch={(patch) => {
              if (saving || recovery !== null) {
                return;
              }
              setState((previous) => ({ ...previous, ...patch }));
            }}
            definitionFieldsLocked={definitionFieldsLocked}
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
              isPlannerTask ? "Write your top priority for today" : "Run 20 times by Dec 31"
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
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="task-scheduled-date">Date (optional)</Label>
                  <Input
                    id="task-scheduled-date"
                    type="date"
                    value={state.task_scheduled_date}
                    onChange={(event) => {
                      if (saving || recovery !== null) {
                        return;
                      }
                      setState((previous) => ({
                        ...previous,
                        task_scheduled_date: event.target.value,
                      }));
                    }}
                    disabled={saving || recovery !== null}
                    className="h-8 min-h-8 w-full min-w-0 py-0 text-sm leading-none [&::-webkit-calendar-picker-indicator]:size-3.5 [&::-webkit-datetime-edit]:p-0"
                  />
                </div>
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
