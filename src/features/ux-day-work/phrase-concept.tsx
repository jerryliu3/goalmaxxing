"use client";

import { ConceptBrief, DayWorkChrome } from "@/features/ux-day-work/chrome";
import { getDayWorkConcept } from "@/features/ux-day-work/model";
import { DayShell, PhraseBlock, WorkRow } from "@/features/ux-day-work/primitives";
import { useDayWorkSession } from "@/features/ux-day-work/session";
import "@/features/ux-day-work/day-work.css";

const concept = getDayWorkConcept("phrase");

export function PhraseConcept() {
  const session = useDayWorkSession("tempo-run");

  return (
    <DayWorkChrome concept={concept}>
      <main className="px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--dw-muted)]">
            Inspect · language as the control
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            A sentence you can revise.
          </h1>
          <p className="mt-4 max-w-xl text-[color:var(--dw-deep)]">
            No card, no dashed box. Opening Tempo run writes what the goal is.
            Tap “3 days a week” or “until Dec 31” and only that phrase becomes a
            choice.
          </p>
          <div className="mt-8">
            <DayShell remaining={session.remaining}>
              {session.items.map((item) => (
                <WorkRow
                  key={item.id}
                  item={item}
                  open={session.selectedId === item.id}
                  onOpen={() => session.toggleOpen(item.id)}
                  onComplete={() => session.toggleComplete(item.id)}
                >
                  {session.selectedId === item.id ? (
                    <PhraseBlock item={item} session={session} />
                  ) : null}
                </WorkRow>
              ))}
            </DayShell>
          </div>
        </div>
      </main>
      <ConceptBrief concept={concept} />
    </DayWorkChrome>
  );
}
