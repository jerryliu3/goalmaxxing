"use client";

import type { CSSProperties, ReactNode } from "react";
import { getGoalVisual } from "@/features/planner/goal-visuals";
import type { WorkQuestModel } from "@/features/planner/work-quest-model";
import { cn } from "@/lib/utils";
import "@/features/planner/work-quest-card.css";

/**
 * Expanded inspect for a checklist item. The collapsed state is the checklist
 * row itself, so this card has no fold control of its own.
 */
export function WorkQuestCard({
  quest,
  leadingNav,
  trailingNav,
  children,
  goalCard,
}: {
  quest: WorkQuestModel;
  leadingNav?: ReactNode;
  trailingNav?: ReactNode;
  children?: ReactNode;
  goalCard?: ReactNode;
}) {
  const Emblem = getGoalVisual({
    goalId: quest.id,
    color: quest.color,
    category: quest.categoryLabel,
  }).Icon;

  return (
    <article
      className="work-quest-card"
      data-plan-work-quest="true"
      data-done={quest.completed}
      data-has-card={Boolean(goalCard)}
      style={{ "--goal-color": quest.color } as CSSProperties}
    >
      <div className="work-quest-header">
        <Emblem aria-hidden className="mx-auto size-5 stroke-[1.6]" />
        <div className="work-quest-header-row">
          <div className="flex min-w-0 items-center gap-0.5">{leadingNav}</div>
          <h3 className="min-w-0 truncate text-center font-display text-sm font-semibold leading-tight">
            {quest.title}
          </h3>
          <div className="flex min-w-0 items-center justify-end gap-0.5">
            {trailingNav}
          </div>
        </div>
      </div>
      <div className="work-quest-body" data-has-card={Boolean(goalCard)}>
        {goalCard && <div className="work-quest-material">{goalCard}</div>}
        <div className="min-w-0">
          <dl className="grid gap-2 text-sm leading-snug">
            {quest.cadenceLabel ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Cadence</dt>
                <dd className="text-right">{quest.cadenceLabel}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Deadline</dt>
              <dd className="text-right">{quest.deadlineLabel}</dd>
            </div>
          </dl>
          {quest.progress && !goalCard ? (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{quest.progress.label}</span>
              </div>
              <div
                className="work-quest-progress"
                role="progressbar"
                aria-label={quest.progress.label}
                aria-valuemin={0}
                aria-valuemax={quest.progress.target}
                aria-valuenow={quest.progress.completed}
              >
                <span
                  style={
                    {
                      "--quest-progress": `${Math.min(
                        100,
                        (quest.progress.completed / quest.progress.target) * 100
                      )}%`,
                    } as CSSProperties
                  }
                />
              </div>
            </div>
          ) : null}
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </article>
  );
}

/** A keyword inside the quest sentence that opens an editor for that one fact. */
export function QuestFact({
  active,
  pressed,
  disabled = false,
  onSelect,
  children,
}: {
  active?: boolean;
  pressed?: boolean;
  disabled?: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-sm underline decoration-dotted underline-offset-4",
        "hover:decoration-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active ? "decoration-solid text-primary" : "text-foreground",
        disabled && "cursor-not-allowed text-muted-foreground no-underline"
      )}
      aria-expanded={active}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onSelect}
    >
      {children}
    </button>
  );
}
