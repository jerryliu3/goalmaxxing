"use client";

import type { CSSProperties, ReactNode } from "react";
import { Check, ChevronDown, ChevronUp, Link2, Lock } from "lucide-react";
import { CompletionTitle } from "@/components/ui/completion-title";
import { getGoalVisual } from "@/features/planner/goal-visuals";
import type { WorkQuestModel } from "@/features/planner/work-quest-model";
import { cn } from "@/lib/utils";
import "@/features/planner/work-quest-card.css";

export function WorkQuestCard({
  quest,
  open,
  onOpen,
  completeControl,
  children,
  dragHandle,
}: {
  quest: WorkQuestModel;
  open: boolean;
  onOpen?: () => void;
  completeControl?: ReactNode;
  children?: ReactNode;
  dragHandle?: {
    ref?: (node: HTMLElement | null) => void;
    attributes?: Record<string, unknown>;
    listeners?: Record<string, unknown>;
    style?: CSSProperties;
    className?: string;
  };
}) {
  const visual = getGoalVisual({
    goalId: quest.id,
    color: quest.color,
    category: quest.categoryLabel,
  });
  const Emblem = visual.Icon;
  const segments = Math.max(1, quest.periodTarget ?? 0);
  const showMeter = quest.periodTarget != null && quest.periodTarget > 0;
  const periodSummary =
    quest.periodDone != null && quest.periodTarget != null
      ? `${quest.periodDone} of ${quest.periodTarget}${
          quest.periodScopeLabel ? ` ${quest.periodScopeLabel}` : ""
        }`
      : null;
  const hasExpandedFacts = Boolean(
    quest.contribution ||
      quest.cadenceLabel ||
      quest.horizonLabel ||
      quest.effort ||
      quest.isPrivate ||
      children
  );

  return (
    <article
      ref={dragHandle?.ref}
      className={cn("work-quest-card", dragHandle?.className)}
      data-plan-work-row="quest"
      data-open={open}
      data-done={quest.completed}
      style={
        {
          "--goal-color": quest.color,
          ...dragHandle?.style,
        } as CSSProperties
      }
      aria-current={open ? "true" : undefined}
      {...(dragHandle?.attributes ?? {})}
      {...(dragHandle?.listeners ?? {})}
    >
        <div className="work-quest-art">
          <div className="flex items-start justify-between gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {quest.categoryLabel}
            </p>
            {quest.completed ? <Check aria-hidden className="size-3.5" /> : null}
          </div>
          <div className="work-quest-emblem">
            <Emblem aria-hidden className="size-7 stroke-[1.4]" />
          </div>
          {onOpen ? (
            <button
              type="button"
              className="block w-full text-left"
              onClick={(event) => {
                event.stopPropagation();
                onOpen();
              }}
            >
              <h2 className="font-display text-lg font-semibold leading-tight tracking-tight">
                <CompletionTitle completed={quest.completed}>{quest.title}</CompletionTitle>
              </h2>
            </button>
          ) : (
            <h2 className="font-display text-lg font-semibold leading-tight tracking-tight">
              <CompletionTitle completed={quest.completed}>{quest.title}</CompletionTitle>
            </h2>
          )}
        </div>
        <div className="work-quest-body">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Today
              </p>
              <p className="mt-0.5 text-sm font-medium leading-snug">{quest.sittingLabel}</p>
              {periodSummary ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{periodSummary}</p>
              ) : null}
              {quest.linked || quest.locked ? (
                <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                  {quest.linked ? (
                    <Link2 className="size-3" aria-label="Links this subgoal to a main goal" />
                  ) : null}
                  {quest.locked ? <Lock className="size-3" aria-label="Locked" /> : null}
                </div>
              ) : null}
            </div>
            {completeControl}
          </div>
          {showMeter ? (
            <div className="work-quest-meter" aria-hidden>
              {Array.from({ length: segments }, (_, index) => (
                <span
                  key={index}
                  data-active={quest.periodDone != null && index < quest.periodDone}
                />
              ))}
            </div>
          ) : null}
          {hasExpandedFacts && onOpen ? (
            <button
              type="button"
              className="mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-medium"
              aria-expanded={open}
              onClick={(event) => {
                event.stopPropagation();
                onOpen();
              }}
            >
              {open ? "Fold away" : "Details"}
              {open ? (
                <ChevronUp aria-hidden className="size-4" />
              ) : (
                <ChevronDown aria-hidden className="size-4" />
              )}
            </button>
          ) : null}
          {open ? (
            <div className="mt-3 space-y-3">
              {quest.contribution ? (
                <p className="text-sm leading-snug">{quest.contribution}</p>
              ) : null}
              <dl className="grid gap-1.5 text-sm leading-snug">
                {quest.cadenceLabel ? (
                  <div className="flex justify-between gap-4">
                    <dt>Rhythm</dt>
                    <dd>{quest.cadenceLabel}</dd>
                  </div>
                ) : null}
                {quest.horizonLabel ? (
                  <div className="flex justify-between gap-4">
                    <dt>Horizon</dt>
                    <dd>{quest.horizonLabel}</dd>
                  </div>
                ) : null}
                {quest.effort ? (
                  <div className="flex justify-between gap-4">
                    <dt>Effort</dt>
                    <dd>{quest.effort.label}</dd>
                  </div>
                ) : null}
                {quest.isPrivate ? (
                  <div className="flex justify-between gap-4">
                    <dt>Privacy</dt>
                    <dd>Private</dd>
                  </div>
                ) : null}
              </dl>
              {children}
            </div>
          ) : null}
        </div>
    </article>
  );
}
