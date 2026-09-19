"use client";

import { TempoAiDraftPreview } from "@/features/goals/tempo-ai-draft-preview";

import { useSearchParams } from "next/navigation";
import { useAppRouter } from "@/lib/navigation/use-app-router";
import {
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  type BulkGoalDraft,
  buildBulkGoalDraftFromRow,
  buildBulkGoalDraftsFromLlmGoals,
} from "@/features/goals/bulk-goal-drafts";
import { parseLlmGoalDraftsFromPrompt } from "@/features/goals/bulk-goal-parse";
import { TempoStepNavigation } from "@/features/goals/tempo-step-navigation";
import { TempoGoalStack } from "@/features/goals/tempo-goal-stack";
import {
  type BulkGoalLinkRecovery,
  BulkGoalPersistenceError,
  persistBulkGoalDrafts,
  retryBulkGoalCreation,
  retryBulkGoalLinks,
} from "@/features/goals/bulk-goal-persistence";
import type { PreparedBulkGoalRow } from "@/features/goals/bulk-goal-drafts";
import {
  buildStarterPackRows,
  resolveStarterPackKey,
} from "@/features/goals/starter-packs";
import { BulkGoalInputCard } from "@/features/today/bulk-goal-input-card";
import { type BulkInputMode } from "@/features/today/bulk-goal-types";
import { getApiErrorMessage } from "@/lib/api/client";
import { buildLoginHref } from "@/lib/auth/login-redirect";
import { invalidatePlannerRelatedTabCaches } from "@/lib/cache/planner-tab-cache";
import { toLocalDateString } from "@/lib/dates/day";
import { resolveUserTimezone } from "@/lib/dates/timezone";
import {
  fetchProgressContext,
  progressSummaryMap,
} from "@/lib/goals/progress-context";
import type { Goal } from "@/lib/goals/types";
import { createClient } from "@/lib/supabase/client";

interface BulkGoalFormProps {
  showBackButton?: boolean;
  modeSwitchControl?: ReactNode;
  onExit?: () => void;
}

const csvExample = `title,description,category,color,frequency_type,recurrence_interval,target_basis,target_count,milestone_names,start_date,end_date,default_local_time
Morning run,Train for a half marathon,Health,#16a34a,recurring,weekly,period,3,,2026-06-01,2026-12-31,06:45
Read 12 books,One book per month,Personal,#6366f1,fixed,,lifetime,12,Book 1|Book 2|Book 3,2026-06-01,2026-12-31,`;

async function parseRowsFromCsvText(
  csvText: string,
): Promise<Record<string, unknown>[]> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(csvText, { type: "string" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return [];
  }

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[sheetName],
    {
      defval: "",
      raw: false,
    },
  );
}

async function parseRowsFromSpreadsheetFile(
  file: File,
): Promise<Record<string, unknown>[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return [];
  }

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[sheetName],
    {
      defval: "",
      raw: false,
    },
  );
}

