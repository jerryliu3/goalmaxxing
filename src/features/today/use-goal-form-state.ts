"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getGoalCreationValidationFeedback,
  resolveGoalCreationColor,
} from "@/features/goals/goal-creation-model";
import { buildLoginHref } from "@/lib/auth/login-redirect";
import { toLocalDateString } from "@/lib/dates/day";
import {
  DEFAULT_GOAL_CATEGORIES,
  getCategorySelectionFromValue,
} from "@/lib/goals/category";
import {
  fetchProgressContext,
  progressSummaryMap,
} from "@/lib/goals/progress-context";
import {
  getLinkedGoalDeadlineLabel,
  getLinkedGoalRecurrenceLabel,
} from "@/lib/goals/linked-goal-labels";
import {
  buildMilestoneNameDrafts,
} from "@/lib/goals/milestones";
import { isPlannerTaskCreateKind, type GoalCreateKind } from "@/lib/goals/form-options";
import type { Goal, GoalLink } from "@/lib/goals/types";
import { resolveGoalTargetBasis } from "@/lib/goals/target-basis";
import { type GoalCapacityInput } from "@/lib/goals/definition-validation";
import { createClient } from "@/lib/supabase/client";
import { getRpcErrorMessage } from "@/lib/supabase/rpc-error";
import { useAppRouter } from "@/lib/navigation/use-app-router";
import {
  applyGoalFormCreateKindChange,
  defaultGoalFormState,
  toGoalCreationFields,
  type GoalFormState,
} from "@/features/today/goal-form-model";

