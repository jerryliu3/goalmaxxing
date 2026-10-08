import type { Completion, Goal } from "@/lib/goals/types";
import { getDateInTimezone } from "@/lib/dates/timezone";
import { createDefaultAssessment } from "@/lib/planner/assessment";
import { resolveCanonicalAsOfDate, PlannerRouteError } from "@/lib/planner/api";
import { canonicalHash } from "@/lib/planner/canonical";
import {
  MAX_COMPLETION_FACTS,
  MAX_ELIGIBLE_GOALS,
  PLANNER_ELIGIBILITY_MODES,
  PLANNER_CONTRACT_VERSION,
} from "@/lib/planner/contracts/bounds";
import { plannerCompletionSchema, plannerGoalSchema } from "@/lib/planner/contracts/kernel-schema";
import {
  expandToMonthAlignedWindow,
  toKernelWindowFromDates,
} from "@/lib/planner/dates";
import type { PlannerCanonicalLink } from "@/lib/planner/fingerprint";
import { runPlannerKernel } from "@/lib/planner/kernel";
import {
  createDefaultPlannerPolicy,
  plannerPolicySchema,
  type PlannerPolicy,
} from "@/lib/planner/policy";
import {
  buildPreparationWindows,
} from "@/lib/planner/preparation-windows";
import {
  parsePlannerProfilePreferencesRow,
  resolvePlannerPreferencesSnapshot,
  type PlannerPreferencesSnapshot,
} from "@/lib/planner/preferences-snapshot";
import type { PlannerCompletionUnitIdentity } from "@/lib/planner/reconciliation";
import { reconcilePersistedGoalCompletions } from "@/lib/planner/persisted-completion-reconciliation";
import { normalizeGoalRequirement } from "@/lib/planner/requirements";
import type { PlannerIssueCode } from "@/lib/planner/solver/types";
import { evaluateActivePlanStaleness } from "@/lib/planner/staleness";
import {
  buildPlannerGoalLockSignature,
  computePlannerUnplaceablePolicyFingerprint,
  isPlannerGoalUnplaceableReason,
  isPlannerGoalUnplaceableRecordValid,
  type PlannerGoalUnplaceableRecord,
} from "@/lib/planner/unplaceable";
import type { PlannerBaseAssignment } from "@/lib/planner/work-units";
import {
  detectActivePlanReconciliationMismatches,
  rebuildCompletionToUnitFromWorkUnits,
} from "@/lib/planner/active-plan-reconciliation";
import { reportError } from "@/lib/observability/report-error";
import type { Database } from "@/lib/supabase/database.types";
import type { createClient as createServerClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerClient>>;
export type PlannerItemRow = Database["public"]["Tables"]["planner_items"]["Row"];
export type PlannerGoalUnplaceableRow =
  Database["public"]["Tables"]["planner_goal_unplaceable"]["Row"];
const PAGE_SIZE = 1_000;
export const PLANNER_GOAL_SELECT = [
  "id",
  "owner_id",
  "title",
  "description",
  "category",
  "color",
  "frequency_type",
  "recurrence_interval",
  "target_count",
  "target_basis",
  "milestone_names",
  "start_date",
  "end_date",
  "default_local_time",
  "photo_path",
  "team_id",
  "is_deleted",
  "archived_at",
  "created_at",
  "updated_at",
].join(",");
export const PLANNER_COMPLETION_SELECT = [
  "id",
  "goal_id",
  "user_id",
  "completed_on",
  "planner_unit_key",
  "source",
  "created_at",
].join(",");

export interface PlannerRevisionTokens {
  canonicalRevision: number;
  executionRevision: number;
  scheduleDigest?: string | null;
}

export interface PlannerActivePlanRow {
  id: string;
  version: number;
  status: "active" | "superseded" | "dismissed";
  timezone: string;
  generation_input_hash: string;
}

export interface PlannerActiveGoalRow {
  id: string;
  goal_id: string;
  original_goal_id: string;
  requirement_fingerprint: string;
  title: string;
  category: string;
  color: string | null;
  start_date: string;
  end_date: string | null;
  assessment_snapshot: ReturnType<typeof createDefaultAssessment>;
  assessment_input_hash: string;
}

export interface PlannerActiveItemRow {
  id: string;
  plan_goal_id: string;
  unit_key: string;
  requirement_kind: "milestone_sequence" | "cadence" | "deadline_total";
  scheduled_date: string | null;
  original_scheduled_date: string | null;
  locked: boolean;
  revision: number;
  scheduled_time_override: string | null;
  effective_scheduled_local_time: string | null;
}

export interface ActiveExecutionPlanSnapshot {
  plan: PlannerActivePlanRow;
  policy: PlannerPolicy;
  goals: PlannerActiveGoalRow[];
  days: Array<{ date: string }>;
  items: PlannerActiveItemRow[];
  issues: Array<{ issue_code: PlannerIssueCode }>;
  basePlan: {
    planId: string;
    version: number;
    assignments: PlannerBaseAssignment[];
    completionToUnit: Record<string, PlannerCompletionUnitIdentity>;
    issueCodes: PlannerIssueCode[];
  };
}

export interface PlannerCanonicalSnapshot {
  goals: Goal[];
  completions: Completion[];
  links: PlannerCanonicalLink[];
  revisions: PlannerRevisionTokens;
  preferences: PlannerPreferencesSnapshot | null;
  activePlan: ActiveExecutionPlanSnapshot | null;
  unplaceableGoals?: PlannerGoalUnplaceableRecord[];
}

export function partitionPlannerItemsByKnownGoals<
  T extends { id: string; goal_id: string },
>(items: T[], goals: ReadonlyArray<{ id: string }>) {
  const goalIds = new Set(goals.map((goal) => goal.id));
  const knownItems: T[] = [];
  const skippedItems: Array<{ itemId: string; goalId: string }> = [];
  for (const item of items) {
    if (goalIds.has(item.goal_id)) {
      knownItems.push(item);
    } else {
      skippedItems.push({ itemId: item.id, goalId: item.goal_id });
    }
  }
  return { knownItems, skippedItems };
}

function requireTableRead(error: { message: string } | null, code: string) {
  if (error) {
    throw new PlannerRouteError(
      500,
      code,
      "Planner data could not be loaded.",
      { cause: error.message }
    );
  }
}

async function loadOwnerGoals(
  supabase: ServerSupabaseClient,
  ownerId: string
) {
  const goals: Goal[] = [];
  let lastGoalId: string | null = null;
  for (;;) {
    let query = supabase
      .from("goals")
      .select(PLANNER_GOAL_SELECT)
      .eq("owner_id", ownerId)
      .eq("is_deleted", false)
      .order("id")
      .limit(PAGE_SIZE);
    if (lastGoalId) {
      query = query.gt("id", lastGoalId);
    }
    const response = await query;
    requireTableRead(response.error, "goal_load_failed");
    const page = plannerGoalSchema.array().parse(response.data ?? []);
    goals.push(...page);
    if (goals.length > MAX_ELIGIBLE_GOALS) {
      throw new PlannerRouteError(
        413,
        "plan_too_large",
        "Planner goal bounds were exceeded.",
        { dimension: "eligible goals", maximum: MAX_ELIGIBLE_GOALS }
      );
    }
    if (page.length < PAGE_SIZE) {
      break;
    }
    lastGoalId = page.at(-1)?.id ?? null;
  }
  return goals;
}

async function loadOwnerCompletions(
  supabase: ServerSupabaseClient,
  ownerId: string,
  goalIds: string[]
) {
  if (goalIds.length === 0) {
    return [] as Completion[];
  }

  const completions: Completion[] = [];
  let lastCompletionId: string | null = null;
  for (;;) {
    let query = supabase
      .from("completions")
      .select(PLANNER_COMPLETION_SELECT)
      .eq("user_id", ownerId)
      .in("goal_id", goalIds)
      .order("id")
      .limit(PAGE_SIZE);
    if (lastCompletionId) {
      query = query.gt("id", lastCompletionId);
    }
    const response = await query;
    requireTableRead(response.error, "completion_load_failed");
    const page = plannerCompletionSchema.array().parse(response.data ?? []);
    completions.push(...page);
    if (completions.length > MAX_COMPLETION_FACTS) {
      throw new PlannerRouteError(
        413,
        "plan_too_large",
        "Planner completion bounds were exceeded.",
        { dimension: "completion facts", maximum: MAX_COMPLETION_FACTS }
      );
    }
    if (page.length < PAGE_SIZE) {
      break;
    }
    lastCompletionId = page.at(-1)?.id ?? null;
  }

  return completions;
}

async function loadOwnerLinks(
  supabase: ServerSupabaseClient,
  ownerId: string
) {
  const links: PlannerCanonicalLink[] = [];
  let lastId: string | null = null;
  for (;;) {
    let query = supabase
      .from("goal_links")
      .select("id, source_goal_id, target_goal_id")
      .eq("owner_id", ownerId)
      .order("id")
      .limit(PAGE_SIZE);
    if (lastId) {
      query = query.gt("id", lastId);
    }
    const response = await query;
    requireTableRead(response.error, "link_load_failed");
    const page = (response.data ??
      []) as Array<{ id: string; source_goal_id: string; target_goal_id: string }>;
    links.push(
      ...page.map((link) => ({
        sourceGoalId: link.source_goal_id,
        targetGoalId: link.target_goal_id,
      }))
    );
    if (page.length < PAGE_SIZE) {
      break;
    }
    lastId = page.at(-1)?.id ?? null;
  }
  return links;
}

async function loadRevisionTokens(
  supabase: ServerSupabaseClient
): Promise<PlannerRevisionTokens> {
  const scheduleDigestResponse = await supabase.rpc(
    "get_planner_schedule_digest",
    {}
  );
  if (scheduleDigestResponse.error) {
    const digestErrorCode = (scheduleDigestResponse.error.code ?? "").toUpperCase();
    const digestErrorMessage = scheduleDigestResponse.error.message.toLowerCase();
    const missingDigestFunction =
      digestErrorCode === "42883" ||
      digestErrorCode === "PGRST202" ||
      digestErrorMessage.includes("does not exist") ||
      digestErrorMessage.includes("schema cache");
    if (!missingDigestFunction) {
      requireTableRead(scheduleDigestResponse.error, "revision_load_failed");
    }
  }
  const scheduleDigest =
    scheduleDigestResponse.error
      ? null
      : typeof scheduleDigestResponse.data === "string"
      ? scheduleDigestResponse.data
      : null;
  return {
    canonicalRevision: 0,
    executionRevision: 0,
    scheduleDigest,
  };
}

async function loadPlannerPreferences(
  supabase: ServerSupabaseClient,
  ownerId: string
) {
  const profileResponse = await supabase
    .from("profiles")
    .select(
      "timezone,timezone_confirmed_at,week_starts_on,rest_weekdays,blackout_ranges"
    )
    .eq("id", ownerId)
    .maybeSingle();

  if (profileResponse.error) {
    throw new PlannerRouteError(
      500,
      "preference_load_failed",
      "Planner data could not be loaded.",
      { cause: profileResponse.error.message }
    );
  }
  const profile = profileResponse.data
    ? parsePlannerProfilePreferencesRow(profileResponse.data)
    : null;
  return resolvePlannerPreferencesSnapshot({ profile });
}

export async function loadPlannerItemsForWindow(
  supabase: ServerSupabaseClient,
  ownerId: string,
  startDate: string,
  endDate: string
) {
  const items: PlannerItemRow[] = [];
  let lastItemId: string | null = null;
  for (;;) {
    let query = supabase
      .from("planner_items")
      .select("*")
      .eq("owner_id", ownerId)
      .gte("scheduled_date", startDate)
      .lte("scheduled_date", endDate)
      .order("id")
      .limit(PAGE_SIZE);
    if (lastItemId) {
      query = query.gt("id", lastItemId);
    }
    const response = await query;
    requireTableRead(response.error, "active_plan_item_load_failed");
    const page = (response.data ?? []) as PlannerItemRow[];
    items.push(...page);
    if (page.length < PAGE_SIZE) {
      break;
    }
    lastItemId = page.at(-1)?.id ?? null;
  }
  return items.sort(
    (left, right) =>
      left.scheduled_date.localeCompare(right.scheduled_date) ||
      left.goal_id.localeCompare(right.goal_id) ||
      left.unit_key.localeCompare(right.unit_key)
  );
}

export async function loadAllPlannerItems(
  supabase: ServerSupabaseClient,
  ownerId: string
) {
  const items: PlannerItemRow[] = [];
  let lastItemId: string | null = null;
  for (;;) {
    let query = supabase
      .from("planner_items")
      .select("*")
      .eq("owner_id", ownerId)
      .order("id")
      .limit(PAGE_SIZE);
    if (lastItemId) {
      query = query.gt("id", lastItemId);
    }
    const response = await query;
    requireTableRead(response.error, "active_plan_item_load_failed");
    const page = (response.data ?? []) as PlannerItemRow[];
    items.push(...page);
    if (page.length < PAGE_SIZE) {
      break;
    }
    lastItemId = page.at(-1)?.id ?? null;
  }
  return items;
}

async function loadPlannerGoalUnplaceableRecords(
  supabase: ServerSupabaseClient,
  ownerId: string
) {
  const rows: PlannerGoalUnplaceableRow[] = [];
  let lastGoalId: string | null = null;
  for (;;) {
    let query = supabase
      .from("planner_goal_unplaceable")
      .select("*")
      .eq("owner_id", ownerId)
      .order("goal_id")
      .limit(PAGE_SIZE);
    if (lastGoalId) {
      query = query.gt("goal_id", lastGoalId);
    }
    const response = await query;
    requireTableRead(response.error, "unplaceable_load_failed");
    const page = (response.data ?? []) as PlannerGoalUnplaceableRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) {
      break;
    }
    lastGoalId = page.at(-1)?.goal_id ?? null;
  }
  return rows
    .flatMap((row) => {
      if (!isPlannerGoalUnplaceableReason(row.reason)) {
        return [];
      }
      return [{
        goalId: row.goal_id,
        requirementFingerprint: row.requirement_fingerprint,
        policyFingerprint: row.policy_fingerprint ?? "",
        policyRevision: row.policy_revision,
        lockSignature: row.lock_signature,
        effectiveSpanEnd: row.effective_span_end,
        unplacedCount: row.unplaced_count,
        reason: row.reason,
        computedAt: row.computed_at,
      }];
    })
    .sort((left, right) => left.goalId.localeCompare(right.goalId));
}

