import type {
  PlannerGoalLinkSummary,
  PlannerWorkUnitClassification,
  PlannerWorkUnitCreditState,
} from "@cadence/shared/planner/context";
import { isLinkedTargetSuppressedOnDate } from "@/lib/planner/link-suppression";
import { resolveWorkUnitDisplayDate } from "@/lib/planner/session-display-date";
import { getEntryGoalFirstTitle } from "@/features/planner/calendar-format";
import type {
  DraftItemEdit,
  PlannerActiveGoalSnapshot,
  PlannerActiveItemSnapshot,
  PlannerCompletionFactMarker,
  PlannerDayDetailEntry,
  PlannerWorkUnit,
} from "@/features/planner/calendar-surface.types";
import { buildPlannerDraftVisualDiff } from "@/lib/planner/diff";
import {
  draftCommandEntryKey,
  type PlannerDraftCommand,
} from "@/lib/planner/draft-commands";
import { resolvePlannerEffectiveScheduledTime } from "@/lib/planner/schedule-time";

export function buildActiveGoalIndexes(
  activeGoals: PlannerActiveGoalSnapshot[] | undefined
) {
  const byPlanGoalId = new Map<string, PlannerActiveGoalSnapshot>();
  const byOriginalGoalId = new Map<string, PlannerActiveGoalSnapshot>();
  for (const goal of activeGoals ?? []) {
    byPlanGoalId.set(goal.id, goal);
    byOriginalGoalId.set(goal.original_goal_id, goal);
  }
  return {
    byPlanGoalId,
    byOriginalGoalId,
  };
}

export interface PlannerEntriesByDateProjection {
  entriesByDate: Map<string, PlannerDayDetailEntry[]>;
  entryByKey: Map<string, PlannerDayDetailEntry>;
  entryDayByKey: Map<string, string>;
}

