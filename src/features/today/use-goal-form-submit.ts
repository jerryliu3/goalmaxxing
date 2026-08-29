"use client";

import { type FormEvent, useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { invalidatePlannerRelatedTabCaches } from "@/lib/cache/planner-tab-cache";
import { getRpcErrorMessage } from "@/lib/supabase/rpc-error";
import { requestXpRefresh } from "@/lib/xp/events";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildGoalMutationArgs,
  type GoalFormGoalArgs,
  type GoalFormRecovery,
  type GoalFormState,
} from "@/features/today/goal-form-model";

interface UseGoalFormSubmitOptions {
  goalId?: string;
  state: GoalFormState;
  selectedLinkTarget: string;
  isEditing: boolean;
  isPlannerTask: boolean;
  linkTargetsReady: boolean;
  linkTargetsError: string | null;
  validationError: string | null;
  supabase: SupabaseClient;
  completeAndExit: () => void;
  dismissWithoutRefresh?: () => void;
  onExitRefresh?: () => void;
}

export function useGoalFormSubmit({
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
  dismissWithoutRefresh,
  onExitRefresh,
}: UseGoalFormSubmitOptions) {
  const [saving, setSaving] = useState(false);
  const [recovery, setRecovery] = useState<GoalFormRecovery | null>(null);
  const stableCreateGoalIdRef = useRef<string | null>(null);

  const submitDisabled =
    saving ||
    validationError !== null ||
    recovery !== null ||
    (!isPlannerTask && !linkTargetsReady);

  const replaceGoalLink = useCallback(
    async (savedGoalId: string, targetGoalId: string | undefined) => {
      const { error: linkError } = await supabase.rpc("replace_goal_source_link", {
        p_source_goal_id: savedGoalId,
        p_target_goal_id: targetGoalId,
      });
      return linkError;
    },
    [supabase]
  );

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (validationError) {
        return;
      }
      if (recovery?.kind === "link") {
        return;
      }
      if (!isPlannerTask && !linkTargetsReady) {
        toast.error(linkTargetsError ?? "Link targets are still loading. Try again.");
        return;
      }

      setSaving(true);

      if (isPlannerTask) {
        let error: { message?: string | null } | null = null;
        try {
          ({ error } = await supabase.rpc("create_planner_task", {
            p_title: state.title.trim(),
            p_scheduled_date: state.task_scheduled_date.trim(),
            p_scheduled_time: state.task_scheduled_time.trim() || undefined,
          }));
        } catch (cause) {
          toast.error(getRpcErrorMessage(cause, "Could not save task. Try again."));
          setSaving(false);
          return;
        }
        if (error) {
          toast.error(getRpcErrorMessage(error, "Could not save task. Try again."));
          setSaving(false);
          return;
        }
        invalidatePlannerRelatedTabCaches();
        toast.success("Task created.");
        completeAndExit();
        setSaving(false);
        return;
      }

      const recoveryGoalArgs =
        recovery?.kind === "create" || recovery?.kind === "update"
          ? recovery.goalArgs
          : undefined;
      const goalArgs = buildGoalMutationArgs({
        state,
        goalId,
        stableCreateGoalId: stableCreateGoalIdRef.current,
        recoveryGoalArgs,
      });

      if (!goalId && !stableCreateGoalIdRef.current) {
        stableCreateGoalIdRef.current = goalArgs.p_id;
      }

      const savedGoalId = goalArgs.p_id;

      if (goalId) {
        let error: { message?: string | null } | null = null;
        try {
          ({ error } = await supabase.rpc("update_goal", goalArgs));
        } catch (cause) {
          setRecovery({ kind: "update", goalArgs });
          toast.error(
            getRpcErrorMessage(cause, "Could not confirm goal update. Try again.")
          );
          setSaving(false);
          return;
        }

        if (error) {
          setRecovery(null);
          toast.error(
            getRpcErrorMessage(error, "Could not confirm goal update. Try again.")
          );
          setSaving(false);
          return;
        }
      } else {
        let error: { message?: string | null } | null = null;
        try {
          ({ error } = await supabase.rpc("create_goal", goalArgs));
        } catch (cause) {
          setRecovery({ kind: "create", goalArgs });
          toast.error(
            getRpcErrorMessage(cause, "Could not confirm goal creation. Try again.")
          );
          setSaving(false);
          return;
        }

        if (error) {
          setRecovery(null);
          toast.error(getRpcErrorMessage(error, "Could not save goal. Try again."));
          setSaving(false);
          return;
        }
      }

      invalidatePlannerRelatedTabCaches();

      const targetGoalId =
        selectedLinkTarget !== "none" ? selectedLinkTarget : undefined;
      try {
        const linkError = await replaceGoalLink(savedGoalId, targetGoalId);
        if (linkError) {
          setRecovery(null);
          toast.error(
            getRpcErrorMessage(
              linkError,
              "Could not save the selected goal link. Try again."
            )
          );
          setSaving(false);
          return;
        }
      } catch (cause) {
        setRecovery({ kind: "link", savedGoalId, targetGoalId });
        toast.error(
          getRpcErrorMessage(cause, "Could not save the selected goal link. Try again.")
        );
        setSaving(false);
        return;
      }

      invalidatePlannerRelatedTabCaches();
      setRecovery(null);
      toast.success(isEditing ? "Goal updated." : "Goal created.");
      requestXpRefresh();
      completeAndExit();
      setSaving(false);
    },
    [
      completeAndExit,
      goalId,
      isEditing,
      isPlannerTask,
      linkTargetsError,
      linkTargetsReady,
      recovery,
      replaceGoalLink,
      selectedLinkTarget,
      state,
      supabase,
      validationError,
    ]
  );

  const retryGoalLink = useCallback(async () => {
    if (recovery?.kind !== "link") {
      return;
    }

    setSaving(true);
    try {
      const linkError = await replaceGoalLink(
        recovery.savedGoalId,
        recovery.targetGoalId
      );
      if (linkError) {
        setRecovery(null);
        toast.error(
          getRpcErrorMessage(
            linkError,
            "Could not save the selected goal link. Try again."
          )
        );
        setSaving(false);
        return;
      }
    } catch (cause) {
      toast.error(
        getRpcErrorMessage(cause, "Could not save the selected goal link. Try again.")
      );
      setSaving(false);
      return;
    }

    setRecovery(null);
    invalidatePlannerRelatedTabCaches();
    toast.success(isEditing ? "Goal updated." : "Goal created.");
    requestXpRefresh();
    completeAndExit();
    setSaving(false);
  }, [completeAndExit, isEditing, recovery, replaceGoalLink]);

  const toggleArchive = useCallback(
    async (archived: boolean) => {
      if (!goalId) {
        return;
      }
      setSaving(true);

      const { error } = await supabase.rpc("set_goal_archived", {
        p_goal_id: goalId,
        p_archived: !archived,
      });

      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }

      invalidatePlannerRelatedTabCaches();
      requestXpRefresh();
      toast.success(archived ? "Goal restored to active." : "Goal archived.");
      if (archived) {
        onExitRefresh?.();
        setSaving(false);
        return;
      }

      (dismissWithoutRefresh ?? completeAndExit)();
      setSaving(false);
    },
    [
      completeAndExit,
      dismissWithoutRefresh,
      goalId,
      onExitRefresh,
      supabase,
    ]
  );

  const softDeleteGoal = useCallback(async () => {
    if (!goalId) {
      return;
    }

    setSaving(true);
    const { error } = await supabase.rpc("soft_delete_goal", {
      p_goal_id: goalId,
    });

    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    requestXpRefresh();
    invalidatePlannerRelatedTabCaches();
    toast.success("Goal deleted.");
    completeAndExit();
    setSaving(false);
  }, [completeAndExit, goalId, supabase]);

  return {
    saving,
    recovery,
    submitDisabled,
    onSubmit,
    retryGoalLink,
    toggleArchive,
    softDeleteGoal,
  };
}
