import type { ReactNode } from "react";
import {
  PROGRESS_GOALS,
  type MilestoneSeed,
  type ProgressGoalSeed,
} from "@/features/ux-destinations/seed";

export function ProgressMapShell({
  map,
  goals,
}: {
  map: ReactNode;
  goals: ReactNode;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(15rem,19rem)_minmax(0,1fr)] lg:items-start">
      <div className="order-1 lg:order-2">{map}</div>
      <div className="order-2 min-w-0 lg:order-1">{goals}</div>
    </div>
  );
}

export function GoalPicker({
  selectedIds,
  onToggle,
  onAll,
}: {
  selectedIds: readonly string[];
  onToggle: (id: string) => void;
  onAll: () => void;
}) {
  const all = selectedIds.length === PROGRESS_GOALS.length;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Goals</h2>
        <button
          type="button"
          className="text-xs font-semibold text-muted-foreground"
          onClick={onAll}
        >
          All goals
        </button>
      </div>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {PROGRESS_GOALS.map((goal) => {
          const selected = selectedIds.includes(goal.id);
          return (
            <li key={goal.id} className="min-w-[10.5rem] shrink-0 lg:min-w-0">
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onToggle(goal.id)}
                className={`flex min-h-11 w-full flex-col items-start rounded-[10px] border px-3 py-2 text-left ${
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-border"
                }`}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`size-2 shrink-0 rounded-full ${goal.tone}`} />
                    <span className="truncate text-sm font-semibold">{goal.title}</span>
                  </span>
                  <span
                    className={`shrink-0 text-[10px] ${
                      selected ? "text-background/70" : "text-muted-foreground"
                    }`}
                  >
                    {goal.countLabel}
                  </span>
                </span>
                <span
                  className={`mt-1 hidden text-xs lg:block ${
                    selected ? "text-background/70" : "text-muted-foreground"
                  }`}
                >
                  {goal.detail}
                </span>
                <span
                  className={`mt-2 hidden h-1 w-full overflow-hidden rounded-full lg:block ${
                    selected ? "bg-background/25" : "bg-muted"
                  }`}
                >
                  <span
                    className={`block h-full rounded-full ${
                      selected ? "bg-background" : "bg-primary"
                    }`}
                    style={{ width: `${goal.percent}%` }}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {all ? null : (
        <p className="mt-2 text-xs text-muted-foreground">
          {selectedIds.length} selected
        </p>
      )}
    </div>
  );
}

export function MilestoneRunway({
  goal,
  activeName,
  onSelect,
}: {
  goal: ProgressGoalSeed;
  activeName?: string | null;
  onSelect?: (milestone: MilestoneSeed) => void;
}) {
  const milestones = goal.milestones ?? [];
  return (
    <section className="rounded-[12px] border border-border p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Milestone runway
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold tracking-tight">
            {goal.title}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">{goal.countLabel}</p>
      </div>
      <div className="-mx-1 mt-4 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        <ol className="flex min-w-max gap-2">
          {milestones.map((milestone, index) => (
            <li key={milestone.name} className="w-[9.5rem] shrink-0">
              <button
                type="button"
                onClick={() => onSelect?.(milestone)}
                aria-current={activeName === milestone.name ? "step" : undefined}
                className={`flex min-h-[5.5rem] w-full flex-col items-start rounded-[10px] border px-3 py-2 text-left ${
                  activeName === milestone.name
                    ? "border-foreground"
                    : "border-border"
                } ${milestone.done ? "bg-muted/50" : ""}`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {index + 1} / {milestones.length}
                </span>
                <span className="mt-1 text-sm font-semibold">{milestone.name}</span>
                <span className="text-xs text-muted-foreground">
                  {milestone.done
                    ? milestone.date
                    : milestone.cell !== null
                      ? "Placed · open"
                      : "Unplaced"}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function toggleGoalSelection(
  selectedIds: readonly string[],
  goalId: string
): string[] {
  if (
    selectedIds.length === PROGRESS_GOALS.length &&
    selectedIds.includes(goalId)
  ) {
    return [goalId];
  }
  const next = selectedIds.includes(goalId)
    ? selectedIds.filter((id) => id !== goalId)
    : [...selectedIds, goalId];
  return next.length === 0 ? [goalId] : next;
}

export function ledgerCaption(selectedIds: readonly string[]): string {
  if (selectedIds.length === 1) {
    const goal = PROGRESS_GOALS.find((item) => item.id === selectedIds[0]);
    const unit = goal?.kind === "milestone" ? "milestone" : "completion";
    return `Tap a past or today cell to log or remove a ${unit} for ${goal?.title}. Future days are closed.`;
  }
  if (selectedIds.length === PROGRESS_GOALS.length) {
    return "Aggregate of selected goals. This calendar logs completions, including unscheduled days.";
  }
  return `Read-only overlap of ${selectedIds.length} goals.`;
}

export function selectedGoals(selectedIds: readonly string[]): ProgressGoalSeed[] {
  return PROGRESS_GOALS.filter((goal) => selectedIds.includes(goal.id));
}

export function milestonePins(selectedIds: readonly string[]) {
  return selectedGoals(selectedIds).flatMap((goal) =>
    (goal.milestones ?? [])
      .map((milestone, index) => ({ milestone, index }))
      .filter(({ milestone }) => milestone.cell !== null)
      .map(({ milestone, index }) => ({
        cell: milestone.cell as number,
        label: milestone.name,
        mark: String(index + 1),
      }))
  );
}
