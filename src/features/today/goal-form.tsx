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
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingCard } from "@/components/ui/loading-card";
import { Tooltip } from "@/components/ui/tooltip";
import { GoalCreationFieldControls } from "@/features/goals/goal-creation-fields";
import { buildLoginHref } from "@/lib/auth/login-redirect";
import { invalidatePlannerRelatedTabCaches } from "@/lib/cache/planner-tab-cache";
import { toLocalDateString } from "@/lib/dates/day";
import {
  DEFAULT_GOAL_CATEGORIES,
  getCategorySelectionFromValue,
  getCategoryValueForWrite,
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
  createDefaultGoalCreationFields,
  parseGoalCreationTargetCount,
  resolveGoalCreationColor,
  updateGoalCreationFields,
  type GoalCreationFieldChange,
  type GoalCreationFields,
} from "@/features/goals/goal-creation-model";
import {
  buildMilestoneNameDrafts,
  normalizeMilestoneNamesForSave,
} from "@/lib/goals/milestones";
import { isPlannerTaskCreateKind, type GoalCreateKind } from "@/lib/goals/form-options";
import type { Goal, GoalLink } from "@/lib/goals/types";
import { resolveGoalTargetBasis } from "@/lib/goals/target-basis";
import {
  type GoalCapacityInput,
  validateGoalDefinition,
} from "@/lib/goals/definition-validation";
import { resolveGoalDefinitionValidationFeedback } from "@/features/today/goal-form-validation";
import { createClient } from "@/lib/supabase/client";
import { requestXpRefresh } from "@/lib/xp/events";

interface GoalFormProps {
  goalId?: string;
  showBackButton?: boolean;
  modeSwitchControl?: ReactNode;
  onExit?: () => void;
}

interface GoalFormState extends GoalCreationFields {
  reward_text: string;
  team_id: string | null;
  task_scheduled_date: string;
}

interface GoalFormGoalArgs {
  p_id: string;
  p_title: string;
  p_description?: string;
  p_reward_text?: string;
  p_category: string;
  p_category_key: string;
  p_color: string;
  p_frequency_type: GoalFormState["frequency_type"];
  p_recurrence_interval?: GoalFormState["recurrence_interval"];
  p_difficulty: GoalFormState["difficulty"];
  p_target_count?: number;
  p_target_basis?: GoalFormState["target_basis"];
  p_milestone_names?: string[];
  p_start_date: string;
  p_end_date?: string;
  p_default_local_time?: string;
  p_team_id?: string;
  p_is_private: boolean;
}

type GoalFormRecovery =
  | {
      kind: "create";
      goalArgs: GoalFormGoalArgs;
    }
  | {
      kind: "update";
      goalArgs: GoalFormGoalArgs;
    }
  | {
      kind: "link";
      savedGoalId: string;
      targetGoalId: string | undefined;
    };

function rpcErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }
  return fallback;
}

export function getGoalFormTargetValidationError(
  fields: Pick<
    GoalCreationFields,
    "frequency_type" | "recurrence_interval" | "target_basis" | "target_count"
  >
): string | null {
  const parsedTargetCount = parseGoalCreationTargetCount(fields.target_count);

  if (
    fields.frequency_type === "fixed_milestones" &&
    parsedTargetCount === null
  ) {
    return "Milestone goals require a positive target count.";
  }

  if (
    fields.frequency_type === "recurring" &&
    fields.target_basis === "period" &&
    fields.target_count.trim().length > 0 &&
    parsedTargetCount === null
  ) {
    return "Per-period target must be a positive whole number.";
  }

  if (
    fields.frequency_type === "recurring" &&
    fields.target_basis === "period" &&
    fields.recurrence_interval !== "daily" &&
    parsedTargetCount === null
  ) {
    return "Recurring period goals require a target of at least 1.";
  }

  if (
    fields.frequency_type === "recurring" &&
    fields.target_basis === "lifetime" &&
    fields.target_count.trim().length > 0 &&
    parsedTargetCount === null
  ) {
    return "Total target completions must be at least 1 when provided.";
  }

  if (
    fields.frequency_type === "recurring" &&
    fields.target_basis === "lifetime" &&
    fields.target_count.trim().length === 0
  ) {
    return "Total target completions requires a positive target.";
  }

  return null;
}

