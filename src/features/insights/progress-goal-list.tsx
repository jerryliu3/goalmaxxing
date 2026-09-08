"use client";

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
  readOnly = false,
}: {
  goals: ProgressGoalListItem[];
  selectedGoalIds: ReadonlySet<string>;
  onToggleGoal: (goalId: string) => void;
  onSelectOnly?: (goalId: string) => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
  readOnly?: boolean;
}) {
  if (goals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No goals match these controls.</p>
    );
  }

  const showListActions = Boolean(onSelectAll || onClearAll) && !readOnly;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">
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
        className={cn(
          "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-col md:overflow-x-visible md:overflow-y-auto md:px-0",
          goals.length >= VERTICAL_LIST_MAX_ITEMS &&
            "md:max-h-[calc(9.5*2.75rem+9*0.5rem)]"
        )}
      >
        {goals.map((goal, index) => {
          const selected = selectedGoalIds.has(goal.id);
          return (
            <li key={goal.id} className="group relative min-w-[10.5rem] shrink-0 md:min-w-0">
              <button
                type="button"
                aria-pressed={selected}
                data-onboarding={index === 0 && !readOnly ? "insights.goal" : undefined}
                disabled={readOnly}
                onClick={() => onToggleGoal(goal.id)}
                className={cn(
                  "flex min-h-11 w-full flex-col items-start rounded-[10px] border px-3 py-2 text-left touch-manipulation",
                  selected
                    ? "border-primary/40 bg-primary/15 text-foreground"
                    : "border-border text-foreground"
                )}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: goal.color }}
                      aria-hidden
                    />
                    <span className="truncate text-sm font-semibold">{goal.title}</span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-[10px] text-muted-foreground transition-opacity duration-150 group-hover:opacity-0 group-focus-within:opacity-0",
                      selected && "max-md:opacity-0"
                    )}
                  >
                    {goal.rateLabel}
                  </span>
                </span>
              </button>
              {onSelectOnly && !readOnly ? (
                <button
                  type="button"
                  className="absolute top-1/2 right-2 z-10 -translate-y-1/2 text-[10px] font-semibold text-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100"
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
