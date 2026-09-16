"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  ListChecks,
  type LucideIcon,
  NotebookPen,
  Timer,
} from "lucide-react";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { ConceptBrief, DayWorkChrome } from "@/features/ux-day-work/chrome";
import { getDayWorkConcept } from "@/features/ux-day-work/model";
import { PhraseBlock } from "@/features/ux-day-work/primitives";
import {
  cadenceLabel,
  deadlineLabel,
  difficultyLabel,
  periodLabel,
  sittingLabel,
  type DayWorkItem,
} from "@/features/ux-day-work/seed";
import { useDayWorkSession } from "@/features/ux-day-work/session";
import "@/features/ux-day-work/day-work.css";

const concept = getDayWorkConcept("quest-collection");

const EMBLEMS: Record<string, LucideIcon> = {
  "tempo-run": Timer,
  "launch-notes": NotebookPen,
  "weekly-reset": ListChecks,
  "review-offer": Brain,
  strength: Dumbbell,
  "deep-work": BookOpen,
};

export function QuestCollectionConcept() {
  const session = useDayWorkSession("tempo-run");

  return (
    <DayWorkChrome concept={concept}>
      <main className="px-4 py-8 md:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="dw-collection-header">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--dw-muted)]">
                Your quest collection
              </p>
              <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                Choose what moves today.
              </h1>
            </div>
            <p className="font-mono text-sm text-[color:var(--dw-deep)]">
              {session.remaining} open
            </p>
          </header>
          <p className="mt-4 max-w-2xl text-[color:var(--dw-deep)]">
            Every card is readable before it opens: the sitting, rhythm, horizon,
            effort, and period progress stay on the surface. The card expands only
            when you want to change a detail.
          </p>
          <div className="dw-quest-collection mt-9">
            {session.items.map((item) => (
              <QuestCard
                key={item.id}
                item={item}
                open={session.selectedId === item.id}
                onOpen={() => session.toggleOpen(item.id)}
                onComplete={() => session.toggleComplete(item.id)}
              >
                {session.selectedId === item.id ? (
                  <PhraseBlock item={item} session={session} />
                ) : null}
              </QuestCard>
            ))}
          </div>
        </div>
      </main>
      <ConceptBrief concept={concept} />
    </DayWorkChrome>
  );
}

function QuestCard({
  item,
  open,
  onOpen,
  onComplete,
  children,
}: {
  item: DayWorkItem;
  open: boolean;
  onOpen: () => void;
  onComplete: () => void;
  children: ReactNode;
}) {
  const Emblem = EMBLEMS[item.id] ?? Timer;
  const progress = `${item.periodDone} / ${item.periodTarget}`;
  const segments = Math.max(1, item.periodTarget);

  return (
    <article
      className="dw-quest-card"
      data-done={item.completed}
      data-open={open}
      style={{ "--goal-color": item.color } as CSSProperties}
    >
      <div className="dw-quest-art">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">
            {item.categoryLabel}
          </p>
          {item.completed ? <Check aria-hidden className="size-4" /> : null}
        </div>
        <div className="dw-quest-emblem">
          <Emblem aria-hidden className="size-11 stroke-[1.35]" />
        </div>
        <button type="button" className="block w-full text-left" onClick={onOpen}>
          <h2 className="font-display text-3xl font-semibold leading-none tracking-tight">
            {item.title}
          </h2>
        </button>
      </div>
      <div className="dw-quest-body">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--dw-muted)]">
              Today’s contribution
            </p>
            <p className="mt-1 text-lg font-medium leading-tight">
              {item.description ?? "One contribution today"}
            </p>
            <p className="mt-1 text-xs text-[color:var(--dw-muted)]">
              {sittingLabel(item)}
            </p>
          </div>
          <CompletionToggle
            completed={item.completed}
            size="sm"
            aria-label={`Mark ${item.title} complete`}
            onClick={onComplete}
          />
        </div>
        <dl className="mt-4 grid gap-2 text-sm leading-snug">
          <div className="flex justify-between gap-4"><dt>Rhythm</dt><dd>{cadenceLabel(item)}</dd></div>
          <div className="flex justify-between gap-4"><dt>Horizon</dt><dd>{deadlineLabel(item)}</dd></div>
          <div className="flex justify-between gap-4"><dt>Effort</dt><dd>{difficultyLabel(item)}</dd></div>
        </dl>
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 text-xs text-[color:var(--dw-deep)]">
            <span>{periodLabel(item)}</span><span>{progress}</span>
          </div>
          <div className="dw-quest-meter" aria-label={periodLabel(item)}>
            {Array.from({ length: segments }, (_, index) => (
              <span key={index} data-active={index < item.periodDone} />
            ))}
          </div>
        </div>
        <button
          type="button"
          className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium"
          aria-expanded={open}
          onClick={onOpen}
        >
          {open ? "Fold away" : "Details"}
          {open ? <ChevronUp aria-hidden className="size-4" /> : <ChevronDown aria-hidden className="size-4" />}
        </button>
        {children}
      </div>
    </article>
  );
}