export function buildEntriesByDateProjection({
  workUnits,
  activeItems,
  activeGoalsByPlanGoalId,
  activeGoalsByOriginalGoalId,
  goalTitles,
  linkedTargetSourceGoalIds,
  linkSummaries,
  draftItemEdits,
  draftCommands = [],
  letGoEntryKeys,
}: {
  workUnits: PlannerWorkUnit[] | undefined;
  activeItems: PlannerActiveItemSnapshot[] | undefined;
  activeGoalsByPlanGoalId: Map<string, PlannerActiveGoalSnapshot>;
  activeGoalsByOriginalGoalId: Map<string, PlannerActiveGoalSnapshot>;
  goalTitles: Record<string, string> | undefined;
  linkedTargetSourceGoalIds?: ReadonlySet<string>;
  linkSummaries?: readonly PlannerGoalLinkSummary[];
  draftItemEdits: Record<string, DraftItemEdit>;
  draftCommands?: readonly PlannerDraftCommand[];
  /** Sessions recovery mode staged as let go: drawn as removed from their day. */
  letGoEntryKeys?: ReadonlySet<string>;
}) {
  const byDate = new Map<string, Map<string, PlannerDayDetailEntry>>();
  const entryByKey = new Map<string, PlannerDayDetailEntry>();
  const entryDayByKey = new Map<string, string>();
  const unitByEntryKey = new Map<string, PlannerWorkUnit>();
  const activeItemByEntryKey = new Map<string, PlannerActiveItemSnapshot>();
  for (const item of activeItems ?? []) {
    const activeGoal = activeGoalsByPlanGoalId.get(item.plan_goal_id) ?? null;
    const originalGoalId = activeGoal?.original_goal_id ?? item.plan_goal_id;
    activeItemByEntryKey.set(`${originalGoalId}:${item.unit_key}`, item);
  }
  const isSuppressedLinkedTargetOnDay = (goalId: string, day: string) =>
    isLinkedTargetSuppressedOnDate({
      goalId,
      date: day,
      linkSummaries,
    });
  const persistedEntryKeys = new Set(
    (activeItems ?? []).map((item) => {
      const activeGoal = activeGoalsByPlanGoalId.get(item.plan_goal_id);
      return `${
        activeGoal?.original_goal_id ?? item.plan_goal_id
      }:${item.unit_key}`;
    })
  );

  const setEntryOnDay = (day: string, key: string, entry: PlannerDayDetailEntry) => {
    const existingDay = entryDayByKey.get(key);
    if (existingDay && existingDay !== day) {
      byDate.get(existingDay)?.delete(key);
    }
    const existing = byDate.get(day);
    if (existing) {
      existing.set(key, entry);
    } else {
      const created = new Map<string, PlannerDayDetailEntry>();
      created.set(key, entry);
      byDate.set(day, created);
    }
    entryByKey.set(key, entry);
    entryDayByKey.set(key, day);
  };

  const buildEntryFromUnit = ({
    key,
    day,
    unit,
    activeItem,
    overrideGoalTitle,
  }: {
    key: string;
    day: string;
    unit: PlannerWorkUnit;
    activeItem: PlannerActiveItemSnapshot | null;
    overrideGoalTitle?: string | null;
  }): PlannerDayDetailEntry => {
    const activeGoal = activeGoalsByOriginalGoalId.get(unit.originalGoalId) ?? null;
    const resolvedTime = resolvePlannerEffectiveScheduledTime({
      scheduledDate: day,
      goalDefaultLocalTime: unit.goalDefaultLocalTime ?? null,
      scheduledTimeOverride:
        unit.scheduledTimeOverride ??
        activeItem?.scheduled_time_override ??
        null,
    });
    return {
      key,
      originalGoalId: unit.originalGoalId,
      goalTitle:
        overrideGoalTitle ??
        activeGoal?.title ??
        goalTitles?.[unit.originalGoalId] ??
        unit.label ??
        unit.unitKey,
      unitKey: unit.unitKey,
      label: unit.label,
      classification: unit.classification,
      creditState: unit.creditState,
      activeGoal,
      activeItem:
        activeItem === null
          ? null
          : {
              ...activeItem,
              scheduled_date: day,
            },
      draftDiffKind: null,
      draftDiffFromDate: null,
      draftDiffToDate: null,
      draftGhost: false,
      hasLinkedTargets:
        linkedTargetSourceGoalIds?.has(unit.originalGoalId) ?? false,
      goalDefaultLocalTime: resolvedTime.goalDefaultLocalTime,
      scheduledTimeOverride: resolvedTime.scheduledTimeOverride,
      effectiveScheduledLocalTime: resolvedTime.effectiveScheduledLocalTime,
    };
  };

  for (const unit of workUnits ?? []) {
    const key = `${unit.originalGoalId}:${unit.unitKey}`;
    unitByEntryKey.set(key, unit);
    const activeItem = activeItemByEntryKey.get(key) ?? null;
    const isCreditedHistoricalUnit = unit.creditState !== "uncredited";
    const displayDay = resolveWorkUnitDisplayDate({
      creditState: unit.creditState,
      persistedScheduledDate: activeItem?.scheduled_date,
      previewScheduledDate: unit.scheduledDate,
      creditedCompletionDate: unit.creditedCompletionDate,
    });
    if (
      !displayDay ||
      (!isCreditedHistoricalUnit && !persistedEntryKeys.has(key)) ||
      isSuppressedLinkedTargetOnDay(unit.originalGoalId, displayDay)
    ) {
      continue;
    }
    setEntryOnDay(displayDay, key, {
      ...buildEntryFromUnit({
        key,
        day: displayDay,
        unit,
        activeItem,
      }),
    });
  }

  for (const item of activeItems ?? []) {
    const activeGoal = activeGoalsByPlanGoalId.get(item.plan_goal_id) ?? null;
    const originalGoalId = activeGoal?.original_goal_id ?? item.plan_goal_id;
    const key = `${originalGoalId}:${item.unit_key}`;
    const existingEntry = entryByKey.get(key);
    if (existingEntry) {
      const existingDay = entryDayByKey.get(key);
      if (!existingDay) {
        continue;
      }
      setEntryOnDay(existingDay, key, {
        ...existingEntry,
        goalTitle:
          existingEntry.goalTitle ??
          activeGoal?.title ??
          goalTitles?.[originalGoalId] ??
          null,
        activeGoal: existingEntry.activeGoal ?? activeGoal,
        activeItem: item,
        goalDefaultLocalTime:
          existingEntry.goalDefaultLocalTime ??
          unitByEntryKey.get(key)?.goalDefaultLocalTime ??
          null,
        scheduledTimeOverride:
          existingEntry.scheduledTimeOverride ??
          item.scheduled_time_override ??
          null,
        effectiveScheduledLocalTime:
          existingEntry.effectiveScheduledLocalTime ??
          item.effective_scheduled_local_time ??
          null,
      });
      continue;
    }
    if (!item.scheduled_date) {
      continue;
    }
    if (isSuppressedLinkedTargetOnDay(originalGoalId, item.scheduled_date)) {
      continue;
    }
    setEntryOnDay(item.scheduled_date, key, {
      key,
      originalGoalId,
      goalTitle: activeGoal?.title ?? goalTitles?.[originalGoalId] ?? null,
      unitKey: item.unit_key,
      label: activeGoal?.title ?? item.unit_key,
      // Identity-only snapshot rows are uncredited until a work unit supplies credit.
      classification: "open",
      creditState: "uncredited",
      activeGoal,
      activeItem: item,
      draftDiffKind: null,
      draftDiffFromDate: null,
      draftDiffToDate: null,
      draftGhost: false,
      hasLinkedTargets:
        linkedTargetSourceGoalIds?.has(originalGoalId) ?? false,
      goalDefaultLocalTime: null,
      scheduledTimeOverride: item.scheduled_time_override ?? null,
      effectiveScheduledLocalTime: item.effective_scheduled_local_time ?? null,
    });
  }

  for (const [key, edit] of Object.entries(draftItemEdits)) {
    const existingEntry = entryByKey.get(key) ?? null;
    const currentDay = existingEntry ? (entryDayByKey.get(key) ?? null) : null;
    const unit = unitByEntryKey.get(key) ?? null;
    const nextDay = edit.scheduledDate === undefined ? currentDay : edit.scheduledDate;
    const nextGoalTitle =
      existingEntry?.goalTitle ??
      (unit
        ? activeGoalsByOriginalGoalId.get(unit.originalGoalId)?.title ??
          goalTitles?.[unit.originalGoalId] ??
          unit.label ??
          unit.unitKey
        : null);
    const nextScheduledTimeOverride =
      edit.scheduledTimeOverride === undefined
        ? existingEntry?.scheduledTimeOverride ?? unit?.scheduledTimeOverride ?? null
        : edit.scheduledTimeOverride;
    const resolvedDraftTime = resolvePlannerEffectiveScheduledTime({
      scheduledDate: nextDay,
      goalDefaultLocalTime:
        existingEntry?.goalDefaultLocalTime ??
        unit?.goalDefaultLocalTime ??
        null,
      scheduledTimeOverride: nextScheduledTimeOverride,
    });

    if (existingEntry && currentDay) {
      byDate.get(currentDay)?.delete(key);
    }
    if (!nextDay) {
      if (existingEntry) {
        entryByKey.delete(key);
        entryDayByKey.delete(key);
      }
      continue;
    }
    const draftGoalId = unit?.originalGoalId ?? existingEntry?.originalGoalId;
    if (
      draftGoalId &&
      isSuppressedLinkedTargetOnDay(draftGoalId, nextDay) &&
      edit.scheduledDate !== undefined
    ) {
      continue;
    }

    if (!existingEntry) {
      if (!unit) {
        continue;
      }
      setEntryOnDay(
        nextDay,
        key,
        buildEntryFromUnit({
          key,
          day: nextDay,
          unit,
          activeItem: activeItemByEntryKey.get(key) ?? null,
          overrideGoalTitle: nextGoalTitle,
        })
      );
      continue;
    }

    setEntryOnDay(nextDay, key, {
      ...existingEntry,
      goalTitle: nextGoalTitle,
      activeItem: existingEntry.activeItem
        ? {
            ...existingEntry.activeItem,
            scheduled_date: nextDay,
          }
        : null,
      goalDefaultLocalTime: resolvedDraftTime.goalDefaultLocalTime,
      scheduledTimeOverride: resolvedDraftTime.scheduledTimeOverride,
      effectiveScheduledLocalTime: resolvedDraftTime.effectiveScheduledLocalTime,
    });
  }

  const draftDiff = buildPlannerDraftVisualDiff(draftCommands);

  for (const diffEntry of draftDiff) {
    const entryKey = `${diffEntry.goalId}:${diffEntry.unitKey}`;
    const dayEntries = byDate.get(diffEntry.date) ?? new Map<string, PlannerDayDetailEntry>();
    let targetKey = entryKey;
    if (!dayEntries.has(targetKey) && diffEntry.kind === "moved_from") {
      targetKey = `${entryKey}:ghost:${diffEntry.date}`;
    }
    const existingEntry = dayEntries.get(targetKey);
    if (existingEntry) {
      dayEntries.set(targetKey, {
        ...existingEntry,
        draftDiffKind: diffEntry.kind,
        draftDiffFromDate:
          diffEntry.kind === "moved_to" ? diffEntry.counterpartDate : diffEntry.date,
        draftDiffToDate:
          diffEntry.kind === "moved_from" ? diffEntry.counterpartDate : diffEntry.date,
      });
      byDate.set(diffEntry.date, dayEntries);
      continue;
    }
    if (diffEntry.kind !== "moved_from") {
      byDate.set(diffEntry.date, dayEntries);
      continue;
    }

    const unit = unitByEntryKey.get(entryKey);
    const activeGoal = activeGoalsByOriginalGoalId.get(diffEntry.goalId) ?? null;
    dayEntries.set(targetKey, {
      key: targetKey,
      originalGoalId: diffEntry.goalId,
      goalTitle:
        activeGoal?.title ??
        goalTitles?.[diffEntry.goalId] ??
        unit?.label ??
        diffEntry.unitKey,
      unitKey: diffEntry.unitKey,
      label: unit?.label ?? null,
      classification: unit?.classification ?? "open",
      creditState: unit?.creditState ?? "uncredited",
      activeGoal,
      activeItem: null,
      draftDiffKind: "moved_from",
      draftDiffFromDate: diffEntry.date,
      draftDiffToDate: diffEntry.counterpartDate,
      draftGhost: true,
      hasLinkedTargets:
        linkedTargetSourceGoalIds?.has(diffEntry.goalId) ?? false,
      scheduledTimeOverride: unit?.scheduledTimeOverride ?? null,
      effectiveScheduledLocalTime: unit?.effectiveScheduledLocalTime ?? null,
    });
    byDate.set(diffEntry.date, dayEntries);
  }

  if (letGoEntryKeys?.size) {
    for (const [day, dayEntries] of byDate) {
      for (const [key, entry] of dayEntries) {
        if (!letGoEntryKeys.has(key)) continue;
        dayEntries.set(key, {
          ...entry,
          draftDiffKind: "moved_from",
          draftDiffFromDate: day,
          draftDiffToDate: null,
          draftGhost: true,
        });
      }
    }
  }

  const entriesByDate = new Map(
    Array.from(byDate.entries()).map(([day, dayEntries]) => [
      day,
      Array.from(dayEntries.values()),
    ])
  );
  const syncedEntryByKey = new Map<string, PlannerDayDetailEntry>();
  const syncedEntryDayByKey = new Map<string, string>();
  for (const [day, entries] of entriesByDate.entries()) {
    for (const entry of entries) {
      syncedEntryByKey.set(entry.key, entry);
      syncedEntryDayByKey.set(entry.key, day);
    }
  }
  return {
    entriesByDate,
    entryByKey: syncedEntryByKey,
    entryDayByKey: syncedEntryDayByKey,
  };
}

