"use client";
import { useCoachPageContext } from "@/features/coach/use-coach-page-context";

import { useAppRouter } from "@/lib/navigation/use-app-router";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoalDefaultTimeField } from "@/features/goals/goal-schedule-fields";
import {
  GoalFormLinkTargetsErrorAlert,
  GoalFormRecoveryAlert,
} from "@/features/goals/goal-form-alerts";
import { completeGoalEditor } from "@/features/goals/goal-editor-navigation";
import {
  applyGoalFormFieldChange,
  defaultGoalFormState,
  type GoalFormState,
  toGoalCreationFields,
} from "@/features/today/goal-form-model";
import { useReportUnsavedChanges } from "@/features/goals/unsaved-changes";
import { useGoalFormState } from "@/features/today/use-goal-form-state";
import { useGoalFormSubmit } from "@/features/today/use-goal-form-submit";

import { TempoGoalFields } from "@/features/goals/tempo-goal-fields";

/**
 * Creates a goal or one-time task. A goal is saved at review; "Add more details" saves it and
 * stays open, so the optional details then update the saved goal. Editing an existing goal
 * otherwise happens on its card (`GoalCardEditor`).
 */
export function GoalForm({ onExit }: { onExit?: () => void }) {
  const router = useAppRouter();
  const [createReady, setCreateReady] = useState(false);
  // The saved goal and what was saved, so the details know what changed since.
  const [created, setCreated] = useState<{ goalId: string; state: GoalFormState; link: string } | null>(null);
  const openDetailsAfterCreate = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const submitGoalForm = () => formRef.current?.requestSubmit();
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
    linkTargetsReady,
    linkTargetsError,
    setLinkLoadAttempt,
    linkTargetSearch,
    setLinkTargetSearch,
    createKind,
    updateCreateKind,
    isPlannerTask,
    filteredLinkTargets,
    selectedLinkTargetGoal,
    validationError,
    validationWarning,
    supabase,
  } = useGoalFormState();
  useCoachPageContext({ surface: "goal" }, 10);
  const dirty = created
    ? JSON.stringify(state) !== JSON.stringify(created.state) || selectedLinkTarget !== created.link
    : JSON.stringify(state) !== JSON.stringify(defaultGoalFormState);
  useReportUnsavedChanges(dirty);

  const onCreated = useCallback(
    (goalId: string) => {
      if (!openDetailsAfterCreate.current) {
        completeAndExit();
        return;
      }
      setCreated({ goalId, state, link: selectedLinkTarget });
    },
    [completeAndExit, state, selectedLinkTarget],
  );

  const {
    saving,
    recovery,
    submitDisabled,
    onSubmit,
    retryGoalLink,
  } = useGoalFormSubmit({
    goalId: created?.goalId,
    state,
    selectedLinkTarget,
    isPlannerTask,
    linkTargetsReady,
    linkTargetsError,
    validationError,
    supabase,
    completeAndExit,
    onCreated,
  });

  return (
    <Card className="gap-0 border-0 bg-transparent py-0 shadow-none">
      <CardContent className="px-2 sm:px-4">
        {recovery ? (
          <GoalFormRecoveryAlert
            kind={recovery.kind}
            saving={saving}
            onRetry={() =>
              recovery.kind === "link" ? void retryGoalLink() : submitGoalForm()
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
          ref={formRef}
          className="space-y-6"
          onSubmit={(event) => {
            if (!createReady && !recovery) {
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
          <TempoGoalFields
            taskSchedule={{
              date: state.task_scheduled_date,
              time: state.task_scheduled_time,
            }}
            onReviewChange={setCreateReady}
            onPlaqueTargetChange={(target) => setState((previous) => ({ ...previous, plaque_target: target }))}
            reward={state.reward_text}
            error={validationError}
            action={
              <Button
                type="submit"
                disabled={submitDisabled}
                onClick={() => {
                  openDetailsAfterCreate.current = false;
                }}
              >
                {saving
                  ? "Creating…"
                  : isPlannerTask
                    ? "Create task"
                    : "Create goal"}
              </Button>
            }
            details={{
              saved: created !== null,
              onOpen: () => {
                openDetailsAfterCreate.current = true;
                submitGoalForm();
              },
              action: (
                <Button
                  type="button"
                  disabled={dirty ? submitDisabled : saving}
                  onClick={() => (dirty ? submitGoalForm() : completeAndExit())}
                >
                  {saving ? "Saving…" : dirty ? "Save details" : "Done"}
                </Button>
              ),
            }}
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
            disabled={saving || recovery !== null}
            includePlannerTask
            createKind={createKind}
            onCreateKindChange={(nextKind) => {
              if (saving || recovery !== null) {
                return;
              }
              updateCreateKind(nextKind);
            }}
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
            startDateId="start-date"
            endDateId="end-date"
          />
        </form>
      </CardContent>
    </Card>
  );
}