export function BulkGoalForm({
  showBackButton = true,
  modeSwitchControl,
  onExit,
}: BulkGoalFormProps) {
  const supabase = useMemo(() => createClient(), []);
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const completeAndExit = useCallback(() => {
    if (onExit) {
      onExit();
      return;
    }
    router.replace("/");
    router.refresh();
  }, [onExit, router]);
  const [inputMode, setInputMode] = useState<BulkInputMode>("natural_language");
  const [initializing, setInitializing] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("");
  const [csvInput, setCsvInput] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<BulkGoalDraft[]>([]);
  const [linkRecovery, setLinkRecovery] = useState<BulkGoalLinkRecovery | null>(
    null,
  );
  const [createRecovery, setCreateRecovery] = useState<{
    preparedRows: PreparedBulkGoalRow[];
  } | null>(null);
  const [availableGoals, setAvailableGoals] = useState<Goal[]>([]);
  const appliedStarterPackRef = useRef<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const nextPath = `${window.location.pathname}${window.location.search}`;
        router.replace(buildLoginHref(nextPath));
        return;
      }

      setCurrentUserId(user.id);
      const [goalOptionsResponse, progress] = await Promise.all([
        supabase
          .from("goals")
          .select("*")
          .eq("owner_id", user.id)
          .eq("is_deleted", false)
          .order("title"),
        fetchProgressContext({ asOfDate: toLocalDateString() }),
      ]);

      if (goalOptionsResponse.error) {
        toast.error("Could not load linkable goals.");
      } else {
        const goals = (goalOptionsResponse.data ?? []) as Goal[];
        const progressByGoal = progressSummaryMap(progress);
        // Achievement stops planner placement, but active goals remain
        // linkable so users can intentionally continue beyond a target.
        setAvailableGoals(
          goals.filter(
            (goal) =>
              goal.team_id === null &&
              progressByGoal.get(goal.id)?.lifecycle === "active",
          ),
        );
      }

      setInitializing(false);
    };

    void run().catch((error: unknown) => {
      setInitializing(false);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not load linkable goals.",
      );
    });
  }, [router, supabase]);

  const selectedDrafts = useMemo(
    () => drafts.filter((draft) => draft.include),
    [drafts],
  );
  const selectedInvalidCount = useMemo(
    () => selectedDrafts.filter((draft) => draft.errors.length > 0).length,
    [selectedDrafts],
  );

  const loadDraftsFromRows = useCallback((rows: Record<string, unknown>[]) => {
    if (rows.length === 0) {
      toast.error("No rows found. Include a header row and at least one goal.");
      return;
    }

    const nextDrafts = rows.map((row, index) =>
      buildBulkGoalDraftFromRow(row, index),
    );
    setDrafts(nextDrafts);
    toast.success(
      `Loaded ${nextDrafts.length} goal draft${nextDrafts.length === 1 ? "" : "s"}.`,
    );
  }, []);

  useEffect(() => {
    const starterPack = resolveStarterPackKey(searchParams.get("starterPack"));
    if (!starterPack) {
      appliedStarterPackRef.current = null;
      return;
    }
    if (appliedStarterPackRef.current === starterPack) {
      return;
    }

    const rows = buildStarterPackRows(starterPack, toLocalDateString());
    loadDraftsFromRows(rows);
    appliedStarterPackRef.current = starterPack;
  }, [loadDraftsFromRows, searchParams]);

  const parseCsvInput = async () => {
    const trimmed = csvInput.trim();
    if (!trimmed) {
      toast.error("Paste CSV content first.");
      return;
    }

    setParsing(true);
    try {
      const rows = await parseRowsFromCsvText(trimmed);
      loadDraftsFromRows(rows);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not parse CSV text.",
      );
    } finally {
      setParsing(false);
    }
  };

  const parseNaturalLanguageInput = async () => {
    const trimmed = naturalLanguageInput.trim();
    if (!trimmed) {
      toast.error("Describe at least one goal first.");
      return;
    }

    setParsing(true);
    try {
      const { goals, warnings } = await parseLlmGoalDraftsFromPrompt({
        prompt: trimmed,
        timezone: resolveUserTimezone(),
      });

      if (goals.length === 0) {
        toast.error("No goals found in that prompt. Try adding more detail.");
        return;
      }

      const nextDrafts = buildBulkGoalDraftsFromLlmGoals(goals);
      setDrafts(nextDrafts);
      toast.success(
        `Loaded ${nextDrafts.length} goal draft${nextDrafts.length === 1 ? "" : "s"}.`,
      );
      if (warnings.length > 0) {
        toast.warning(
          warnings.length === 1
            ? warnings[0]
            : `${warnings.length} generated drafts need edits before saving.`,
        );
      }
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Could not parse natural language input."),
      );
    } finally {
      setParsing(false);
    }
  };

  const parseUploadedFile = async () => {
    if (!uploadedFile) {
      toast.error("Choose a CSV/XLSX file first.");
      return;
    }

    setParsing(true);
    try {
      const rows = await parseRowsFromSpreadsheetFile(uploadedFile);
      loadDraftsFromRows(rows);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not parse uploaded file.",
      );
    } finally {
      setParsing(false);
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUploadedFile(event.target.files?.[0] ?? null);
  };

  const finishCreatedGoals = (createdCount: number) => {
    toast.success(
      `Created ${createdCount} goal${createdCount === 1 ? "" : "s"}.`,
    );
    completeAndExit();
  };

  const createSelectedGoals = async () => {
    if (!currentUserId) {
      toast.error("You must be logged in.");
      return;
    }

    if (selectedDrafts.length === 0) {
      toast.error("Select at least one draft to create.");
      return;
    }

    if (selectedInvalidCount > 0) {
      toast.error("Fix validation issues in selected drafts before creating.");
      return;
    }

    setSaving(true);
    try {
      if (linkRecovery) {
        await retryBulkGoalLinks({
          linkRows: linkRecovery.linkRows,
          supabase,
          onLinksPersisted: invalidatePlannerRelatedTabCaches,
        });
        setLinkRecovery(null);
        await finishCreatedGoals(linkRecovery.preparedRows.length);
        return;
      }

      const result = createRecovery
        ? await retryBulkGoalCreation({
            preparedRows: createRecovery.preparedRows,
            supabase,
            onGoalsPersisted: invalidatePlannerRelatedTabCaches,
            onLinksPersisted: invalidatePlannerRelatedTabCaches,
          })
        : await persistBulkGoalDrafts({
            drafts: selectedDrafts,
            currentUserId,
            supabase,
            onGoalsPersisted: invalidatePlannerRelatedTabCaches,
            onLinksPersisted: invalidatePlannerRelatedTabCaches,
          });

      if (result.status === "partial_success") {
        setCreateRecovery(null);
        setLinkRecovery(result.linkRecovery);
        toast.error(result.linkErrorMessage);
        return;
      }

      setCreateRecovery(null);
      await finishCreatedGoals(result.createdCount);
    } catch (error) {
      if (error instanceof BulkGoalPersistenceError) {
        if (error.code === "create_ambiguous" && error.preparedRows) {
          setCreateRecovery({ preparedRows: error.preparedRows });
        } else if (error.code === "links_failed" && error.linkRecovery) {
          setCreateRecovery(null);
          setLinkRecovery(error.linkRecovery);
        } else if (error.code === "create_failed") {
          setCreateRecovery(null);
          setLinkRecovery(null);
        }
        toast.error(error.message);
      } else {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to create bulk goals.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const inputCard = (
    <BulkGoalInputCard
      inputMode={inputMode}
      onInputModeChange={setInputMode}
      modeSwitchControl={modeSwitchControl}
      showBackButton={showBackButton}
      onExit={onExit}
      naturalLanguageInput={naturalLanguageInput}
      onNaturalLanguageInputChange={setNaturalLanguageInput}
      csvInput={csvInput}
      onCsvInputChange={setCsvInput}
      csvExample={csvExample}
      onUseCsvExample={() => setCsvInput(csvExample)}
      parsing={parsing}
      onParseNaturalLanguage={parseNaturalLanguageInput}
      onParseCsv={parseCsvInput}
      onFileChange={onFileChange}
      onParseUploadedFile={parseUploadedFile}
      uploadedFileName={uploadedFile?.name ?? null}
      disabled={Boolean(
        initializing || parsing || saving || linkRecovery || createRecovery,
      )}
    />
  );
  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {drafts.length === 0 ? (
        <div className="tempo-creation tempo-ai-entry w-full">
          <TempoStepNavigation step={1} disabled={parsing} />
          <div className="tempo-creation-body">
            <div className="tempo-workspace">{inputCard}</div>
            <div className="tempo-preview">
              <TempoAiDraftPreview
                parsing={parsing}
                importing={inputMode === "csv"}
              />
            </div>
          </div>
        </div>
      ) : (
        <details className="tempo-ai-revise order-last">
          <summary className="cursor-pointer text-sm font-medium">
            Revisit your starting point
          </summary>
          {inputCard}
        </details>
      )}

      {createRecovery ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <p>
            Goal creation could not be confirmed. Your drafts are retained while
            you retry safely.
          </p>
          <button
            type="button"
            className="mt-2 rounded-md border border-amber-500 px-3 py-1.5 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50"
            onClick={() => void createSelectedGoals()}
            disabled={saving}
          >
            Retry creating goals
          </button>
        </div>
      ) : null}

      {linkRecovery ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <p>
            The goals were created, but the selected links were not saved. Your
            draft selections are retained while you retry.
          </p>
          <button
            type="button"
            className="mt-2 rounded-md border border-amber-500 px-3 py-1.5 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50"
            onClick={() => void createSelectedGoals()}
            disabled={saving}
          >
            Retry saving links
          </button>
        </div>
      ) : null}

      {drafts.length > 0 && (
        <div className="min-h-0 flex-1">
          <TempoGoalStack
            drafts={drafts}
            setDrafts={setDrafts}
            saving={saving}
            onCreate={createSelectedGoals}
            availableGoals={availableGoals}
            editingDisabled={Boolean(
              initializing || parsing || saving || linkRecovery || createRecovery,
            )}
            createLabel={createRecovery ? "Retry creating goals" : undefined}
            createDisabledMessage={
              linkRecovery
                ? "Goals were created, but their links still need to be saved."
                : createRecovery
                  ? "Goal creation was not confirmed; retry to reconcile the retained draft."
                  : null
            }
            emptyMessage={
              inputMode === "natural_language"
                ? "Parse natural language input to generate drafts."
                : "Parse CSV input or upload a file to generate drafts."
            }
          />
        </div>
      )}
    </div>
  );
}
