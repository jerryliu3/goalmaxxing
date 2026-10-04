import { format, isValid, parseISO } from "date-fns";
import { toLocalDateString } from "@/lib/dates/day";
import {
  applyGoalCreationFieldChange,
  type GoalCreationFieldChange,
  createDefaultGoalCreationFields,
  parseGoalCreationTargetCount,
  resolveGoalCreationTargetCountForSave,
  type GoalCreationFields,
  validateGoalCreationFields,
} from "@/lib/goals/creation-model";
import {
  type CategorySelection,
  getCategoryKeyForSelection,
  getCategoryLabel,
  getCategorySelectionFromValue,
  getCategorySwatchColor,
} from "@/lib/goals/category";
import {
  isOrdinalGoalDefinition,
} from "@/lib/goals/definition-validation";
import {
  buildMilestoneNameDrafts,
  normalizeMilestoneNamesForSave,
} from "@/lib/goals/milestones";
import type {
  GoalFrequencyType,
  GoalTargetBasis,
  RecurrenceInterval,
} from "@/lib/goals/types";
import { resolveGoalTargetBasisFromInput } from "@/lib/goals/target-basis";

const columnAliases = {
  title: ["title", "goal", "goal_title", "name"],
  description: ["description", "details", "notes"],
  category: ["category", "tag"],
  color: ["color", "accent_color", "hex_color"],
  frequency_type: ["frequency_type", "frequency", "type"],
  recurrence_interval: ["recurrence_interval", "recurrence", "interval"],
  target_count: ["target_count", "target", "count", "milestones"],
  target_basis: ["target_basis"],
  milestone_names: ["milestone_names", "milestones_list", "steps", "step_names"],
  start_date: ["start_date", "start", "startdate"],
  end_date: ["end_date", "end", "enddate", "due_date", "due"],
  default_local_time: ["default_local_time", "default_time", "time_of_day", "local_time"],
} as const;

export interface BulkGoalDraft extends GoalCreationFields {
  id: string;
  sourceRowLabel: string;
  include: boolean;
  link_target_search: string;
  link_target_open: boolean;
  advanced_open: boolean;
  target_basis_error?: string;
  errors: string[];
}

export interface LlmGoalDraftPayload {
  title?: string;
  description?: string | null;
  category?: string | null;
  category_key?: string | null;
  frequency_type?: GoalFrequencyType;
  recurrence_interval?: RecurrenceInterval | null;
  target_basis?: GoalTargetBasis | null;
  target_count?: number | null;
  milestone_names?: string[] | null;
  start_date?: string | null;
  end_date?: string | null;
  default_local_time?: string | null;
}

export interface PreparedBulkGoalRow {
  draft: BulkGoalDraft;
  goalId: string;
  row: {
    id: string;
    title: string;
    description: string | null;
    category_key: string;
    category: string;
    color: string;
    frequency_type: GoalFrequencyType;
    recurrence_interval: RecurrenceInterval | null;
    target_count: number | null;
    target_basis: GoalTargetBasis | null;
    milestone_names: string[] | null;
    start_date: string;
    end_date: string | null;
    default_local_time: string | null;
    difficulty: GoalCreationFields["difficulty"];
    is_private: boolean;
  };
}

function normalizeHeaderKey(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function normalizeRowKeys(row: Record<string, unknown>): Record<string, unknown> {
  return Object.entries(row).reduce<Record<string, unknown>>((accumulator, [key, value]) => {
    accumulator[normalizeHeaderKey(key)] = value;
    return accumulator;
  }, {});
}

function extractText(row: Record<string, unknown>, aliases: readonly string[]): string {
  for (const alias of aliases) {
    const value = row[normalizeHeaderKey(alias)];
    if (value !== undefined && value !== null && String(value).trim().length > 0) {
      return String(value).trim();
    }
  }
  return "";
}

function parseFrequencyType(raw: string): GoalFrequencyType {
  const normalized = raw.trim().toLowerCase();
  return normalized.includes("milestone") || normalized.includes("fixed")
    ? "fixed_milestones"
    : "recurring";
}

function parseRecurrenceInterval(raw: string): RecurrenceInterval {
  const normalized = raw.trim().toLowerCase();
  if (normalized.startsWith("week")) return "weekly";
  if (normalized.startsWith("month")) return "monthly";
  return "daily";
}

function normalizeDateValue(raw: unknown): string {
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? "Invalid date" : format(raw, "yyyy-MM-dd");
  }
  const text = String(raw ?? "").trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : format(parsed, "yyyy-MM-dd");
}

export function parseBulkGoalTargetCount(raw: string): number | null {
  return parseGoalCreationTargetCount(raw);
}

