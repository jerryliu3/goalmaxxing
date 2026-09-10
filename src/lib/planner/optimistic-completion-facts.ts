import type { ChecklistGoalPresentation } from "@/lib/goals/checklist-presentation";

export type OptimisticCompletionFacts = ReadonlyMap<string, boolean>;

export function optimisticCompletionFactKey(goalId: string, date: string) {
  return `${goalId}:${date}`;
}

export function plannerFactMutationKey(entryKey: string) {
  return `fact:${entryKey}`;
}

export function parseOptimisticCompletionFactKey(key: string) {
  const separator = key.lastIndexOf(":");
  if (separator <= 0 || separator === key.length - 1) {
    return null;
  }
  return {
    goalId: key.slice(0, separator),
    date: key.slice(separator + 1),
  };
}

export function readOptimisticCompletionFact(
  overlay: OptimisticCompletionFacts | undefined,
  goalId: string,
  date: string
) {
  return overlay?.get(optimisticCompletionFactKey(goalId, date));
}

export function overlayCurrentlyCredited(
  currentlyCredited: boolean,
  overlay: OptimisticCompletionFacts | undefined,
  goalId: string,
  date: string
) {
  return readOptimisticCompletionFact(overlay, goalId, date) ?? currentlyCredited;
}

export function withOptimisticCompletionFact(
  overlay: OptimisticCompletionFacts,
  goalId: string,
  date: string,
  present: boolean
) {
  const next = new Map(overlay);
  next.set(optimisticCompletionFactKey(goalId, date), present);
  return next;
}

export function withoutOptimisticCompletionFact(
  overlay: OptimisticCompletionFacts,
  goalId: string,
  date: string
) {
  const key = optimisticCompletionFactKey(goalId, date);
  if (!overlay.has(key)) {
    return overlay;
  }
  const next = new Map(overlay);
  next.delete(key);
  return next;
}

export function pruneOptimisticCompletionFacts(
  overlay: OptimisticCompletionFacts,
  isCanonicalPresent: (goalId: string, date: string) => boolean
) {
  if (overlay.size === 0) {
    return overlay;
  }
  let changed = false;
  const next = new Map(overlay);
  for (const [key, present] of overlay) {
    const parsed = parseOptimisticCompletionFactKey(key);
    if (!parsed) {
      next.delete(key);
      changed = true;
      continue;
    }
    if (isCanonicalPresent(parsed.goalId, parsed.date) === present) {
      next.delete(key);
      changed = true;
    }
  }
  return changed ? next : overlay;
}

export function applyOptimisticChecklistPresentations(
  presentationByGoalId: ReadonlyMap<string, ChecklistGoalPresentation>,
  overlay: OptimisticCompletionFacts,
  viewDate: string
) {
  if (overlay.size === 0) {
    return presentationByGoalId;
  }
  let changed = false;
  const next = new Map(presentationByGoalId);
  for (const [key, present] of overlay) {
    const parsed = parseOptimisticCompletionFactKey(key);
    if (!parsed || parsed.date !== viewDate) {
      continue;
    }
    const existing = next.get(parsed.goalId);
    if (!existing || existing.exactDateCompleted === present) {
      continue;
    }
    next.set(parsed.goalId, {
      ...existing,
      exactDateCompleted: present,
    });
    changed = true;
  }
  return changed ? next : presentationByGoalId;
}