const defaultState: GoalFormState = {
  ...createDefaultGoalCreationFields(),
  reward_text: "",
  team_id: null,
  task_scheduled_date: toLocalDateString(),
};

function toGoalCreationFields(state: GoalFormState): GoalCreationFields {
  return {
    title: state.title,
    description: state.description,
    category_selection: state.category_selection,
    custom_category: state.custom_category,
    color: state.color,
    frequency_type: state.frequency_type,
    recurrence_interval: state.recurrence_interval,
    target_count: state.target_count,
    target_basis: state.target_basis,
    milestone_names: state.milestone_names,
    start_date: state.start_date,
    end_date: state.end_date,
    default_local_time: state.default_local_time,
    difficulty: state.difficulty,
    is_private: state.is_private,
    linked_target_goal_id: "none",
  };
}

function mergeGoalCreationFields(
  state: GoalFormState,
  fields: GoalCreationFields
): GoalFormState {
  return {
    ...state,
    title: fields.title,
    description: fields.description,
    category_selection: fields.category_selection,
    custom_category: fields.custom_category,
    color: fields.color,
    frequency_type: fields.frequency_type,
    recurrence_interval: fields.recurrence_interval,
    target_count: fields.target_count,
    target_basis: fields.target_basis,
    milestone_names: fields.milestone_names,
    start_date: fields.start_date,
    end_date: fields.end_date,
    default_local_time: fields.default_local_time,
    difficulty: fields.difficulty,
    is_private: fields.is_private,
  };
}

function applyGoalCreationChange(
  state: GoalFormState,
  change: GoalCreationFieldChange
): GoalFormState {
  return mergeGoalCreationFields(
    state,
    updateGoalCreationFields(toGoalCreationFields(state), change)
  );
}

const localTimePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function GoalForm({
  goalId,
  showBackButton = true,
  modeSwitchControl,
  onExit,
}: GoalFormProps) {
  const supabase = useMemo(() => createClient(), []);
  const router = useAppRouter();
  const [state, setState] = useState<GoalFormState>(defaultState);
  const [selectedLinkTarget, setSelectedLinkTarget] = useState<string>("none");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [availableGoals, setAvailableGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [recovery, setRecovery] = useState<GoalFormRecovery | null>(null);
  const [linkTargetsReady, setLinkTargetsReady] = useState(false);
  const [linkTargetsError, setLinkTargetsError] = useState<string | null>(null);
  const [linkLoadAttempt, setLinkLoadAttempt] = useState(0);
  const [goalCapacityInput, setGoalCapacityInput] =
    useState<GoalCapacityInput | null>(null);
  const [linkTargetSearch, setLinkTargetSearch] = useState("");
  const [linkTargetOpen, setLinkTargetOpen] = useState(false);
  const [createKind, setCreateKind] = useState<GoalCreateKind>("recurring");
  const stableCreateGoalIdRef = useRef<string | null>(null);
  const isEditing = Boolean(goalId);
  const goalFormId = isEditing ? "goal-form-edit" : "goal-form-create";
  const exitHref = "/";
  const completeAndExit = useCallback(() => {
    if (onExit) {
      onExit();
      return;
    }
    router.replace(exitHref);
    router.refresh();
  }, [exitHref, onExit, router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLinkTargetsReady(false);
      setLinkTargetsError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const nextPath = `${window.location.pathname}${window.location.search}`;
        router.replace(buildLoginHref(nextPath));
        return;
      }

      setCurrentUserId(user.id);

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
      // Achievement stops planner placement, but active goals remain linkable
      // so users can intentionally continue beyond a target.
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
        goalOptionsResponse.error ??
        (goalId ? linksResponse.error : null);
      if (linkLoadError) {
        setLinkTargetsError(
          rpcErrorMessage(linkLoadError, "Could not load linkable goals.")
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

        if (goal.photo_path) {
          const { data: signedUrlData } = await supabase.storage
            .from("goal-photos")
            .createSignedUrl(goal.photo_path, 60 * 60);
          if (signedUrlData?.signedUrl) {
            setPhotoPreview(signedUrlData.signedUrl);
          }
        }
      }

      setLoading(false);
    };

    void load().catch((error: unknown) => {
      setLoading(false);
      setLinkTargetsReady(false);
      setLinkTargetsError(
        rpcErrorMessage(error, "Could not load linkable goals.")
      );
      toast.error(
        rpcErrorMessage(error, "Could not load linkable goals.")
      );
    });
  }, [goalId, linkLoadAttempt, router, supabase]);

  const isPlannerTask = !isEditing && isPlannerTaskCreateKind(createKind);
  const isLifetimeRecurringTarget =
    state.frequency_type === "recurring" && state.target_basis === "lifetime";
  const isPeriodRecurringTarget =
    state.frequency_type === "recurring" && state.target_basis === "period";
  const definitionFieldsLocked = isEditing;
  const parsedTargetCount = parseGoalCreationTargetCount(state.target_count);
  const definitionTargetCount =
    state.frequency_type === "fixed_milestones" || isLifetimeRecurringTarget
      ? parsedTargetCount
      : isPeriodRecurringTarget
        ? parsedTargetCount ?? 1
        : null;
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
  const updateCreateKind = (nextKind: GoalCreateKind) => {
    setCreateKind(nextKind);
    if (nextKind !== "planner_task") {
      setState((previous) =>
        applyGoalCreationChange(previous, { type: "frequency_type", value: nextKind })
      );
    }
  };

  const { validationError, validationWarning } = useMemo(() => {
    if (!state.title.trim()) {
      return { validationError: "Title is required.", validationWarning: null };
    }

    if (isPlannerTask) {
      return { validationError: null, validationWarning: null };
    }

    if (state.frequency_type === "recurring" && !state.recurrence_interval) {
      return {
        validationError: "Recurring goals require a frequency.",
        validationWarning: null,
      };
    }

    const targetValidationError = getGoalFormTargetValidationError(
      toGoalCreationFields(state)
    );
    if (targetValidationError) {
      return {
        validationError: targetValidationError,
        validationWarning: null,
      };
    }

    if (
      state.default_local_time.trim().length > 0 &&
      !localTimePattern.test(state.default_local_time.trim())
    ) {
      return {
        validationError: "Default time must be a valid 24-hour HH:MM value.",
        validationWarning: null,
      };
    }

    if (
      state.category_selection === "custom" &&
      state.custom_category.trim().length === 0
    ) {
      return {
        validationError: "Custom category name is required.",
        validationWarning: null,
      };
    }

    if (state.reward_text.trim().length > 500) {
      return {
        validationError:
          "Achievement reward text must be 500 characters or fewer.",
        validationWarning: null,
      };
    }

    const definitionIssues = validateGoalDefinition({
      frequencyType: state.frequency_type,
      targetCount: definitionTargetCount,
      targetBasis: state.target_basis,
      recurrenceInterval: state.recurrence_interval,
      startDate: state.start_date,
      endDate: state.end_date || null,
      asOfDate: toLocalDateString(),
      capacity: goalCapacityInput ?? undefined,
    });
    return resolveGoalDefinitionValidationFeedback(definitionIssues);
  }, [state, definitionTargetCount, goalCapacityInput, isPlannerTask]);
  const submitDisabled =
    saving ||
    validationError !== null ||
    recovery !== null ||
    (!isPlannerTask && !linkTargetsReady);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
          p_scheduled_date: state.task_scheduled_date.trim() || undefined,
        }));
      } catch (cause) {
        toast.error(rpcErrorMessage(cause, "Could not save task. Try again."));
        setSaving(false);
        return;
      }
      if (error) {
        toast.error(rpcErrorMessage(error, "Could not save task. Try again."));
        setSaving(false);
        return;
      }
      invalidatePlannerRelatedTabCaches();
      toast.success("Task created.");
      completeAndExit();
      setSaving(false);
      return;
    }
    const parsedTargetCountForSave = parseGoalCreationTargetCount(state.target_count);
    const milestoneNames =
      state.frequency_type === "fixed_milestones" && parsedTargetCountForSave !== null
        ? normalizeMilestoneNamesForSave(parsedTargetCountForSave, state.milestone_names)
        : undefined;
    const recurringTargetForSave =
      state.frequency_type === "recurring" && isLifetimeRecurringTarget
        ? parsedTargetCountForSave ?? undefined
        : state.frequency_type === "recurring" && state.target_basis === "period"
          ? state.recurrence_interval === "daily"
            ? 1
            : parsedTargetCountForSave ?? 1
          : undefined;
    const categoryValue = getCategoryValueForWrite(
      state.category_selection,
      state.custom_category
    );

    const goalArgs: GoalFormGoalArgs =
      recovery?.kind === "create" || recovery?.kind === "update"
      ? recovery.goalArgs
      : {
      p_id:
        goalId ??
        stableCreateGoalIdRef.current ??
        crypto.randomUUID(),
      p_title: state.title.trim(),
      p_description: state.description.trim() || undefined,
      p_reward_text: state.reward_text.trim() || undefined,
      p_category: categoryValue.category,
      p_category_key: categoryValue.categoryKey,
      p_color: state.color,
      p_frequency_type: state.frequency_type,
      p_recurrence_interval:
        state.frequency_type === "recurring" ? state.recurrence_interval : undefined,
      p_difficulty: state.difficulty,
      p_target_count:
        state.frequency_type === "fixed_milestones"
          ? parsedTargetCountForSave ?? undefined
          : recurringTargetForSave,
      p_target_basis:
        state.frequency_type === "recurring" ? state.target_basis : undefined,
      p_milestone_names: milestoneNames,
      p_start_date: state.start_date,
      p_end_date: state.end_date || undefined,
      p_default_local_time: state.default_local_time.trim() || undefined,
      p_team_id: state.team_id ?? undefined,
      p_is_private: state.team_id ? false : state.is_private,
      };

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
          rpcErrorMessage(cause, "Could not confirm goal update. Try again.")
        );
        setSaving(false);
        return;
      }

      if (error) {
        setRecovery({ kind: "update", goalArgs });
        toast.error(
          rpcErrorMessage(error, "Could not confirm goal update. Try again.")
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
          rpcErrorMessage(cause, "Could not confirm goal creation. Try again.")
        );
        setSaving(false);
        return;
      }

      if (error) {
        setRecovery({ kind: "create", goalArgs });
        toast.error(
          rpcErrorMessage(error, "Could not confirm goal creation. Try again.")
        );
        setSaving(false);
        return;
      }
    }

    invalidatePlannerRelatedTabCaches();

    if (photoFile) {
      const fileName = `${Date.now()}-${photoFile.name.replace(/\s+/g, "-")}`;
      const objectPath = `${currentUserId}/${savedGoalId}/${fileName}`;
      const uploadResponse = await supabase.storage
        .from("goal-photos")
        .upload(objectPath, photoFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadResponse.error) {
        toast.error(uploadResponse.error.message);
      } else {
        const { error: photoError } = await supabase.rpc("set_goal_photo_path", {
          p_goal_id: savedGoalId,
          p_photo_path: objectPath,
        });
        if (photoError) {
          toast.error(photoError.message);
        }
      }
    }

    const targetGoalId =
      selectedLinkTarget !== "none" ? selectedLinkTarget : undefined;
    let linkError: { message?: string | null } | null = null;
    try {
      ({ error: linkError } = await supabase.rpc("replace_goal_source_link", {
        p_source_goal_id: savedGoalId,
        p_target_goal_id: targetGoalId,
      }));
    } catch (cause) {
      setRecovery({ kind: "link", savedGoalId, targetGoalId });
      toast.error(
        rpcErrorMessage(cause, "Could not save the selected goal link. Try again.")
      );
      setSaving(false);
      return;
    }
    if (linkError) {
      setRecovery({ kind: "link", savedGoalId, targetGoalId });
      toast.error(
        rpcErrorMessage(
          linkError,
          "Could not save the selected goal link. Try again."
        )
      );
      setSaving(false);
      return;
    }

    setRecovery(null);
    toast.success(isEditing ? "Goal updated." : "Goal created.");
    requestXpRefresh();
    completeAndExit();
    setSaving(false);
  };

  const retryGoalLink = async () => {
    if (recovery?.kind !== "link") {
      return;
    }

    setSaving(true);
    let linkError: { message?: string | null } | null = null;
    try {
      ({ error: linkError } = await supabase.rpc("replace_goal_source_link", {
        p_source_goal_id: recovery.savedGoalId,
        p_target_goal_id: recovery.targetGoalId,
      }));
    } catch (cause) {
      toast.error(
        rpcErrorMessage(cause, "Could not save the selected goal link. Try again.")
      );
      setSaving(false);
      return;
    }

    if (linkError) {
      toast.error(
        rpcErrorMessage(
          linkError,
          "Could not save the selected goal link. Try again."
        )
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
  };

  const toggleArchive = async (archived: boolean) => {
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
    } else {
      invalidatePlannerRelatedTabCaches();
      toast.success(archived ? "Goal restored to active." : "Goal archived.");
      if (archived) {
        router.refresh();
      } else {
        completeAndExit();
      }
    }

    setSaving(false);
  };

  const softDeleteGoal = async () => {
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
  };

  if (loading) {
    return (
      <LoadingCard
        title="Loading goal form..."
        description="Preparing your editing workspace."
      />
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{isEditing ? "Edit goal" : "New goal"}</CardTitle>
            {modeSwitchControl}
          </div>
          <div className="flex items-center gap-2">
            {showBackButton ? (
              onExit ? (
                <Button type="button" variant="outline" onClick={onExit}>
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
                {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
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
              disabled={loading}
            >
              Retry loading link targets
            </Button>
          </div>
        ) : null}
        <form id={goalFormId} className="space-y-4" onSubmit={onSubmit}>
          {validationWarning ? (
            <div className="rounded-md border border-yellow-300 bg-yellow-100 px-3 py-2 text-xs text-orange-900 dark:border-yellow-300 dark:bg-yellow-100 dark:text-orange-900">
              {validationWarning}
            </div>
          ) : null}
          <GoalCreationFieldControls
            fields={toGoalCreationFields(state)}
            onFieldChange={(change) =>
              setState((previous) => applyGoalCreationChange(previous, change))
            }
            onPatch={(patch) => setState((previous) => ({ ...previous, ...patch }))}
            definitionFieldsLocked={definitionFieldsLocked}
            disabled={recovery !== null}
            includePlannerTask={!isEditing}
            createKind={createKind}
            onCreateKindChange={updateCreateKind}
            isEditing={isEditing}
            isPlannerTask={isPlannerTask}
            titlePlaceholder={
              isPlannerTask ? "Write your top priority for today" : "Run 20 times by Dec 31"
            }
            teamId={state.team_id}
            linkTarget={{
              value: selectedLinkTarget,
              onValueChange: setSelectedLinkTarget,
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
              disabled: !linkTargetsReady,
            }}
            extraGridSlot={
              isPlannerTask ? (
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="task-scheduled-date">Date (optional)</Label>
                  <Input
                    id="task-scheduled-date"
                    type="date"
                    value={state.task_scheduled_date}
                    onChange={(event) =>
                      setState((previous) => ({
                        ...previous,
                        task_scheduled_date: event.target.value,
                      }))
                    }
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
                    disabled={saving}
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
                    disabled={saving}
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
                    disabled={saving}
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
