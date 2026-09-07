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
  incompleteKeys,
  completedKeys,
  activeEntryKey,
  overEntryKey,
  existingOrder,
}: {
  incompleteKeys: string[];
  completedKeys: string[];
  activeEntryKey: string;
  overEntryKey: string;
  existingOrder?: string[];
}): string[] | null {
  const movingCompleted = completedKeys.includes(activeEntryKey);
  const targetGroupKeys = movingCompleted ? completedKeys : incompleteKeys;
  const dropAtEnd = overEntryKey === PLANNER_LIST_END_ENTRY_KEY;
  if (
    !targetGroupKeys.includes(activeEntryKey) ||
    (!dropAtEnd && !targetGroupKeys.includes(overEntryKey))
  ) {
    return null;
  }
  const fallbackOrder = [...incompleteKeys, ...completedKeys];
  const existing = existingOrder ?? fallbackOrder;
  const normalized = [
    ...existing.filter((entryKey) => fallbackOrder.includes(entryKey)),
    ...fallbackOrder.filter((entryKey) => !existing.includes(entryKey)),
  ];
  const groupOrder = normalized.filter((entryKey) =>
    targetGroupKeys.includes(entryKey)
  );
  const fromIndex = groupOrder.indexOf(activeEntryKey);
  const toIndex = dropAtEnd
    ? groupOrder.length - 1
    : groupOrder.indexOf(overEntryKey);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return null;
  }
  const nextGroupOrder = moveItemInArray(groupOrder, fromIndex, toIndex);
  const stableIncomplete = movingCompleted
    ? normalized.filter((entryKey) => incompleteKeys.includes(entryKey))
    : nextGroupOrder;
  const stableCompleted = movingCompleted
    ? nextGroupOrder
    : normalized.filter((entryKey) => completedKeys.includes(entryKey));
  return [...stableIncomplete, ...stableCompleted];
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
