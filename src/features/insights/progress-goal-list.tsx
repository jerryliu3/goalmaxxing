"use client";

import { toStyleDisplayColor } from "@/features/planner/goal-visuals";
import { cn } from "@/lib/utils";

export interface ProgressGoalListItem {
  id: string;
  title: string;
  color: string;
  rateLabel: string;
}

const VERTICAL_LIST_MAX_ITEMS = 10;

export function ProgressGoalList({
  goals,
  selectedGoalIds,
  onToggleGoal,
  onSelectOnly,
  onSelectAll,
  onClearAll,
  onboarding = false,
}: {
  goals: ProgressGoalListItem[];
  selectedGoalIds: ReadonlySet<string>;
  onToggleGoal: (goalId: string) => void;
  onSelectOnly?: (goalId: string) => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
  onboarding?: boolean;
}) {
  if (goals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No goals match these controls.</p>
    );
  }

  const showListActions = Boolean(onSelectAll || onClearAll);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold">
          Goals ({selectedGoalIds.size})
        </h2>
        {showListActions ? (
          <div className="flex items-center gap-3">
            {onSelectAll ? (
              <button
                type="button"
                className="text-xs font-semibold text-muted-foreground"
                onClick={onSelectAll}
              >
                Select all
              </button>
            ) : null}
            {onClearAll ? (
              <button
                type="button"
                className="text-xs font-semibold text-muted-foreground"
                onClick={onClearAll}
              >
                Clear all
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <ul
        data-testid="progress-goal-list"
        className={cn(
          "grid auto-cols-[minmax(calc(50vw-1.25rem),13.5rem)] grid-flow-col grid-rows-2 gap-2 overflow-x-auto pb-1 md:mx-0 md:auto-cols-[minmax(10.5rem,13.5rem)] md:flex md:flex-col md:overflow-x-visible md:overflow-y-auto md:px-0 md:pb-0",
          goals.length >= VERTICAL_LIST_MAX_ITEMS &&
            "md:max-h-[calc(9.5*2.75rem+9*0.5rem)]"
        )}
      >
        {goals.map((goal, index) => {
          const selected = selectedGoalIds.has(goal.id);
          return (
            <li key={goal.id} className="group relative min-w-0">
              <button
                type="button"
                aria-pressed={selected}
                data-onboarding={index === 0 && onboarding ? "insights.goal" : undefined}
                onClick={() => onToggleGoal(goal.id)}
                className={cn(
                  "flex min-h-10 w-full items-center rounded-[10px] border px-2 py-2 text-left touch-manipulation md:min-h-9 md:px-2.5 md:py-1.5",
                  selected
                    ? "border-primary/40 bg-primary/15 text-foreground"
                    : "border-border text-foreground"
                )}
              >
                <span className="flex w-full min-w-0 items-center gap-1.5 md:justify-between md:gap-2">
                  <span className="flex min-w-0 flex-1 items-center gap-1.5 md:gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: toStyleDisplayColor(goal.color) }}
                      aria-hidden
                    />
                    <span
                      className="min-w-0 flex-1 font-display text-xs font-medium tracking-tight leading-snug line-clamp-2 md:truncate md:leading-normal"
                    >
                      {goal.title}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "hidden shrink-0 font-mono text-[10px] text-muted-foreground transition-opacity duration-150 md:inline group-hover:opacity-0 group-focus-within:opacity-0"
                    )}
                  >
                    {goal.rateLabel}
                  </span>
                </span>
              </button>
              {onSelectOnly ? (
                <button
                  type="button"
                  className="absolute top-1/2 right-2 z-10 hidden -translate-y-1/2 text-[10px] font-semibold text-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 md:inline"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectOnly(goal.id);
                    event.currentTarget.blur();
                  }}
                >
                  Only
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