async function loadActivePlanSnapshot(
  windowKey: string,
  plannerItems: PlannerItemRow[],
  goals: Goal[],
  completions: Completion[],
  preferences: PlannerPreferencesSnapshot | null
): Promise<ActiveExecutionPlanSnapshot | null> {
  const { knownItems, skippedItems } = partitionPlannerItemsByKnownGoals(
    plannerItems,
    goals
  );
  if (skippedItems.length > 0) {
    reportError(new Error("Planner item referenced a missing goal."), {
      code: "planner_item_missing_goal",
      itemCount: skippedItems.length,
      goalIds: Array.from(new Set(skippedItems.map((item) => item.goalId))),
      sampleItemId: skippedItems[0]?.itemId,
    });
  }
  if (knownItems.length === 0) {
    return null;
  }

  const goalById = new Map(goals.map((goal) => [goal.id, goal]));

  const activeGoalByGoalId = new Map<string, PlannerActiveGoalRow>();
  const requirementKindByGoalId = new Map<
    string,
    PlannerActiveItemRow["requirement_kind"]
  >();
  const items: PlannerActiveItemRow[] = [];
  const assignments: PlannerBaseAssignment[] = [];
  for (const item of knownItems) {
    const goal = goalById.get(item.goal_id);
    if (!goal) {
      continue;
    }
    let activeGoal = activeGoalByGoalId.get(goal.id);
    let requirementKind = requirementKindByGoalId.get(goal.id);
    if (!activeGoal) {
      const normalizedRequirement = normalizeGoalRequirement(goal);
      const assessment = createDefaultAssessment(goal);
      requirementKind = normalizedRequirement.requirement.kind;
      activeGoal = {
        id: goal.id,
        goal_id: goal.id,
        original_goal_id: goal.id,
        requirement_fingerprint: normalizedRequirement.requirementFingerprint,
        title: goal.title,
        category: goal.category,
        color: goal.color,
        start_date: goal.start_date,
        end_date: goal.end_date,
        assessment_snapshot: assessment,
        assessment_input_hash: assessment.assessmentInputHash,
      };
      activeGoalByGoalId.set(goal.id, activeGoal);
      requirementKindByGoalId.set(goal.id, requirementKind);
    }
    if (!requirementKind) {
      continue;
    }
    const originalScheduledDate =
      item.original_scheduled_date ?? item.scheduled_date;
    items.push({
      id: item.id,
      plan_goal_id: goal.id,
      unit_key: item.unit_key,
      requirement_kind: requirementKind,
      scheduled_date: item.scheduled_date,
      original_scheduled_date: originalScheduledDate,
      locked: item.locked,
      revision: 0,
      scheduled_time_override: item.scheduled_time,
      effective_scheduled_local_time: item.scheduled_time,
    });
    assignments.push({
      goalId: goal.id,
      requirementFingerprint: activeGoal.requirement_fingerprint,
      unitKey: item.unit_key,
      scheduledDate: item.scheduled_date,
      locked: item.locked,
      scheduledTimeOverride: item.scheduled_time,
    });
  }

  const timezone = preferences?.timezone ?? "UTC";
  const policy = plannerPolicySchema.parse(
    preferences?.default_policy ??
      createDefaultPlannerPolicy(timezone, new Date().toISOString())
  );
  const planId = `planner-items-${windowKey}`;

  return {
    plan: {
      id: planId,
      version: 1,
      status: "active",
      timezone,
      generation_input_hash: planId,
    },
    policy,
    goals: Array.from(activeGoalByGoalId.values()).sort(
      (left, right) => left.original_goal_id.localeCompare(right.original_goal_id)
    ),
    days: [],
    items,
    issues: [],
    basePlan: {
      planId,
      version: 1,
      assignments: assignments.sort(
        (left, right) =>
          left.goalId.localeCompare(right.goalId) ||
          left.unitKey.localeCompare(right.unitKey)
      ),
      completionToUnit: {},
      issueCodes: [],
    },
  };
}