export function resolveBulkGoalTargetBasis(draft: BulkGoalDraft): GoalTargetBasis {
  if (draft.frequency_type !== "recurring") {
    return "lifetime";
  }
  return draft.target_basis;
}

export function isValidBulkGoalHexColor(raw: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(raw.trim());
}

export function isValidBulkGoalLocalTime(raw: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(raw.trim());
}

export function normalizeBulkGoalLocalTime(raw: string): string {
  const trimmed = raw.trim();
  return trimmed && isValidBulkGoalLocalTime(trimmed) ? trimmed : "";
}

function parseMilestoneNames(raw: string): string[] {
  return raw
    .trim()
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function validateBulkGoalDraft(draft: BulkGoalDraft): string[] {
  return [
    ...(draft.target_basis_error ? [draft.target_basis_error] : []),
    ...validateGoalCreationFields(draft),
  ];
}

export function withValidatedBulkGoalDraft(
  draft: Omit<BulkGoalDraft, "errors">
): BulkGoalDraft {
  const candidate = { ...draft, errors: [] };
  return { ...candidate, errors: validateBulkGoalDraft(candidate) };
}

export function buildBulkGoalDraftFromRow(
  row: Record<string, unknown>,
  rowIndex: number
): BulkGoalDraft {
  const normalizedRow = normalizeRowKeys(row);
  const categoryRaw = extractText(normalizedRow, columnAliases.category);
  const categoryState = categoryRaw
    ? getCategorySelectionFromValue(categoryRaw)
    : { selection: "personal" as CategorySelection, customValue: "" };
  const frequencyType = parseFrequencyType(
    extractText(normalizedRow, columnAliases.frequency_type)
  );
  const targetRaw = extractText(normalizedRow, columnAliases.target_count);
  const parsedTarget = targetRaw
    ? parseBulkGoalTargetCount(targetRaw)
    : frequencyType === "fixed_milestones"
      ? 3
      : null;
  const parsedMilestoneNames = parseMilestoneNames(
    extractText(normalizedRow, columnAliases.milestone_names)
  );
  const parsedColor = extractText(normalizedRow, columnAliases.color);
  const targetBasisRaw = String(normalizedRow.target_basis ?? "").trim().toLowerCase();
  const targetBasisResolution = resolveGoalTargetBasisFromInput({
    frequencyType,
    recurrenceInterval: parseRecurrenceInterval(
      extractText(normalizedRow, columnAliases.recurrence_interval)
    ),
    targetCount: parsedTarget,
    targetBasis: targetBasisRaw,
  });
  const targetBasis: GoalTargetBasis = targetBasisResolution.basis;

  return withValidatedBulkGoalDraft({
    ...createDefaultGoalCreationFields(),
    id: crypto.randomUUID(),
    sourceRowLabel: `Row ${rowIndex + 1}`,
    include: true,
    title: extractText(normalizedRow, columnAliases.title),
    description: extractText(normalizedRow, columnAliases.description),
    category_selection: categoryState.selection,
    custom_category: categoryState.customValue,
    color: isValidBulkGoalHexColor(parsedColor)
      ? parsedColor
      : getCategorySwatchColor(categoryState.selection),
    frequency_type: frequencyType,
    recurrence_interval: parseRecurrenceInterval(
      extractText(normalizedRow, columnAliases.recurrence_interval)
    ),
    target_count: targetRaw || (frequencyType === "fixed_milestones" ? "3" : ""),
    target_basis: frequencyType === "recurring" ? targetBasis : "lifetime",
    target_basis_error:
      targetBasisResolution.error ?? undefined,
    milestone_names:
      frequencyType === "fixed_milestones"
        ? buildMilestoneNameDrafts(parsedTarget ?? 0, parsedMilestoneNames)
        : [],
    start_date:
      normalizeDateValue(normalizedRow[normalizeHeaderKey(columnAliases.start_date[0])]) ||
      normalizeDateValue(extractText(normalizedRow, columnAliases.start_date)) ||
      toLocalDateString(),
    end_date:
      normalizeDateValue(normalizedRow[normalizeHeaderKey(columnAliases.end_date[0])]) ||
      normalizeDateValue(extractText(normalizedRow, columnAliases.end_date)),
    default_local_time: normalizeBulkGoalLocalTime(
      extractText(normalizedRow, columnAliases.default_local_time)
    ),
    linked_target_goal_id: "none",
    link_target_search: "",
    link_target_open: false,
    advanced_open: false,
  });
}

export function buildBulkGoalDraftsFromLlmGoals(
  goals: LlmGoalDraftPayload[]
): BulkGoalDraft[] {
  return goals.map((goal, index) => {
    const draft = buildBulkGoalDraftFromRow(
      {
        title: goal.title ?? "",
        description: goal.description ?? "",
        category: goal.category ?? goal.category_key ?? "",
        frequency_type: goal.frequency_type ?? "recurring",
        recurrence_interval: goal.recurrence_interval ?? "",
        target_count:
          goal.target_count === null || goal.target_count === undefined
            ? ""
            : String(goal.target_count),
        target_basis: goal.target_basis ?? "",
        start_date: goal.start_date ?? "",
        end_date: goal.end_date ?? "",
        default_local_time: goal.default_local_time ?? "",
      },
      index
    );
    if (
      draft.frequency_type !== "fixed_milestones" ||
      !Array.isArray(goal.milestone_names)
    ) {
      return draft;
    }
    const normalizedMilestoneNames = goal.milestone_names
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
    if (normalizedMilestoneNames.length === 0) {
      return draft;
    }
    const explicitTargetCount =
      typeof goal.target_count === "number" && goal.target_count > 0
        ? goal.target_count
        : null;
    const targetCount = explicitTargetCount ?? normalizedMilestoneNames.length;
    return withValidatedBulkGoalDraft({
      ...draft,
      target_count: String(targetCount),
      milestone_names: buildMilestoneNameDrafts(
        targetCount,
        normalizedMilestoneNames
      ),
    });
  });
}

export function bulkGoalDraftRequiresEndDate(draft: BulkGoalDraft): boolean {
  const parsedTargetCount = parseBulkGoalTargetCount(draft.target_count);
  return isOrdinalGoalDefinition({
    frequencyType: draft.frequency_type,
    targetCount:
      draft.frequency_type === "fixed_milestones"
        ? parsedTargetCount
        : draft.target_count.trim()
          ? parsedTargetCount
          : null,
    targetBasis: resolveBulkGoalTargetBasis(draft),
  });
}

export function summarizeBulkGoalDraftSchedule(draft: BulkGoalDraft): string {
  const cadence =
    draft.frequency_type === "recurring"
      ? `${draft.recurrence_interval[0]!.toUpperCase()}${draft.recurrence_interval.slice(1)}`
      : `${draft.target_count || "0"} milestones`;
  const parsedStart = parseISO(draft.start_date);
  if (!isValid(parsedStart)) {
    return `${cadence} · Start date required`;
  }
  const start = format(parsedStart, "MMM d");
  const parsedEnd = draft.end_date ? parseISO(draft.end_date) : null;
  const range = draft.end_date
    ? `${start} – ${
        parsedEnd && isValid(parsedEnd) ? format(parsedEnd, "MMM d") : "Invalid end"
      }`
    : `Starts ${start}`;
  return `${cadence} · ${range}`;
}

export function prepareBulkGoalRows(
  drafts: BulkGoalDraft[],
  { createId }: { createId?: () => string } = {}
): PreparedBulkGoalRow[] {
  return drafts.map((draft) => {
    const targetBasis =
      draft.frequency_type === "recurring"
        ? resolveBulkGoalTargetBasis(draft)
        : "lifetime";
    const normalizedTargetCount = resolveGoalCreationTargetCountForSave(draft);
    const goalId = createId ? createId() : draft.id;
    return {
      draft,
      goalId,
      row: {
        id: goalId,
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        category_key: getCategoryKeyForSelection(draft.category_selection),
        category: getCategoryLabel(
          draft.category_selection,
          draft.custom_category
        ),
        color: isValidBulkGoalHexColor(draft.color)
          ? draft.color.trim()
          : getCategorySwatchColor(draft.category_selection),
        frequency_type: draft.frequency_type,
        recurrence_interval:
          draft.frequency_type === "recurring"
            ? draft.recurrence_interval
            : null,
        target_count: normalizedTargetCount,
        target_basis: targetBasis,
        milestone_names:
          draft.frequency_type === "fixed_milestones" && normalizedTargetCount
            ? normalizeMilestoneNamesForSave(
                normalizedTargetCount,
                draft.milestone_names
              )
            : null,
        start_date: draft.start_date,
        end_date: draft.end_date || null,
        default_local_time: draft.default_local_time.trim() || null,
        difficulty: draft.difficulty,
        is_private: draft.is_private,
      },
    };
  });
}
export function applyBulkGoalCreationChange(
  draft: Omit<BulkGoalDraft, "errors">,
  change: GoalCreationFieldChange
): Omit<BulkGoalDraft, "errors"> {
  const clearsTargetBasisError =
    change.type === "target_basis" ||
    change.type === "frequency_type" ||
    (change.type === "patch" &&
      (Object.prototype.hasOwnProperty.call(change.value, "target_basis") ||
        Object.prototype.hasOwnProperty.call(change.value, "frequency_type")));
  return {
    ...applyGoalCreationFieldChange(draft, change),
    ...(clearsTargetBasisError ? { target_basis_error: undefined } : {}),
  };
}
