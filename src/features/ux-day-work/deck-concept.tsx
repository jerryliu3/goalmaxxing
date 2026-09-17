"use client";

import { motion, useReducedMotion } from "motion/react";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { ConceptBrief, DayWorkChrome } from "@/features/ux-day-work/chrome";
import { getDayWorkConcept } from "@/features/ux-day-work/model";
import { PeekFacts } from "@/features/ux-day-work/primitives";
import {
  currentInstance,
  periodLabel,
  toCreationFields,
} from "@/features/ux-day-work/seed";
import { useDayWorkSession } from "@/features/ux-day-work/session";
import "@/features/goals/tempo-goal-creation.css";
import "@/features/ux-day-work/day-work.css";

const concept = getDayWorkConcept("deck");

export function DeckConcept() {
  const session = useDayWorkSession("tempo-run");
  const reducedMotion = useReducedMotion();
  const front = session.selected ?? session.items[0];
  const remaining = session.items.filter((item) => !item.completed);
  const spine = session.items;

  function completeFront() {
    if (!front) return;
    session.toggleComplete(front.id);
    const next = remaining.find((item) => item.id !== front.id);
    if (next) session.select(next.id);
  }

  if (!front) return null;

  return (
    <DayWorkChrome concept={concept}>
      <main className="px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--dw-muted)]">
            Replace · a hand of commitments
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Today is a deck you work through.
          </h1>
          <p className="mt-4 max-w-xl text-[color:var(--dw-deep)]">
            The same Tempo card from creation, now the unit of the day. The
            spine keeps every title visible so a stack never hides the set.
          </p>
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
            <nav className="dw-spine" aria-label="Today’s cards">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--dw-muted)]">
                {session.remaining} still in hand
              </p>
              <ul className="mt-3 space-y-1">
                {spine.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-current={item.id === front.id ? "true" : undefined}
                      className="flex w-full items-center justify-between rounded-full px-3 py-2 text-left text-sm"
                      onClick={() => session.select(item.id)}
                    >
                      <span className={item.completed ? "opacity-45 line-through" : undefined}>
                        {item.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mx-auto w-full max-w-lg">
              <div className="tempo-stack">
                <motion.div
                  key={front.id}
                  className="tempo-stack-front"
                  drag={!reducedMotion ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.25}
                  onDragEnd={(_, info) => {
                    if (Math.abs(info.offset.x) < 55) return;
                    const index = session.items.findIndex((item) => item.id === front.id);
                    const next = session.items[index + (info.offset.x < 0 ? 1 : -1)];
                    if (next) session.select(next.id);
                  }}
                  initial={reducedMotion ? false : { opacity: 0.55, rotateY: -8, x: 18 }}
                  animate={{ opacity: 1, rotateY: 0, x: 0 }}
                  transition={{ type: "spring", stiffness: 230, damping: 25 }}
                >
                  <TempoGoalCard
                    fields={toCreationFields(front)}
                    context="history"
                    rotatable={false}
                    isTask={front.kind === "task"}
                    taskSchedule={{
                      date: currentInstance(front).short,
                      time: front.time ?? "",
                    }}
                  />
                </motion.div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="text-sm text-[color:var(--dw-deep)]">{periodLabel(front)}</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {front.completed ? "Done" : "Mark this sitting"}
                  </span>
                  <CompletionToggle
                    completed={front.completed}
                    size="lg"
                    aria-label={`Mark ${front.title} complete`}
                    onClick={completeFront}
                  />
                </div>
              </div>
              <div className="mt-5 rounded-[1.1rem] border border-[color:var(--dw-rule)] bg-[color:var(--dw-paper)] p-4">
                <PeekFacts item={front} session={session} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <ConceptBrief concept={concept} />
    </DayWorkChrome>
  );
}