export async function loadPlannerCanonicalSnapshot({
  supabase,
  ownerId,
  startDate,
  endDate,
}: {
  supabase: ServerSupabaseClient;
  ownerId: string;
  startDate: string;
  endDate: string;
}): Promise<PlannerCanonicalSnapshot & { persistedItems: PlannerItemRow[] }> {
  const [goals, links, revisions, preferences, plannerItems, unplaceableGoals] =
    await Promise.all([
      loadOwnerGoals(supabase, ownerId),
      loadOwnerLinks(supabase, ownerId),
      loadRevisionTokens(supabase),
      loadPlannerPreferences(supabase, ownerId),
      loadAllPlannerItems(supabase, ownerId),
      loadPlannerGoalUnplaceableRecords(supabase, ownerId),
    ]);
  const completions = await loadOwnerCompletions(
    supabase,
    ownerId,
    goals.map((goal) => goal.id)
  );
  const activePlan = await loadActivePlanSnapshot(
    `${startDate}:${endDate}`,
    plannerItems.filter((item) => item.scheduled_date >= startDate && item.scheduled_date <= endDate),
    goals,
    completions,
    preferences
  );
  if (activePlan) {
    const asOfDate = resolveCanonicalAsOfDate({ timezone: preferences?.timezone ?? "UTC" });
    for (const goal of goals) {
      if (!completions.some((completion) => completion.goal_id === goal.id)) continue;
      const reconciled = reconcilePersistedGoalCompletions({
        goal,
        completions,
        persistedItems: plannerItems,
        asOfDate,
        weekStartsOn: preferences?.default_policy.weekStartsOn,
      });
      Object.assign(activePlan.basePlan.completionToUnit, reconciled.completionToUnit);
    }
  }

  return {
    goals,
    completions,
    links,
    revisions,
    preferences,
    activePlan,
    persistedItems: plannerItems,
    unplaceableGoals,
  };
}

