import { createClientUuid } from "../ids";

export const PLANNER_LIST_END_ENTRY_KEY = "__end__";

export function sameEntryKeyOrder(
  left: readonly string[] | undefined,
  right: readonly string[]
) {
  return (
    Array.isArray(left) &&
    left.length === right.length &&
    left.every((entryKey, index) => entryKey === right[index])
  );
}

export function moveItemInArray<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  if (moved === undefined) {
    return items;
  }
  next.splice(toIndex, 0, moved);
  return next;
}

export function reorderPreviewEntryKeys({
  entryKeys,
  activeEntryKey,
  overEntryKey,
  existingOrder,
}: {
  entryKeys: string[];
  activeEntryKey: string;
  overEntryKey: string;
  existingOrder?: string[];
}): string[] | null {
  const dropAtEnd = overEntryKey === PLANNER_LIST_END_ENTRY_KEY;
  if (
    !entryKeys.includes(activeEntryKey) ||
    (!dropAtEnd && !entryKeys.includes(overEntryKey))
  ) {
    return null;
  }
  const fallbackOrder = entryKeys;
  const existing = existingOrder ?? fallbackOrder;
  const normalized = [
    ...existing.filter((entryKey) => fallbackOrder.includes(entryKey)),
    ...fallbackOrder.filter((entryKey) => !existing.includes(entryKey)),
  ];
  const fromIndex = normalized.indexOf(activeEntryKey);
  const toIndex = dropAtEnd
    ? normalized.length - 1
    : normalized.indexOf(overEntryKey);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return null;
  }
  return moveItemInArray(normalized, fromIndex, toIndex);
}

export function unitEntryKey(unit: { originalGoalId: string; unitKey: string }) {
  return `${unit.originalGoalId}:${unit.unitKey}`;
}

export interface PlannerMoveItemDraftCommand {
  id: string;
  sequence: number;
  goalId: string;
  unitKey: string;
  kind: "move_item";
  scheduledDate: string | null;
  sourceDate: string;
}

export function createMoveItemDraftCommand({
  goalId,
  unitKey,
  scheduledDate,
  sourceDate,
  sequence = 0,
}: {
  goalId: string;
  unitKey: string;
  scheduledDate: string | null;
  sourceDate: string;
  sequence?: number;
}): PlannerMoveItemDraftCommand {
  return {
    id: createClientUuid(),
    sequence,
    goalId,
    unitKey,
    kind: "move_item" as const,
    scheduledDate,
    sourceDate,
  };
}
