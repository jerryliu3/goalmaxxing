import { resolveSelectedDateState } from "../dates/day";

export type ProgressLedgerMode = "empty" | "aggregate" | "edit" | "overlap";

export function resolveSelectedLedgerGoalIds(
  visibleGoalIds: readonly string[],
  selectedGoalIds: readonly string[] | null
): string[] {
  if (selectedGoalIds === null) {
    return [...visibleGoalIds];
  }
  const visible = new Set(visibleGoalIds);
  return selectedGoalIds.filter((id) => visible.has(id));
}

export function resolveProgressLedgerMode({
  selectedCount,
  visibleCount,
}: {
  selectedCount: number;
  visibleCount: number;
}): ProgressLedgerMode {
  if (selectedCount <= 0) {
    return "empty";
  }
  if (selectedCount === 1) {
    return "edit";
  }
  if (visibleCount > 1 && selectedCount === visibleCount) {
    return "aggregate";
  }
  return "overlap";
}

export function toggleLedgerGoalSelection(
  visibleGoalIds: readonly string[],
  selectedGoalIds: readonly string[] | null,
  goalId: string
): string[] | null {
  const current = resolveSelectedLedgerGoalIds(visibleGoalIds, selectedGoalIds);
  const next = current.includes(goalId)
    ? current.filter((id) => id !== goalId)
    : [...current, goalId];
  if (next.length === 0) {
    return [];
  }
  if (
    next.length === visibleGoalIds.length &&
    visibleGoalIds.every((id) => next.includes(id))
  ) {
    return null;
  }
  return next;
}

export function isLedgerHeatmapDayMutable(date: string, today: string): boolean {
  return resolveSelectedDateState(date, today) !== "future";
}

export type ProgressLedgerUnit = "completion" | "milestone";

export function progressLedgerCaption(
  mode: ProgressLedgerMode,
  selectedCount: number,
  unit: ProgressLedgerUnit = "completion",
  editable = true
): string {
  const unitLabel = unit === "milestone" ? "milestone" : "completion";
  const unitPlural = unit === "milestone" ? "milestones" : "completions";
  if (mode === "empty") {
    return `Select a goal to see ${unitPlural}.`;
  }
  if (mode === "edit") {
    if (!editable) {
      return `This calendar shows this goal's ${unitPlural}.`;
    }
    return `Tap a past or today cell to log or remove a ${unitLabel}. Future days are closed.`;
  }
  if (mode === "overlap") {
    return `Read-only overlap of ${selectedCount} goals.`;
  }
  return `Aggregate of selected goals. This calendar logs ${unitPlural}, including unscheduled days.`;
}