export async function loadPlannerPreparationSnapshot({
  supabase,
  ownerId,
}: {
  supabase: ServerSupabaseClient;
  ownerId: string;
}) {
  const [goals, links, revisions, preferences, persistedItems, unplaceableGoals] =
    await Promise.all([
      loadOwnerGoals(supabase, ownerId),
      loadOwnerLinks(supabase, ownerId),
      loadRevisionTokens(supabase),
      loadPlannerPreferences(supabase, ownerId),
      loadAllPlannerItems(supabase, ownerId),
      loadPlannerGoalUnplaceableRecords(supabase, ownerId),
    ]);
  const completions = await loadOwnerCompletions(
    supabase,
    ownerId,
    goals.map((goal) => goal.id)
  );
  return {
    snapshot: {
      goals,
      completions,
      links,
      revisions,
      preferences,
      activePlan: null,
      unplaceableGoals,
    } satisfies PlannerCanonicalSnapshot,
    persistedItems,
    unplaceableGoals,
  };
}

function toPlannerGoalSemanticSnapshot(goal: PlannerActiveGoalRow) {
  return {
    title: goal.title,
    category: goal.category,
    color: goal.color,
    startDate: goal.start_date,
    endDate: goal.end_date,
    requirementFingerprint: goal.requirement_fingerprint,
    assessmentInputHash: goal.assessment_input_hash,
    assessmentFingerprint: canonicalHash(goal.assessment_snapshot),
  };
}

