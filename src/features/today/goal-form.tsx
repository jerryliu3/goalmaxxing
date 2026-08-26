"use client";

import {
  ArrowLeft,
  Archive,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Link2,
  LoaderCircle,
  Save,
  Trash2,
  Undo2,
} from "lucide-react";
import { endOfMonth, endOfYear, format, startOfMonth, startOfYear } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { useAppRouter } from "@/lib/navigation/use-app-router";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingCard } from "@/components/ui/loading-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TooltipIcon } from "@/components/ui/tooltip-icon";
import { Tooltip } from "@/components/ui/tooltip";
import {
  CategorySelect,
  GoalTypeToggle,
  RecurrenceIntervalToggle,
  TargetCountField,
} from "@/features/goals/goal-field-kit";
import { GoalLinkTargetSelect } from "@/features/goals/goal-link-target-select";
import { MilestoneNameFields } from "@/features/goals/milestone-name-fields";
import { buildLoginHref } from "@/lib/auth/login-redirect";
import { invalidatePlannerRelatedTabCaches } from "@/lib/cache/planner-tab-cache";
import {
  GoalDateRangeFields,
  GoalDefaultTimeField,
} from "@/features/goals/goal-schedule-fields";
import { toLocalDateString } from "@/lib/dates/day";
import {
  DEFAULT_GOAL_CATEGORIES,
  type CategorySelection,
  getCategorySelectionFromValue,
  getCategorySwatchColor,
  getCategoryValueForWrite,
} from "@/lib/goals/category";
import {
  fetchProgressContext,
  progressSummaryMap,
} from "@/lib/goals/progress-context";
import {
  getLinkedGoalDeadlineLabel,
  getLinkedGoalRecurrenceLabel,
  getLinkedTargetSchedulingNotice,
} from "@/lib/goals/linked-goal-labels";
import {
  buildMilestoneNameDrafts,
  normalizeMilestoneNamesForSave,
} from "@/lib/goals/milestones";
import {
  GOAL_CREATE_KIND_HELP,
  isPlannerTaskCreateKind,
  type GoalCreateKind,
} from "@/lib/goals/form-options";
import type {
  Goal,
  GoalDifficulty,
  GoalFrequencyType,
  GoalLink,
  GoalTargetBasis,
  RecurrenceInterval,
} from "@/lib/goals/types";
import { resolveGoalTargetBasis } from "@/lib/goals/target-basis";
import {
  type GoalCapacityInput,
  validateGoalDefinition,
} from "@/lib/goals/definition-validation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { requestXpRefresh } from "@/lib/xp/events";

interface GoalFormProps {
  goalId?: string;
  showBackButton?: boolean;
  modeSwitchControl?: ReactNode;
  onExit?: () => void;
}

interface GoalFormState {
  title: string;
  description: string;
  reward_text: string;
  category_selection: CategorySelection;
  custom_category: string;
  color: string;
  frequency_type: GoalFrequencyType;
  recurrence_interval: RecurrenceInterval;
  difficulty: GoalDifficulty;
  target_basis: GoalTargetBasis;
  target_count: string;
  milestone_names: string[];
  start_date: string;
  end_date: string;
  default_local_time: string;
  team_id: string | null;
  is_private: boolean;
  task_scheduled_date: string;
}

const defaultState: GoalFormState = {
  title: "",
  description: "",
  reward_text: "",
  category_selection: "personal",
  custom_category: "",
  color: getCategorySwatchColor("personal"),
  frequency_type: "recurring",
  recurrence_interval: "daily",
  difficulty: "medium",
  target_basis: "period",
  target_count: "",
  milestone_names: [],
  start_date: toLocalDateString(),
  end_date: "",
  default_local_time: "",
  team_id: null,
  is_private: false,
  task_scheduled_date: toLocalDateString(),
};

const localTimePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const lifetimeTargetLabel = "Total target completions";
const lifetimeTargetOptionalLabel = `${lifetimeTargetLabel} (optional)`;
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
  targetBasis: GoalTargetBasis
): string {
  if (targetBasis === "lifetime") {
    return lifetimeTargetOptionalLabel;
  }
  return perPeriodTargetLabel(interval);
}

function parsePositiveTargetCount(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

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
  const [goalCapacityInput, setGoalCapacityInput] =
    useState<GoalCapacityInput | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [milestoneNamesOpen, setMilestoneNamesOpen] = useState(false);
  const [linkTargetSearch, setLinkTargetSearch] = useState("");
  const [linkTargetOpen, setLinkTargetOpen] = useState(false);
  const [createKind, setCreateKind] = useState<GoalCreateKind>("recurring");
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
      const linkableGoalIdSet = new Set(linkableGoals.map((goal) => goal.id));
      setAvailableGoals(linkableGoals);
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
          color: getCategorySwatchColor(categoryState.selection),
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
          team_id: goal.team_id ?? null,
          is_private: goal.is_private ?? false,
          task_scheduled_date: toLocalDateString(),
        });
        setCreateKind(goal.frequency_type);

        const existingLinks = (linksResponse.data ?? []) as GoalLink[];
        if (existingLinks.length > 0 && linkableGoalIdSet.has(existingLinks[0].target_goal_id)) {
          setSelectedLinkTarget(existingLinks[0].target_goal_id);
        } else {
          setSelectedLinkTarget("none");
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
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not load linkable goals."
      );
    });
  }, [goalId, router, supabase]);

  const isPlannerTask = !isEditing && isPlannerTaskCreateKind(createKind);
  const canShowRecurrenceFields = !isPlannerTask && state.frequency_type === "recurring";
  const isLifetimeRecurringTarget =
    state.frequency_type === "recurring" && state.target_basis === "lifetime";
  const isPeriodRecurringTarget =
    state.frequency_type === "recurring" && state.target_basis === "period";
  const canShowRecurringTargetInMain =
    !isPlannerTask &&
    state.frequency_type === "recurring" &&
    state.recurrence_interval !== "daily" &&
    (state.target_basis === "period" || state.target_basis === "lifetime");
  const canShowDailyLifetimeTarget =
    !isPlannerTask &&
    state.frequency_type === "recurring" &&
    state.recurrence_interval === "daily" &&
    state.target_basis === "lifetime";
  const canShowMilestoneTarget =
    !isPlannerTask && state.frequency_type === "fixed_milestones";
  const definitionFieldsLocked = isEditing;
  const parsedTargetCount = parsePositiveTargetCount(state.target_count);
  const definitionTargetCount =
    state.frequency_type === "fixed_milestones" || isLifetimeRecurringTarget
      ? parsedTargetCount
      : isPeriodRecurringTarget
        ? parsedTargetCount ?? 1
        : null;
  const fixedMilestoneCount =
    state.frequency_type === "fixed_milestones"
      ? parsedTargetCount ?? 0
      : 0;
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
  const hasLinkedTarget = selectedLinkTarget !== "none";

  const updateCreateKind = (nextKind: GoalCreateKind) => {
    setCreateKind(nextKind);
    if (nextKind !== "planner_task") {
      updateFrequencyType(nextKind);
    }
  };

  const updateFrequencyType = (nextFrequency: GoalFrequencyType) => {
    setMilestoneNamesOpen(false);
    setState((previous) => ({
      ...previous,
      frequency_type: nextFrequency,
      target_count:
        nextFrequency === "fixed_milestones" && previous.target_count.trim().length === 0
          ? "3"
          : previous.target_count,
      milestone_names:
        nextFrequency === "fixed_milestones"
          ? buildMilestoneNameDrafts(
              parsePositiveTargetCount(
                nextFrequency === "fixed_milestones" && previous.target_count.trim().length === 0
                  ? "3"
                  : previous.target_count
              ) ?? 0,
              previous.milestone_names
            )
          : previous.milestone_names,
    }));
  };

  const updateTargetCount = (nextTargetCount: string) => {
    setState((previous) => ({
      ...previous,
      target_count:
        previous.frequency_type === "recurring" &&
        previous.target_basis === "period" &&
        nextTargetCount.trim().length === 0
          ? "1"
          : nextTargetCount,
      milestone_names:
        previous.frequency_type === "fixed_milestones"
          ? buildMilestoneNameDrafts(
              parsePositiveTargetCount(nextTargetCount) ?? 0,
              previous.milestone_names
            )
          : previous.milestone_names,
    }));
  };

  const applyThisMonthEndDate = () => {
    setState((previous) => ({
      ...previous,
      end_date: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    }));
  };

  const applyThisMonthStartDate = () => {
    setState((previous) => ({
      ...previous,
      start_date: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    }));
  };

  const applyThisYearStartDate = () => {
    setState((previous) => ({
      ...previous,
      start_date: format(startOfYear(new Date()), "yyyy-MM-dd"),
    }));
  };

  const applyThisYearEndDate = () => {
    setState((previous) => ({
      ...previous,
      end_date: format(endOfYear(new Date()), "yyyy-MM-dd"),
    }));
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

    if (
      state.frequency_type === "fixed_milestones" &&
      parsedTargetCount === null
    ) {
      return {
        validationError: "Milestone goals require a positive target count.",
        validationWarning: null,
      };
    }

    if (
      state.frequency_type === "recurring" &&
      state.target_basis === "period" &&
      state.recurrence_interval !== "daily" &&
      parsedTargetCount === null
    ) {
      return {
        validationError: "Recurring period goals require a target of at least 1.",
        validationWarning: null,
      };
    }

    if (
      state.frequency_type === "recurring" &&
      state.target_basis === "lifetime" &&
      state.target_count.trim().length > 0 &&
      parsedTargetCount === null
    ) {
      return {
        validationError:
          "Total target completions must be at least 1 when provided.",
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
    const blockingIssue = definitionIssues.find(
      (issue) => issue.code !== "target_exceeds_capacity"
    );
    if (blockingIssue) {
      return { validationError: blockingIssue.message, validationWarning: null };
    }
    const warningIssue = definitionIssues.find(
      (issue) => issue.code === "target_exceeds_capacity"
    );
    return {
      validationError: null,
      validationWarning: warningIssue?.message ?? null,
    };
  }, [state, parsedTargetCount, definitionTargetCount, goalCapacityInput, isPlannerTask]);
  const submitDisabled = saving || validationError !== null;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (validationError) {
      return;
    }

    setSaving(true);

    if (isPlannerTask) {
      const { error } = await supabase.rpc("create_planner_task", {
        p_title: state.title.trim(),
        p_scheduled_date: state.task_scheduled_date.trim() || undefined,
      });
      if (error) {
        toast.error(error.message ?? "Failed to save task.");
        setSaving(false);
        return;
      }
      invalidatePlannerRelatedTabCaches();
      toast.success("Task created.");
      completeAndExit();
      setSaving(false);
      return;
    }
    const parsedTargetCountForSave = parsePositiveTargetCount(state.target_count);
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

    const goalArgs = {
      p_id: goalId ?? crypto.randomUUID(),
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

    const savedGoalId = goalArgs.p_id;

    if (goalId) {
      const { error } = await supabase.rpc("update_goal", goalArgs);

      if (error) {
        toast.error(error.message ?? "Failed to save goal.");
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.rpc("create_goal", goalArgs);

      if (error) {
        toast.error(error.message ?? "Failed to save goal.");
        setSaving(false);
        return;
      }
    }

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

    {
      const { error: linkError } = await supabase.rpc("replace_goal_source_link", {
        p_source_goal_id: savedGoalId,
        p_target_goal_id:
          selectedLinkTarget !== "none" ? selectedLinkTarget : undefined,
      });
      if (linkError) {
        toast.error(linkError.message);
      }
    }

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
        <form id={goalFormId} className="space-y-4" onSubmit={onSubmit}>
          {validationWarning ? (
            <div className="rounded-md border border-yellow-300 bg-yellow-100 px-3 py-2 text-xs text-orange-900 dark:border-yellow-300 dark:bg-yellow-100 dark:text-orange-900">
              {validationWarning}
            </div>
          ) : null}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="space-y-2">
              <Label htmlFor="goal-title">Name</Label>
              <Input
                id="goal-title"
                value={state.title}
                onChange={(event) => setState((prev) => ({ ...prev, title: event.target.value }))}
                placeholder={isPlannerTask ? "Write your top priority for today" : "Run 20 times by Dec 31"}
                className="h-8 text-sm"
                required
              />
            </div>
            {isPlannerTask ? null : (
            <div className="space-y-2 sm:justify-self-end">
              <Label>Category</Label>
              <CategorySelect
                value={state.category_selection}
                triggerClassName="h-8"
                onValueChange={(value: CategorySelection) =>
                  setState((prev) => ({
                    ...prev,
                    category_selection: value,
                    color: getCategorySwatchColor(value),
                  }))
                }
              />
            </div>
            )}
          </div>

          {!isPlannerTask && state.category_selection === "custom" ? (
            <div className="space-y-2">
              <Label htmlFor="custom-category">Custom category label</Label>
              <Input
                id="custom-category"
                value={state.custom_category}
                onChange={(event) =>
                  setState((prev) => ({ ...prev, custom_category: event.target.value }))
                }
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
            <div
              className={cn(
                "min-w-0 space-y-2",
                definitionFieldsLocked && "pointer-events-none opacity-60"
              )}
            >
              <Label className="inline-flex items-center gap-1">
                <span>Goal type</span>
              </Label>
              <GoalTypeToggle
                value={isEditing ? state.frequency_type : createKind}
                includePlannerTask={!isEditing}
                onValueChange={updateCreateKind}
                triggerClassName="h-8"
              />
              <p className="text-xs text-muted-foreground">
                {GOAL_CREATE_KIND_HELP[isEditing ? state.frequency_type : createKind]}
              </p>
            </div>

            {canShowMilestoneTarget ? (
              <div className="space-y-2">
                <Label htmlFor="target-count" className="inline-flex items-center gap-1">
                  <span>Total milestones</span>
                </Label>
                <TargetCountField
                  id="target-count"
                  frequencyType={state.frequency_type}
                  value={state.target_count}
                  onValueChange={updateTargetCount}
                  disabled={definitionFieldsLocked}
                  showRecurringHelperText={false}
                />
                <p className="text-xs text-muted-foreground">
                  You can optionally name individual milestones under advanced settings.
                </p>
              </div>
            ) : null}

            {canShowRecurrenceFields ? (
              <div
                className={cn(
                  "min-w-0 space-y-2",
                  definitionFieldsLocked && "pointer-events-none opacity-60"
                )}
              >
                <Label className="inline-flex items-center gap-1">
                  <span>Frequency</span>
                  <TooltipIcon
                    content="How often you want to work on this goal. Weekly and monthly goals can set a target number of completions per period."
                    label="Frequency help"
                  />
                </Label>
                <RecurrenceIntervalToggle
                  value={state.recurrence_interval}
                  triggerClassName="h-8"
                  onValueChange={(value) =>
                    setState((prev) => ({
                      ...prev,
                      recurrence_interval: value,
                      target_count:
                        prev.target_basis === "period" &&
                        value !== "daily" &&
                        prev.target_count.trim().length === 0
                          ? "1"
                          : prev.target_count,
                    }))
                  }
                />
              </div>
            ) : null}

            {canShowRecurringTargetInMain ? (
              <div className="space-y-2">
                <Label htmlFor="recurring-target-count" className="inline-flex items-center gap-1">
                  <span>
                    {recurringTargetLabel(
                      state.recurrence_interval,
                      state.target_basis
                    )}
                  </span>
                  <TooltipIcon
                    content={
                      state.target_basis === "lifetime"
                        ? lifetimeTargetTooltip
                        : "How many distinct days you want to complete this goal in each week or month."
                    }
                    label="Recurring target help"
                  />
                </Label>
                <TargetCountField
                  id="recurring-target-count"
                  frequencyType={state.frequency_type}
                  value={state.target_count}
                  onValueChange={updateTargetCount}
                  minValue={1}
                  required={state.target_basis === "period"}
                  disabled={definitionFieldsLocked}
                  showRecurringHelperText={false}
                />
              </div>
            ) : null}

            {canShowDailyLifetimeTarget ? (
              <div className="space-y-2">
                <Label htmlFor="daily-lifetime-target-count" className="inline-flex items-center gap-1">
                  <span>{lifetimeTargetOptionalLabel}</span>
                  <TooltipIcon content={lifetimeTargetTooltip} label="Lifetime target help" />
                </Label>
                <TargetCountField
                  id="daily-lifetime-target-count"
                  frequencyType={state.frequency_type}
                  value={state.target_count}
                  onValueChange={updateTargetCount}
                  minValue={1}
                  disabled={definitionFieldsLocked}
                  showRecurringHelperText={false}
                />
              </div>
            ) : null}

            {isPlannerTask ? (
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
            ) : null}
          </div>

          {isPlannerTask ? null : (
          <div
            className={cn(
              definitionFieldsLocked && "pointer-events-none opacity-60"
            )}
          >
          <GoalDateRangeFields
            startDate={state.start_date}
            endDate={state.end_date}
            onStartDateChange={(value) =>
              setState((previous) => ({ ...previous, start_date: value }))
            }
            onEndDateChange={(value) =>
              setState((previous) => ({ ...previous, end_date: value }))
            }
            requiresEndDate={false}
            startDateId="start-date"
            endDateId="end-date"
            startDateActions={
              <>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={applyThisMonthStartDate}
                >
                  month start
                </button>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={applyThisYearStartDate}
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
                >
                  month end
                </button>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={applyThisYearEndDate}
                >
                  year end
                </button>
              </>
            }
          />
          </div>
          )}

          {definitionFieldsLocked ? (
            <p className="text-xs text-muted-foreground">
              Goal type, frequency, target, and start date are fixed after creation.
              Archive this goal and create a new one to change them.
            </p>
          ) : null}

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
                    {state.frequency_type === "recurring" && !definitionFieldsLocked ? (
                      <label className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={state.target_basis === "lifetime"}
                          onChange={(event) =>
                            setState((previous) => ({
                              ...previous,
                              target_basis: event.target.checked ? "lifetime" : "period",
                              target_count: event.target.checked
                                ? previous.target_count.trim().length > 0
                                  ? previous.target_count
                                  : "3"
                                : previous.target_count.trim().length > 0
                                  ? previous.target_count
                                  : "1",
                            }))
                          }
                        />
                        <span>Use a total completion target instead of per-period.</span>
                      </label>
                    ) : null}

                    {state.team_id === null ? (
                      <label className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={state.is_private}
                          onChange={(event) =>
                            setState((prev) => ({ ...prev, is_private: event.target.checked }))
                          }
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
                              values={state.milestone_names}
                              onValueChange={(index, value) =>
                                setState((previous) => {
                                  const nextMilestoneNames = [...previous.milestone_names];
                                  nextMilestoneNames[index] = value;
                                  return {
                                    ...previous,
                                    milestone_names: nextMilestoneNames,
                                  };
                                })
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
                        state.team_id === null
                          ? "grid-cols-1 sm:grid-cols-3"
                          : "grid-cols-1 sm:grid-cols-2"
                      )}
                    >
                      {state.team_id === null ? (
                        <Label className="inline-flex min-h-8 items-center gap-2 self-start">
                          <Link2 className="size-4 shrink-0 text-muted-foreground" />
                          <span>Make this a subgoal linked to...</span>
                        </Label>
                      ) : null}

                      <div className="flex min-h-8 items-center justify-between gap-2 self-start">
                        <Label htmlFor="default-local-time">Default time of day</Label>
                        {state.default_local_time.trim().length > 0 ? (
                          <button
                            type="button"
                            className="text-xs text-primary hover:underline"
                            onClick={() =>
                              setState((previous) => ({ ...previous, default_local_time: "" }))
                            }
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

                      {state.team_id === null ? (
                        <GoalLinkTargetSelect
                          value={selectedLinkTarget}
                          onValueChange={setSelectedLinkTarget}
                          open={linkTargetOpen}
                          onOpenChange={(open) => {
                            setLinkTargetOpen(open);
                            if (!open) {
                              setLinkTargetSearch("");
                            }
                          }}
                          searchQuery={linkTargetSearch}
                          onSearchQueryChange={setLinkTargetSearch}
                          filteredLinkTargets={filteredLinkTargets}
                          selectedTargetGoal={selectedLinkTargetGoal}
                          sourceEndDate={state.end_date.trim() || null}
                          showLabel={false}
                          showHelperText={false}
                          showLinkedNotice={false}
                        />
                      ) : null}

                      <GoalDefaultTimeField
                        id="default-local-time"
                        showLabel={false}
                        showHelperText={false}
                        value={state.default_local_time}
                        onValueChange={(value) =>
                          setState((previous) => ({
                            ...previous,
                            default_local_time: value,
                          }))
                        }
                      />

                      <Select
                        value={state.difficulty}
                        onValueChange={(value: GoalDifficulty) =>
                          setState((previous) => ({ ...previous, difficulty: value }))
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

                    {state.team_id === null ? (
                      <>
                        <p className="text-xs text-muted-foreground">
                          Completing this subgoal also counts toward its linked main goal for that
                          day.
                        </p>
                        {selectedLinkTarget !== "none" && selectedLinkTargetGoal ? (
                          <div
                            className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-400/50 dark:bg-amber-500/10 dark:text-amber-100"
                          >
                            <p className="font-medium">
                              Linking this subgoal to {selectedLinkTargetGoal.title} may hide that
                              main goal in some calendar months.
                            </p>
                            <p className="mt-1">
                              {getLinkedTargetSchedulingNotice({
                                sourceEndDate: state.end_date.trim() || null,
                              })}
                            </p>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>

                  <div className="hidden space-y-2">
                    <Label htmlFor="goal-color">Color accent</Label>
                    <Input
                      id="goal-color"
                      type="color"
                      value={state.color}
                      onChange={(event) =>
                        setState((prev) => ({ ...prev, color: event.target.value }))
                      }
                      className="h-10 p-1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Auto-set from category selection. You can still override it here.
                    </p>
                  </div>

                  <div className="hidden space-y-2">
                    <Label htmlFor="goal-description">Description</Label>
                    <Textarea
                      id="goal-description"
                      value={state.description}
                      onChange={(event) =>
                        setState((prev) => ({ ...prev, description: event.target.value }))
                      }
                      placeholder="Why this goal matters"
                    />
                  </div>

                  <div className="hidden space-y-2">
                    <Label htmlFor="goal-reward-text">Achievement reward text</Label>
                    <Textarea
                      id="goal-reward-text"
                      value={state.reward_text}
                      onChange={(event) =>
                        setState((prev) => ({ ...prev, reward_text: event.target.value }))
                      }
                      placeholder="How you will celebrate when this goal is achieved"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      Shown only on your achieved goal cards. Not shared to social feeds.
                    </p>
                  </div>

                  <div className="hidden space-y-2">
                    <Label htmlFor="goal-photo">Photo</Label>
                    <Input
                      id="goal-photo"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
                    />
                    {photoPreview ? (
                      <Image
                        src={photoPreview}
                        alt="Goal preview"
                        width={112}
                        height={112}
                        unoptimized
                        className="h-28 w-28 rounded-xl object-cover"
                      />
                    ) : null}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