export function buildEntriesByDate(
  args: Parameters<typeof buildEntriesByDateProjection>[0]
) {
  return buildEntriesByDateProjection(args).entriesByDate;
}

export function buildPreviewUnitByEntryKey(workUnits: PlannerWorkUnit[] | undefined) {
  const map = new Map<string, PlannerWorkUnit>();
  for (const unit of workUnits ?? []) {
    map.set(
      draftCommandEntryKey({
        goalId: unit.originalGoalId,
        unitKey: unit.unitKey,
      }),
      unit
    );
  }
  return map;
}

export function buildCompletionFactUnitsByGoalDate(
  workUnits: PlannerWorkUnit[] | undefined
) {
  const map = new Map<string, PlannerWorkUnit[]>();
  for (const unit of workUnits ?? []) {
    if (!unit.creditedCompletionDate) {
      continue;
    }
    const key = `${unit.originalGoalId}:${unit.creditedCompletionDate}`;
    const existing = map.get(key) ?? [];
    existing.push(unit);
    map.set(key, existing);
  }
  return map;
}

export function buildCompletionFactMarkersByDate({
  workUnits,
  activeGoalsByOriginalGoalId,
  goalTitles,
  linkSummaries,
}: {
  workUnits: PlannerWorkUnit[] | undefined;
  activeGoalsByOriginalGoalId: Map<string, PlannerActiveGoalSnapshot>;
  goalTitles: Record<string, string> | undefined;
  linkSummaries?: readonly PlannerGoalLinkSummary[];
}) {
  const map = new Map<string, PlannerCompletionFactMarker[]>();
  for (const unit of workUnits ?? []) {
    if (!unit.creditedCompletionDate) {
      continue;
    }
    if (unit.scheduledDate === null) {
      continue;
    }
    if (unit.creditedCompletionDate === unit.scheduledDate) {
      continue;
    }
    const displayDay = resolveWorkUnitDisplayDate({
      creditState: unit.creditState,
      previewScheduledDate: unit.scheduledDate,
      creditedCompletionDate: unit.creditedCompletionDate,
    });
    if (displayDay === unit.creditedCompletionDate) {
      continue;
    }
    const markerDay = unit.creditedCompletionDate;
    if (
      isLinkedTargetSuppressedOnDate({
        goalId: unit.originalGoalId,
        date: markerDay,
        linkSummaries,
      })
    ) {
      continue;
    }
    const markersForDay = map.get(markerDay) ?? [];
    const goalTitle =
      activeGoalsByOriginalGoalId.get(unit.originalGoalId)?.title ??
      goalTitles?.[unit.originalGoalId] ??
      unit.label ??
      unit.unitKey;
    markersForDay.push({
      key: `${unit.originalGoalId}:${unit.unitKey}:${markerDay}`,
      originalGoalId: unit.originalGoalId,
      unitKey: unit.unitKey,
      goalTitle,
      scheduledDate: unit.scheduledDate,
    });
    map.set(markerDay, markersForDay);
  }
  for (const markersForDay of map.values()) {
    markersForDay.sort((left, right) => left.goalTitle.localeCompare(right.goalTitle));
  }
  return map;
}

