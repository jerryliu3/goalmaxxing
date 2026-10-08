"use client";

import { Check } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { toStyleDisplayColor } from "@/features/planner/goal-visuals";
import { cn } from "@/lib/utils";

export interface ProgressGoalListItem {
  id: string;
  title: string;
  color: string;
  rateLabel: string;
  /** 0–1 toward the goal's target, or null when it has no fixed target. */
  progress?: number | null;
}

const COLLAPSED_ITEM_COUNT = 8;

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
  const [expanded, setExpanded] = useState(false);
  if (goals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No goals match these controls.</p>
    );
  }

  const showListActions = Boolean(onSelectAll || onClearAll);
  const collapsible = goals.length > COLLAPSED_ITEM_COUNT + 1;
  const shownGoals = collapsible && !expanded ? goals.slice(0, COLLAPSED_ITEM_COUNT) : goals;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="type-heading text-sm">
          Selected goals ({selectedGoalIds.size})
        </h2>
        {showListActions ? (
          <div className="flex items-center gap-3">
            {onSelectAll ? (
              <button
                type="button"
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                onClick={onSelectAll}
              >
                Select all
              </button>
            ) : null}
            {onClearAll ? (
              <button
                type="button"
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                onClick={onClearAll}
              >
                Clear all
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <ul data-testid="progress-goal-list" className="-mx-2 flex flex-col">
        {shownGoals.map((goal, index) => {
          const selected = selectedGoalIds.has(goal.id);
          const color = toStyleDisplayColor(goal.color);
          return (
            <li key={goal.id} className="group relative min-w-0">
              <button
                type="button"
                aria-pressed={selected}
                title={goal.title}
                data-onboarding={index === 0 && onboarding ? "insights.goal" : undefined}
                onClick={() => onToggleGoal(goal.id)}
                style={{ "--goal-color": color } as CSSProperties}
                className={cn(
                  "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors touch-manipulation hover:bg-muted/60 md:min-h-10",
                  selected ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <span
                  aria-hidden
                  data-goal-check
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-[5px] border-[1.5px] border-(--goal-color) transition-colors",
                    selected ? "bg-(--goal-color) text-white" : "bg-transparent"
                  )}
                >
                  {selected ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate type-item text-sm leading-snug">{goal.title}</span>
                  {goal.progress != null ? (
                    <span aria-hidden className="mt-1 block h-1 overflow-hidden rounded-full bg-muted">
                      <span
                        data-goal-progress
                        className={cn("block h-full rounded-full bg-(--goal-color)", !selected && "opacity-50")}
                        style={{ width: `${Math.round(Math.min(1, Math.max(0, goal.progress)) * 100)}%` }}
                      />
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 type-figure text-[11px] text-muted-foreground transition-opacity duration-150 md:group-hover:opacity-0 md:group-focus-within:opacity-0">
                  {goal.rateLabel}
                </span>
              </button>
              {onSelectOnly ? (
                <button
                  type="button"
                  className="absolute top-1/2 right-2 z-10 hidden -translate-y-1/2 text-[11px] font-semibold text-foreground underline underline-offset-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 md:inline"
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
      {collapsible ? (
        <button
          type="button"
          aria-expanded={expanded}
          className="mt-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show fewer" : `Show all ${goals.length} goals`}
        </button>
      ) : null}
    </div>
  );
}
