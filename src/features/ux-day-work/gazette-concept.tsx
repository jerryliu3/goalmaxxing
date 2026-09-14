"use client";

import type { CSSProperties, ReactNode } from "react";
import { ConceptBrief, DayWorkChrome } from "@/features/ux-day-work/chrome";
import { getDayWorkConcept } from "@/features/ux-day-work/model";
import { PhraseBlock } from "@/features/ux-day-work/primitives";
import {
  cadenceLabel,
  currentInstance,
  deadlineLabel,
  periodLabel,
  timeLabel,
  type DayWorkItem,
} from "@/features/ux-day-work/seed";
import { useDayWorkSession } from "@/features/ux-day-work/session";
import "@/features/ux-day-work/day-work.css";

const concept = getDayWorkConcept("gazette");

export function GazetteConcept() {
  const session = useDayWorkSession("tempo-run");
  const lead = session.items[0];
  const rest = session.items.slice(1);

  return (
    <DayWorkChrome concept={concept}>
      <main className="px-4 py-8 md:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="dw-masthead">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--dw-muted)]">
                The Thursday Gazette
              </p>
              <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
                September 3, 2026
              </h1>
            </div>
            <p className="font-mono text-sm text-[color:var(--dw-deep)]">
              {session.remaining} still in type
            </p>
          </header>
          <p className="mt-4 max-w-xl text-[color:var(--dw-deep)]">
            Today’s work as a spread. Kickers carry category. Dek lines carry
            cadence and deadline. Opening an article writes the rest; a stamp
            marks done.
          </p>
          <div className="dw-gazette-grid mt-8">
            <Article
              item={lead}
              open={session.selectedId === lead.id}
              featured
              onOpen={() => session.toggleOpen(lead.id)}
              onComplete={() => session.toggleComplete(lead.id)}
            >
              {session.selectedId === lead.id ? (
                <PhraseBlock item={lead} session={session} />
              ) : null}
            </Article>
            {rest.map((item) => (
              <Article
                key={item.id}
                item={item}
                open={session.selectedId === item.id}
                onOpen={() => session.toggleOpen(item.id)}
                onComplete={() => session.toggleComplete(item.id)}
              >
                {session.selectedId === item.id ? (
                  <PhraseBlock item={item} session={session} />
                ) : null}
              </Article>
            ))}
          </div>
        </div>
      </main>
      <ConceptBrief concept={concept} />
    </DayWorkChrome>
  );
}

function Article({
  item,
  open,
  featured = false,
  onOpen,
  onComplete,
  children,
}: {
  item: DayWorkItem;
  open: boolean;
  featured?: boolean;
  onOpen: () => void;
  onComplete: () => void;
  children?: ReactNode;
}) {
  const instance = currentInstance(item);
  return (
    <article
      className="dw-article"
      data-open={open}
      data-done={item.completed}
      style={{ "--goal-color": item.color } as CSSProperties}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--dw-muted)]">
          {item.categoryLabel}
          {item.kind === "task" ? " · Task" : ""}
          {item.unplaced ? " · Unplaced" : ""}
        </p>
        <button
          type="button"
          className="dw-stamp-mark"
          aria-pressed={item.completed}
          aria-label={item.completed ? `${item.title} stamped done` : `Stamp ${item.title} done`}
          onClick={onComplete}
        >
          {item.completed ? "Done" : "Mark"}
        </button>
      </div>
      <button type="button" className="mt-3 block w-full text-left" onClick={onOpen}>
        <h2
          className={`font-display font-semibold tracking-tight ${
            featured ? "text-4xl sm:text-5xl" : "text-2xl"
          }`}
        >
          {item.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--dw-deep)]">
          {cadenceLabel(item)} · {deadlineLabel(item)} ·{" "}
          {item.unplaced ? "needs a day" : instance.weekday}
          {item.time ? ` · ${timeLabel(item)}` : ""}
        </p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[color:var(--dw-muted)]">
          {periodLabel(item)}
        </p>
      </button>
      {children}
    </article>
  );
}