export function useGoalFormState(goalId?: string) {
  const supabase = useMemo(() => createClient(), []);
  const router = useAppRouter();
  const [state, setState] = useState<GoalFormState>(defaultGoalFormState);
  const [selectedLinkTarget, setSelectedLinkTarget] = useState<string>("none");
  const [availableGoals, setAvailableGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [linkTargetsReady, setLinkTargetsReady] = useState(false);
  const [linkTargetsError, setLinkTargetsError] = useState<string | null>(null);
  const [linkLoadAttempt, setLinkLoadAttempt] = useState(0);
  const [goalCapacityInput, setGoalCapacityInput] =
    useState<GoalCapacityInput | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [linkTargetSearch, setLinkTargetSearch] = useState("");
  const [linkTargetOpen, setLinkTargetOpen] = useState(false);
  const [createKind, setCreateKind] = useState<GoalCreateKind>("recurring");

  const isEditing = Boolean(goalId);
  const isPlannerTask = !isEditing && isPlannerTaskCreateKind(createKind);
  const definitionFieldsLocked = isEditing;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLinkTargetsReady(false);
      setLinkTargetsError(null);
      setCompletedCount(0);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const nextPath = `${window.location.pathname}${window.location.search}`;
        router.replace(buildLoginHref(nextPath));
        return;
      }

      const [goalOptionsResponse, goalResponse, linksResponse, progress, profileResponse] =
        await Promise.all([
          supabase
            .from("goals")
            .select("*")
            .eq("owner_id", user.id)
            .eq("is_deleted", false)
            .order("title"),
          goalId
            ? supabase
                .from("goals")
                .select("*")
                .eq("id", goalId)
                .eq("is_deleted", false)
                .single()
            : Promise.resolve({ data: null, error: null } as const),
          goalId
            ? supabase
                .from("goal_links")
                .select("*")
                .eq("owner_id", user.id)
                .eq("source_goal_id", goalId)
            : Promise.resolve({ data: null, error: null } as const),
          fetchProgressContext({ asOfDate: toLocalDateString() }),
          supabase
            .from("profiles")
            .select("rest_weekdays, blackout_ranges")
            .eq("id", user.id)
            .maybeSingle(),
        ]);

      const goals = (goalOptionsResponse.data ?? []) as Goal[];
      const progressByGoal = progressSummaryMap(progress);
      const linkableGoals = goals.filter(
        (goal) =>
          goal.id !== goalId &&
          goal.team_id === null &&
          progressByGoal.get(goal.id)?.lifecycle === "active"
      );
      if (goalOptionsResponse.error) {
        setAvailableGoals([]);
      } else {
        setAvailableGoals(linkableGoals);
      }
      const linkLoadError =
        goalOptionsResponse.error ?? (goalId ? linksResponse.error : null);
      if (linkLoadError) {
        setLinkTargetsError(
          getRpcErrorMessage(linkLoadError, "Could not load linkable goals.")
        );
      } else {
        setLinkTargetsReady(true);
      }
      if (profileResponse.error) {
        setGoalCapacityInput(null);
      } else {
        const restWeekdays = Array.isArray(profileResponse.data?.rest_weekdays)
          ? profileResponse.data.rest_weekdays.filter(
              (weekday): weekday is number =>
                Number.isInteger(weekday) && weekday >= 0 && weekday <= 6
            )
          : [];
        const blackoutRanges = Array.isArray(profileResponse.data?.blackout_ranges)
          ? profileResponse.data.blackout_ranges.flatMap((range) => {
              if (
                typeof range !== "object" ||
                range === null ||
                !("start" in range) ||
                !("end" in range)
              ) {
                return [];
              }
              const start = (range as { start?: unknown }).start;
              const end = (range as { end?: unknown }).end;
              if (
                typeof start !== "string" ||
                typeof end !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
                !/^\d{4}-\d{2}-\d{2}$/.test(end)
              ) {
                return [];
              }
              if (start > end) {
                return [];
              }
              return [{ start, end }];
            })
          : [];
        setGoalCapacityInput({ restWeekdays, blackoutRanges });
      }

      if (goalResponse.data) {
        const goal = goalResponse.data as Goal;
        const categoryState = getCategorySelectionFromValue(
          goal.category,
          DEFAULT_GOAL_CATEGORIES,
          goal.category_key
        );
        setEditingGoal(goal);
        setCompletedCount(progressByGoal.get(goal.id)?.admissibleCompletionCount ?? 0);
        setState({
          title: goal.title,
          description: goal.description ?? "",
          reward_text: goal.reward_text ?? "",
          category_selection: categoryState.selection,
          custom_category: categoryState.customValue,
          color: resolveGoalCreationColor(goal.color, categoryState.selection),
          frequency_type: goal.frequency_type,
          recurrence_interval: goal.recurrence_interval ?? "daily",
          difficulty: goal.difficulty ?? "medium",
          target_basis: resolveGoalTargetBasis(goal),
          target_count: goal.target_count?.toString() ?? "",
          milestone_names: buildMilestoneNameDrafts(
            goal.target_count ?? 0,
            goal.milestone_names ?? []
          ),
          start_date: goal.start_date,
          end_date: goal.end_date ?? "",
          default_local_time: goal.default_local_time ?? "",
          linked_target_goal_id: "none",
          team_id: goal.team_id ?? null,
          is_private: goal.is_private ?? false,
          task_scheduled_date: toLocalDateString(),
          task_scheduled_time: "",
        });
        setCreateKind(goal.frequency_type);

        if (!linksResponse.error) {
          const existingLinks = (linksResponse.data ?? []) as GoalLink[];
          if (existingLinks.length > 0) {
            setSelectedLinkTarget(existingLinks[0].target_goal_id);
          } else {
            setSelectedLinkTarget("none");
          }
        }
      }

      setLoading(false);
    };

    void load().catch((error: unknown) => {
      setLoading(false);
      setLinkTargetsReady(false);
      setLinkTargetsError(
        getRpcErrorMessage(error, "Could not load linkable goals.")
      );
      toast.error(getRpcErrorMessage(error, "Could not load linkable goals."));
    });
  }, [goalId, linkLoadAttempt, router, supabase]);

  const filteredLinkTargets = useMemo(() => {
    const query = linkTargetSearch.trim().toLowerCase();
    if (query.length === 0) {
      return availableGoals;
    }

    return availableGoals.filter((goal) => {
      const recurrenceLabel = getLinkedGoalRecurrenceLabel(goal).toLowerCase();
      const deadlineLabel = getLinkedGoalDeadlineLabel(goal).toLowerCase();
      return (
        goal.title.toLowerCase().includes(query) ||
        recurrenceLabel.includes(query) ||
        deadlineLabel.includes(query)
      );
    });
  }, [availableGoals, linkTargetSearch]);

  const selectedLinkTargetGoal = useMemo(
    () =>
      selectedLinkTarget === "none"
        ? null
        : availableGoals.find((goal) => goal.id === selectedLinkTarget) ?? null,
    [availableGoals, selectedLinkTarget]
  );

  const updateCreateKind = useCallback((nextKind: GoalCreateKind) => {
    setCreateKind(nextKind);
    setState((previous) => applyGoalFormCreateKindChange(previous, nextKind));
  }, []);

  const { validationError, validationWarning } = useMemo(() => {
    if (isPlannerTask) {
      if (!state.title.trim()) {
        return { validationError: "Title is required.", validationWarning: null };
      }
      if (!state.task_scheduled_date.trim()) {
        return {
          validationError: "Task date is required.",
          validationWarning: null,
        };
      }
      if (
        state.task_scheduled_time.trim().length > 0 &&
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(state.task_scheduled_time.trim())
      ) {
        return {
          validationError: "Time of day must be a valid 24-hour HH:MM value.",
          validationWarning: null,
        };
      }
      return { validationError: null, validationWarning: null };
    }

    const feedback = getGoalCreationValidationFeedback(toGoalCreationFields(state), {
      capacity: goalCapacityInput ?? undefined,
      asOfDate: toLocalDateString(),
      completedCount,
    });
    if (feedback.validationError) {
      return feedback;
    }

    if (state.reward_text.trim().length > 500) {
      return {
        validationError: "Achievement reward text must be 500 characters or fewer.",
        validationWarning: null,
      };
    }

    return feedback;
  }, [state, goalCapacityInput, completedCount, isPlannerTask]);

  return {
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
  };
}
