"use client";

import type { CSSProperties, ReactNode } from "react";
import { Check, ChevronDown, ChevronUp, Star } from "lucide-react";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { ConceptBrief, DayWorkChrome } from "@/features/ux-day-work/chrome";
import { getDayWorkConcept } from "@/features/ux-day-work/model";
import { PhraseBlock } from "@/features/ux-day-work/primitives";
import {
  cadenceLabel,
  deadlineLabel,
  periodLabel,
  type DayWorkItem,
} from "@/features/ux-day-work/seed";
import { useDayWorkSession } from "@/features/ux-day-work/session";
import "@/features/ux-day-work/day-work.css";

const concept = getDayWorkConcept("sticker-album");

export function StickerAlbumConcept() {
  const session = useDayWorkSession("tempo-run");

  return (
    <DayWorkChrome concept={concept}>
      <main className="px-4 py-8 md:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="dw-collection-header">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--dw-muted)]">
                Today’s album
              </p>
              <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                A day worth keeping.
              </h1>
            </div>
            <p className="font-mono text-sm text-[color:var(--dw-deep)]">
              {session.remaining} open
            </p>
          </header>
          <p className="mt-4 max-w-2xl text-[color:var(--dw-deep)]">
            A scrollable collection of commitments. Every sticker shows its rhythm,
            horizon, and period progress before you open it. Complete it from the
            mark; unfold it when you want the whole brief.
          </p>
          <div className="dw-sticker-album mt-9">
            {session.items.map((item) => (
              <Sticker
                key={item.id}
                item={item}
                open={session.selectedId === item.id}
                onOpen={() => session.toggleOpen(item.id)}
                onComplete={() => session.toggleComplete(item.id)}
              >
                {session.selectedId === item.id ? (
                  <PhraseBlock item={item} session={session} />
                ) : null}
              </Sticker>
            ))}
          </div>
        </div>
      </main>
      <ConceptBrief concept={concept} />
    </DayWorkChrome>
  );
}

function Sticker({
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
  return (
    <article
      className="dw-sticker"
      data-done={item.completed}
      data-open={open}
      style={{ "--goal-color": item.color } as CSSProperties}
    >
      <span className="dw-tape" aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">
          {item.categoryLabel}
          {item.private ? " · Private" : ""}
        </p>
        <Star aria-hidden className="size-4" />
      </div>
      <button type="button" className="mt-5 block w-full text-left" onClick={onOpen}>
        <h2 className="font-display text-3xl font-semibold leading-none tracking-tight">
          {item.title}
        </h2>
      </button>
      <p className="mt-5 border-b border-current/40 pb-1 text-lg font-medium">
        {item.description ?? "One contribution today"}
      </p>
      <dl className="mt-4 space-y-1.5 text-sm leading-snug">
        <div>
          <dt className="sr-only">Rhythm</dt>
          <dd>{cadenceLabel(item)}</dd>
        </div>
        <div>
          <dt className="sr-only">Deadline</dt>
          <dd>{deadlineLabel(item)}</dd>
        </div>
        <div>
          <dt className="sr-only">Progress</dt>
          <dd>{periodLabel(item)}</dd>
        </div>
      </dl>
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          className="dw-sticker-open inline-flex min-h-11 items-center gap-1.5 text-sm font-medium"
          aria-expanded={open}
          onClick={onOpen}
        >
          {open ? "Fold away" : "Unfold"}
          {open ? <ChevronUp aria-hidden className="size-4" /> : <ChevronDown aria-hidden className="size-4" />}
        </button>
        <CompletionToggle
          completed={item.completed}
          size="sm"
          aria-label={`Mark ${item.title} complete`}
          onClick={onComplete}
        />
      </div>
      {item.completed ? (
        <span className="dw-sticker-stamp">
          <Check aria-hidden className="size-4" /> Done
        </span>
      ) : null}
      {children}
    </article>
  );
}
