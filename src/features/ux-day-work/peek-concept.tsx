"use client";

import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { ConceptBrief, DayWorkChrome } from "@/features/ux-day-work/chrome";
import { getDayWorkConcept } from "@/features/ux-day-work/model";
import { DayShell, PeekFacts, WorkRow } from "@/features/ux-day-work/primitives";
import { currentInstance, toCreationFields } from "@/features/ux-day-work/seed";
import { useDayWorkSession } from "@/features/ux-day-work/session";
import "@/features/goals/tempo-goal-creation.css";
import "@/features/ux-day-work/day-work.css";

const concept = getDayWorkConcept("peek");

export function PeekConcept() {
  const session = useDayWorkSession("tempo-run");
  const selected = session.selected;

  return (
    <DayWorkChrome concept={concept}>
      <main className="px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--dw-muted)]">
            Inspect · list stays, card arrives
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Keep the day. Bring the object beside it.
          </h1>
          <p className="mt-4 max-w-xl text-[color:var(--dw-deep)]">
            The creation card is the inspect face. Facts sit next to it as
            type, not fields. On a phone the same card sheets up; the list is
            still there when you put it down.
          </p>
          <div className="mt-8 grid items-start gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <DayShell remaining={session.remaining}>
              {session.items.map((item) => (
                <WorkRow
                  key={item.id}
                  item={item}
                  open={session.selectedId === item.id}
                  onOpen={() => session.select(item.id)}
                  onComplete={() => session.toggleComplete(item.id)}
                />
              ))}
            </DayShell>
            {selected ? (
              <aside className="dw-peek-sheet p-4 sm:p-5" aria-label={`${selected.title} peek`}>
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
                  <TempoGoalCard
                    fields={toCreationFields(selected)}
                    context="history"
                    isTask={selected.kind === "task"}
                    taskSchedule={{
                      date: currentInstance(selected).short,
                      time: selected.time ?? "",
                    }}
                  />
                  <PeekFacts item={selected} session={session} />
                </div>
              </aside>
            ) : (
              <p className="rounded-[1.25rem] border border-dashed border-[color:var(--dw-rule)] px-5 py-16 text-center text-sm text-[color:var(--dw-muted)]">
                Select a row to peek the goal.
              </p>
            )}
          </div>
        </div>
      </main>
      <ConceptBrief concept={concept} />
    </DayWorkChrome>
  );
}