export async function loadPlannerContextPayload({
  supabase,
  ownerId,
  capabilities,
  scopeMonth,
  startDate,
  endDate,
  correlationId,
}: {
  supabase: ServerSupabaseClient;
  ownerId: string;
  capabilities: { crossMonthMovesEnabled: boolean };
  scopeMonth: string;
  startDate: string;
  endDate: string;
  correlationId?: string;
}) {
  const kernelWindow = toKernelWindowFromDates(
    expandToMonthAlignedWindow({ start: startDate, end: endDate })
  );
  const snapshot = await loadPlannerCanonicalSnapshot({
    supabase,
    ownerId,
    ...kernelWindow,
  });
  const effectiveTimezone = snapshot.preferences?.timezone ?? "UTC";
  const asOfDate = resolveCanonicalAsOfDate({ timezone: effectiveTimezone });
  const preparationWindows = buildPreparationWindows(asOfDate);
  const preparationStart = preparationWindows[0]?.start ?? startDate;
  const preparationEnd = preparationWindows.at(-1)?.end ?? endDate;
  const needsPreparationHorizonItems =
    (snapshot.unplaceableGoals?.length ?? 0) > 0;
  const goalById = new Map(snapshot.goals.map((goal) => [goal.id, goal]));
  const persistedItemsInPreparationHorizon = needsPreparationHorizonItems
    ? partitionPlannerItemsByKnownGoals(
        await loadPlannerItemsForWindow(
          supabase,
          ownerId,
          preparationStart,
          preparationEnd
        ),
        snapshot.goals
      ).knownItems
    : [];
  const effectivePolicy = plannerPolicySchema.parse(
    snapshot.preferences?.default_policy ??
      createDefaultPlannerPolicy(effectiveTimezone, new Date().toISOString())
  );
  const policyFingerprint = canonicalHash(effectivePolicy);
  const unplaceablePolicyFingerprint =
    computePlannerUnplaceablePolicyFingerprint(effectivePolicy);
  const policyRevision = snapshot.preferences?.policy_revision ?? 0;
  const lockSignatureByGoalId = new Map<string, string>();
  const lockEntriesByGoalId = new Map<
    string,
    Array<{ unitKey: string; scheduledDate: string; locked: boolean }>
  >();
  for (const item of persistedItemsInPreparationHorizon) {
    const entries = lockEntriesByGoalId.get(item.goal_id) ?? [];
    entries.push({
      unitKey: item.unit_key,
      scheduledDate: item.scheduled_date,
      locked: item.locked,
    });
    lockEntriesByGoalId.set(item.goal_id, entries);
  }
  for (const goal of snapshot.goals) {
    lockSignatureByGoalId.set(
      goal.id,
      buildPlannerGoalLockSignature(lockEntriesByGoalId.get(goal.id) ?? [])
    );
  }
  const validUnplaceableGoals = (snapshot.unplaceableGoals ?? []).filter((record) => {
    const goal = goalById.get(record.goalId);
    if (!goal) {
      return false;
    }
    return isPlannerGoalUnplaceableRecordValid({
      record,
      goal,
      policyFingerprint: unplaceablePolicyFingerprint,
      policyRevision,
      lockSignature: lockSignatureByGoalId.get(goal.id) ?? "",
      preparationEnd,
    });
  });
  const activeAssessments = (snapshot.activePlan?.goals ?? []).map((goal) =>
    goal.assessment_snapshot
  );
  const preview = runPlannerKernel({
    schemaVersion: PLANNER_CONTRACT_VERSION,
    eligibilityMode: PLANNER_ELIGIBILITY_MODES[0],
    ownerId,
    ...kernelWindow,
    asOfDate,
    timezone: effectiveTimezone,
    goals: snapshot.goals,
    completions: snapshot.completions,
    links: snapshot.links,
    assessments: activeAssessments.length > 0 ? activeAssessments : undefined,
    policy: effectivePolicy,
    basePlan: snapshot.activePlan?.basePlan ?? null,
    preserveExistingAssignments: true,
  });
  const activeAssessmentByGoalId = new Map(
    activeAssessments.map((assessment) => [assessment.goalId, assessment])
  );
  const currentGoals = Object.fromEntries(
    snapshot.goals.map((goal) => {
      const assessment =
        activeAssessmentByGoalId.get(goal.id) ?? createDefaultAssessment(goal);
      return [
        goal.id,
        {
          title: goal.title,
          category: goal.category,
          color: goal.color,
          startDate: goal.start_date,
          endDate: goal.end_date,
          requirementFingerprint:
            normalizeGoalRequirement(goal).requirementFingerprint,
          assessmentInputHash: assessment.assessmentInputHash,
          assessmentFingerprint: canonicalHash(assessment),
        },
      ];
    })
  );
  const staleness = snapshot.activePlan
    ? evaluateActivePlanStaleness({
        snapshot: {
          planId: snapshot.activePlan.plan.id,
          status: snapshot.activePlan.plan.status,
          timezone: snapshot.activePlan.plan.timezone,
          policyFingerprint: canonicalHash(snapshot.activePlan.policy),
          goals: Object.fromEntries(
            snapshot.activePlan.goals.map((goal) => [
              goal.original_goal_id,
              toPlannerGoalSemanticSnapshot(goal),
            ])
          ),
        },
        current: {
          timezone: effectiveTimezone,
          policyFingerprint,
          goals: currentGoals,
          workUnits: preview.workUnits,
          driftFacts: preview.driftFacts,
          invalidGoalIds: preview.solver.invalidGoalIds,
          localToday: getDateInTimezone(
            new Date(),
            snapshot.activePlan.plan.timezone
          ),
        },
      })
    : { status: "not_applicable" as const, stale: false, reasons: [] };
  const hydratedActivePlan = snapshot.activePlan
    ? (() => {
        const goalIdByPlanGoalId = new Map(
          snapshot.activePlan.goals.map((goal) => [
            goal.id,
            goal.original_goal_id,
          ])
        );
        const reconciliationMismatches =
          detectActivePlanReconciliationMismatches({
            items: snapshot.activePlan.items,
            workUnits: preview.workUnits,
            goalIdByPlanGoalId,
            planId: snapshot.activePlan.plan.id,
          });
        for (const mismatch of reconciliationMismatches) {
          reportError(new Error("reconciliation_mismatch"), {
            code: "reconciliation_mismatch",
            ...mismatch,
          });
        }
        return {
          ...snapshot.activePlan,
          basePlan: snapshot.activePlan.basePlan
            ? {
                ...snapshot.activePlan.basePlan,
                completionToUnit: rebuildCompletionToUnitFromWorkUnits(
                  preview.workUnits
                ),
              }
            : snapshot.activePlan.basePlan,
        };
      })()
    : snapshot.activePlan;

  return {
    schemaVersion: "1" as const,
    scopeMonth,
    asOfDate,
    timezone: effectiveTimezone,
    goalTitles: Object.fromEntries(
      snapshot.goals.map((goal) => [goal.id, goal.title])
    ),
    links: snapshot.links,
    revisions: snapshot.revisions,
    capabilities,
    preferences: snapshot.preferences
      ? {
          timezone: snapshot.preferences.timezone,
          policyRevision: snapshot.preferences.policy_revision,
          timezoneConfirmedAt: snapshot.preferences.timezone_confirmed_at,
          defaultPolicy: effectivePolicy,
        }
      : null,
    activePlan: hydratedActivePlan,
    preview,
    staleness,
    unplaceableGoals: validUnplaceableGoals,
    ...(correlationId ? { correlationId } : {}),
  };
}
