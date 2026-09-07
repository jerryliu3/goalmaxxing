"use client";

import { cn } from "@/lib/utils";

export interface ProgressGoalListItem {
  id: string;
  title: string;
  color: string;
  rateLabel: string;
}

export function ProgressGoalList({
  goals,
  selectedGoalIds,
  onToggleGoal,
  readOnly = false,
}: {
  goals: ProgressGoalListItem[];
  selectedGoalIds: ReadonlySet<string>;
  onToggleGoal: (goalId: string) => void;
  readOnly?: boolean;
}) {
  if (goals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No goals match these controls.</p>
    );
  }

  return (
    <ul className="divide-y border-y">
      {goals.map((goal, index) => {
        const selected = selectedGoalIds.has(goal.id);
        return (
          <li key={goal.id}>
            <button
              type="button"
              aria-pressed={selected}
              data-onboarding={index === 0 && !readOnly ? "insights.goal" : undefined}
              disabled={readOnly}
              onClick={() => onToggleGoal(goal.id)}
              className={cn(
                "flex w-full items-center gap-3 py-3 text-left touch-manipulation",
                selected ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <span
                className="size-2.5 shrink-0 rounded-sm border"
                style={{
                  backgroundColor: selected ? goal.color : "transparent",
                  borderColor: goal.color,
                }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {goal.title}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {goal.rateLabel}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
