"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AgendaHeader, RecoveryChrome } from "@/features/ux-recovery/chrome";
import { getRecoveryConcept } from "@/features/ux-recovery/concepts";
import { dayLabel, formatDay } from "@/features/ux-recovery/dates";
import type { GoalPlan, Strategy, Suggestion } from "@/features/ux-recovery/model";
import {
  ActionButton,
  AppliedSummary,
  DateStrip,
  EntryPrompt,
  GoalSwatch,
  ShiftList,
  StrategyToggle,
} from "@/features/ux-recovery/primitives";
import { useRecoveryReview, type RecoveryReview } from "@/features/ux-recovery/use-recovery-review";

const concept = getRecoveryConcept("deck");

type Step = { kind: "decision" } | { kind: "skip"; sessionId: string };

export function DeckConcept() {
  const review = useRecoveryReview("entry");
  const { state, plan, prompt } = review;
  const [skipped, setSkipped] = useState<string[]>([]);
  const [trail, setTrail] = useState<Step[]>([]);

  const queue = plan.rows.filter((row) => row.status === "pending" && !skipped.includes(row.sessionId));
  const current = queue[0] ?? null;
  const total = plan.rows.length + plan.dismissedIds.length;

  const decide = (action: () => void) => {
    action();
    setTrail((steps) => [...steps, { kind: "decision" }]);
  };
  const skip = (sessionId: string) => {
    setSkipped((ids) => [...ids, sessionId]);
    setTrail((steps) => [...steps, { kind: "skip", sessionId }]);
  };
  const back = () => {
    const last = trail[trail.length - 1];
    if (!last) return;
    setTrail((steps) => steps.slice(0, -1));
    if (last.kind === "decision") review.undo();
    else setSkipped((ids) => ids.filter((id) => id !== last.sessionId));
  };
  /** Strategy changes are undoable decisions too, but only when they change something. */
  const setStrategy = (strategy: Strategy, goalId?: string) => {
    const currentValue = goalId ? (state.decisions.strategyByGoal[goalId] ?? state.strategy) : state.strategy;
    const hasOverrides = Object.keys(state.decisions.strategyByGoal).length > 0;
    if (strategy === currentValue && (goalId || !hasOverrides)) return;
    decide(() => review.setStrategy(strategy, goalId));
  };

  return (
    <RecoveryChrome concept={concept}>
      <main className="px-4 py-6 pb-12 md:px-6">
        <div className="mx-auto max-w-2xl">
          <AgendaHeader>
            <EntryPrompt prompt={prompt} onReview={review.open} />
          </AgendaHeader>

          {state.stage === "entry" ? (
            <p className="mt-10 text-center text-sm text-[color:var(--rc-muted)]">
              The rest of today’s Agenda sits here. Review opens the deck.
            </p>
          ) : null}

          {state.stage === "applied" ? (
            <div className="rc-card mt-6 p-5">
              <AppliedSummary review={review} />
            </div>
          ) : null}

          {state.stage === "review" ? (
            <>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[color:var(--rc-deep)]">Default for every card</p>
                <StrategyToggle value={state.strategy} onChange={(strategy) => setStrategy(strategy)} label="Default strategy" />
              </div>
              <Progress total={total} left={queue.length} />
              {current ? (
                <DeckCard
                  key={current.sessionId}
                  row={current}
                  goalPlan={plan.goals.find((goal) => goal.goal.id === current.goalId)}
                  review={review}
                  onDecide={decide}
                  onSkip={() => skip(current.sessionId)}
                  onStrategy={setStrategy}
                />
              ) : (
                <DeckSummary review={review} skipped={skipped} onDecide={decide} onRevisit={() => setSkipped([])} />
              )}
              <div className="mt-3 flex justify-between">
                <ActionButton tone="ghost" onClick={back} disabled={!trail.length}>
                  <ArrowLeft aria-hidden className="size-4" />
                  Back
                </ActionButton>
                <ActionButton tone="ghost" onClick={review.close}>
                  Close
                </ActionButton>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </RecoveryChrome>
  );
}

function Progress({ total, left }: { total: number; left: number }) {
  const done = total - left;
  return (
    <div className="mt-4" aria-label={`${done} of ${total} reviewed`}>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={`h-1 flex-1 rounded-full ${index < done ? "bg-[color:var(--rc-ink)]" : "bg-[color:var(--rc-rule)]"}`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-[color:var(--rc-muted)]">
        {left ? `${left} to go` : "All reviewed"}
      </p>
    </div>
  );
}

function DeckCard({
  row,
  goalPlan,
  review,
  onDecide,
  onSkip,
  onStrategy,
}: {
  row: Suggestion;
  goalPlan: GoalPlan | undefined;
  review: RecoveryReview;
  onDecide: (action: () => void) => void;
  onSkip: () => void;
  onStrategy: (strategy: Strategy, goalId?: string) => void;
}) {
  const [picking, setPicking] = useState(false);
  if (!goalPlan) return null;
  const { goal } = goalPlan;
  const today = review.state.today;
  const rebalancing = goalPlan.requested === "rebalance";

  return (
    <article className="rc-card rc-rise mt-4 p-5 sm:p-6" aria-label={`${goal.title}: ${row.label}`}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <GoalSwatch color={goal.color} />
        {goal.title}
        <span className="font-normal text-[color:var(--rc-muted)]">· {goal.target}</span>
      </p>
      <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
        <span className="line-through decoration-[color:var(--rc-amber-dot)] decoration-2">{formatDay(row.missedDate)}</span>
        <ArrowRight aria-hidden className="mx-2 inline size-6 align-middle text-[color:var(--rc-muted)]" />
        {row.date ? formatDay(row.date) : <span className="text-[color:var(--rc-amber)]">no day left</span>}
      </h2>
      <p className="mt-1 text-sm text-[color:var(--rc-deep)]">{row.label} slipped. {row.reason}</p>

      <div className="mt-4">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--rc-muted)]">
          {picking ? "Pick a day" : "Days left in the window"}
        </p>
        <DateStrip
          row={row}
          today={today}
          limit={picking ? undefined : 7}
          onPick={
            picking
              ? (date) => {
                  setPicking(false);
                  onDecide(() => review.edit(row.sessionId, date));
                }
              : undefined
          }
        />
      </div>

      <label className="mt-4 flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl bg-[color:var(--rc-page)] px-3 text-sm">
        <span>
          <span className="font-semibold">Rebalance this goal</span>
          <span className="block text-xs text-[color:var(--rc-muted)]">Spread its remaining sessions evenly instead</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          className="size-5 accent-[color:var(--rc-ink)]"
          checked={rebalancing}
          onChange={(event) => onStrategy(event.target.checked ? "rebalance" : "squeeze", goal.id)}
        />
      </label>
      {goalPlan.note ? <p className="mt-2 text-xs text-[color:var(--rc-amber)]">{goalPlan.note}</p> : null}
      {goalPlan.strategy === "rebalance" ? <ShiftList shifts={goalPlan.shifts} today={today} /> : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {row.date ? (
          <ActionButton tone="primary" onClick={() => onDecide(() => review.accept(row.sessionId))}>
            Accept {dayLabel(row.date, today)}
          </ActionButton>
        ) : null}
        {row.date ? (
          <ActionButton onClick={() => setPicking((open) => !open)} aria-expanded={picking}>
            Pick another day
          </ActionButton>
        ) : null}
        <ActionButton tone="ghost" onClick={() => onDecide(() => review.dismiss(row.sessionId))}>
          Let it go
        </ActionButton>
        <ActionButton tone="ghost" onClick={onSkip}>
          Later
        </ActionButton>
      </div>
    </article>
  );
}

function DeckSummary({
  review,
  skipped,
  onDecide,
  onRevisit,
}: {
  review: RecoveryReview;
  skipped: string[];
  onDecide: (action: () => void) => void;
  onRevisit: () => void;
}) {
  const { state, plan, counts } = review;
  const today = state.today;
  const decided = plan.rows.filter((row) => row.status !== "pending");
  const later = plan.rows.filter((row) => skipped.includes(row.sessionId) && row.status === "pending");
  const shifted = plan.goals.filter(
    (goal) => goal.strategy === "rebalance" && goal.rows.some((row) => row.status !== "pending")
  );
  const describe = (sessionId: string) => {
    const session = state.seed.sessions.find((item) => item.id === sessionId);
    const goal = state.seed.goals.find((item) => item.id === session?.goalId);
    return `${goal?.short ?? ""} · ${session?.label ?? ""}`;
  };

  return (
    <section className="rc-card rc-rise mt-4 p-5 sm:p-6" aria-label="Review summary">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--rc-muted)]">
        Before anything changes
      </p>
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Here’s the new plan.</h2>
      <SummaryList title="Moving" empty="Nothing yet.">
        {decided.map((row) => (
          <li key={row.sessionId}>
            {describe(row.sessionId)}: <span className="line-through opacity-60">{dayLabel(row.missedDate, today)}</span> →{" "}
            <span className="font-semibold">{row.date ? dayLabel(row.date, today) : ""}</span>
          </li>
        ))}
      </SummaryList>
      {shifted.map((goal) => (
        <ShiftList key={goal.goal.id} shifts={goal.shifts} today={today} accepted />
      ))}
      {plan.dismissedIds.length ? (
        <SummaryList title="Letting go" empty="">
          {plan.dismissedIds.map((id) => (
            <li key={id}>{describe(id)} — stays missed, no more reminders</li>
          ))}
        </SummaryList>
      ) : null}
      {later.length ? (
        <SummaryList title="Left for later" empty="">
          {later.map((row) => (
            <li key={row.sessionId}>{describe(row.sessionId)} — you’ll see it again</li>
          ))}
        </SummaryList>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <ActionButton tone="primary" onClick={review.apply} disabled={!counts.decided}>
          Apply{counts.decided ? ` (${counts.decided})` : ""}
        </ActionButton>
        {counts.acceptable ? (
          <ActionButton onClick={() => onDecide(review.acceptAll)}>Accept the rest ({counts.acceptable})</ActionButton>
        ) : null}
        {later.length ? (
          <ActionButton tone="ghost" onClick={onRevisit}>
            Revisit later ones
          </ActionButton>
        ) : null}
      </div>
    </section>
  );
}

function SummaryList({ title, empty, children }: { title: string; empty: string; children: ReactNode[] }) {
  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--rc-muted)]">{title}</h3>
      {children.length ? (
        <ul className="mt-1 space-y-0.5 text-sm">{children}</ul>
      ) : (
        <p className="mt-1 text-sm text-[color:var(--rc-muted)]">{empty}</p>
      )}
    </div>
  );
}