export function resolveCalendarDayData({
  day,
  entriesByDate,
  completionFactMarkersByDate,
}: {
  day: string | null;
  entriesByDate: Map<string, PlannerDayDetailEntry[]>;
  completionFactMarkersByDate: Map<string, PlannerCompletionFactMarker[]>;
}) {
  if (!day) {
    return {
      entries: [] as PlannerDayDetailEntry[],
      completionFactMarkers: [] as PlannerCompletionFactMarker[],
    };
  }
  return {
    entries: entriesByDate.get(day) ?? [],
    completionFactMarkers: completionFactMarkersByDate.get(day) ?? [],
  };
}

export function orderEntriesForDay({
  day,
  entries,
  previewEntryOrderByDay,
}: {
  day: string | null;
  entries: PlannerDayDetailEntry[];
  previewEntryOrderByDay: Record<string, string[]>;
}) {
  if (!day || entries.length === 0) {
    return entries;
  }
  const dayEntryKeys = entries.map((entry) => entry.key);
  const savedOrder = previewEntryOrderByDay[day] ?? [];
  const order = [
    ...savedOrder.filter((entryKey) => dayEntryKeys.includes(entryKey)),
    ...dayEntryKeys.filter((entryKey) => !savedOrder.includes(entryKey)),
  ];
  const savedOrderSet = new Set(savedOrder);
  const orderIndex = new Map(order.map((entryKey, index) => [entryKey, index]));
  const compareEntries = (left: PlannerDayDetailEntry, right: PlannerDayDetailEntry) => {
    const leftPinned = savedOrderSet.has(left.key);
    const rightPinned = savedOrderSet.has(right.key);
    if (!leftPinned && !rightPinned) {
      const leftTime = left.effectiveScheduledLocalTime ?? null;
      const rightTime = right.effectiveScheduledLocalTime ?? null;
      if (leftTime && rightTime && leftTime !== rightTime) {
        return leftTime.localeCompare(rightTime);
      }
      if (leftTime && !rightTime) {
        return -1;
      }
      if (!leftTime && rightTime) {
        return 1;
      }
    }
    const leftOrder = orderIndex.get(left.key);
    const rightOrder = orderIndex.get(right.key);
    if (leftOrder !== undefined && rightOrder !== undefined) {
      return leftOrder - rightOrder;
    }
    if (leftOrder !== undefined) {
      return -1;
    }
    if (rightOrder !== undefined) {
      return 1;
    }
    return getEntryGoalFirstTitle(left).localeCompare(getEntryGoalFirstTitle(right));
  };
  return [...entries].sort(compareEntries);
}

export function buildCoachSummaryWorkUnits(
  entriesByDate: Map<string, PlannerDayDetailEntry[]>
) {
  const units: PlannerWorkUnit[] = [];
  for (const [day, entries] of entriesByDate.entries()) {
    for (const entry of entries) {
      units.push({
        originalGoalId: entry.originalGoalId,
        unitKey: entry.unitKey,
        label: entry.label,
        scheduledDate: day,
        classification: entry.classification as PlannerWorkUnitClassification,
        creditState: entry.creditState as PlannerWorkUnitCreditState,
      });
    }
  }
  return units;
}
