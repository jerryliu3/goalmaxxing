"use client";

import { ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { AgendaHeader, RecoveryChrome } from "@/features/ux-recovery/chrome";
import { getRecoveryConcept } from "@/features/ux-recovery/concepts";
import { addDays, startOfWeek } from "@/features/ux-recovery/dates";
import { MonthGrid } from "@/features/ux-recovery/month-grid";
import { windowLabel, type GoalPlan, type Suggestion } from "@/features/ux-recovery/model";
import {
  ActionButton,
  AppliedSummary,
  DatePill,
  DateStrip,
  EntryPrompt,
  GoalSwatch,
  Legend,
  missedLabel,
  ReviewFooter,
  ShiftList,
  StrategyToggle,
} from "@/features/ux-recovery/primitives";
import { withoutPreview } from "@/features/ux-recovery/projection";
import { useRecoveryReview, type RecoveryReview } from "@/features/ux-recovery/use-recovery-review";

const concept = getRecoveryConcept("ledger");

export function LedgerConcept() {
  const review = useRecoveryReview("entry");
  const { state, plan, prompt } = review;
  const sheetOpen = state.stage !== "entry";
  // Last week through the end of the planned month.
  const gridFrom = startOfWeek(addDays(state.today, -7));

  return (
    <RecoveryChrome concept={concept}>
      <main className={`px-4 py-6 md:px-6 ${sheetOpen ? "pb-[70dvh] lg:pb-10" : "pb-10"}`}>
        <div className="mx-auto max-w-6xl">
          <AgendaHeader>
            <EntryPrompt prompt={prompt} onReview={review.open} />
          </AgendaHeader>
          <div className={`mt-5 grid items-start gap-5 ${sheetOpen ? "lg:grid-cols-[minmax(0,1fr)_420px]" : ""}`}>
            <div className="min-w-0">
              <Legend />
              <MonthGrid
                seed={state.seed}
                plan={state.stage === "review" ? plan : withoutPreview(plan)}
                today={state.today}
                from={gridFrom}
                weeks={5}
              />
            </div>
            {sheetOpen ? <LedgerSheet review={review} /> : null}
          </div>
        </div>
      </main>
    </RecoveryChrome>
  );
}

function LedgerSheet({ review }: { review: RecoveryReview }) {
  const { state, plan } = review;
  const [editing, setEditing] = useState<string | null>(null);
  const toggleEdit = (sessionId: string) => setEditing((open) => (open === sessionId ? null : sessionId));
  const sessionById = (id: string) => state.seed.sessions.find((session) => session.id === id);
  const goalTitle = (goalId: string | undefined) => state.seed.goals.find((goal) => goal.id === goalId)?.short;

  return (
    <aside
      role="dialog"
      aria-label="Review slipped sessions"
      className="rc-rise fixed inset-x-0 bottom-0 z-30 flex max-h-[72dvh] flex-col rounded-t-2xl border-t border-[color:var(--rc-rule)] bg-[color:var(--rc-paper)] shadow-[0_-16px_40px_rgba(36,28,20,0.18)] lg:sticky lg:top-4 lg:bottom-auto lg:left-auto lg:right-auto lg:z-auto lg:max-h-[calc(100dvh-2rem)] lg:rounded-2xl lg:border lg:shadow-none"
    >
      <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--rc-muted)]">
            Nothing changes until you apply
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Slipped sessions</h2>
        </div>
        {state.stage === "review" ? (
          <button
            type="button"
            onClick={review.close}
            aria-label="Close review"
            className="grid size-9 place-items-center rounded-full hover:bg-black/5"
          >
            <X aria-hidden className="size-4" />
          </button>
        ) : null}
      </div>

      {state.stage === "applied" ? (
        <div className="px-4 pb-5">
          <AppliedSummary review={review} />
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[color:var(--rc-page)] p-2.5">
              <p className="text-xs text-[color:var(--rc-deep)]">Default for every goal</p>
              <StrategyToggle
                value={state.strategy}
                onChange={(strategy) => review.setStrategy(strategy)}
                label="Default strategy"
              />
            </div>
            {plan.goals.map((goalPlan) => (
              <LedgerGoal
                key={goalPlan.goal.id}
                goalPlan={goalPlan}
                review={review}
                editing={editing}
                onToggleEdit={toggleEdit}
                onEdited={() => setEditing(null)}
              />
            ))}
            {plan.dismissedIds.length ? (
              <section className="mt-5 border-t border-[color:var(--rc-rule)] pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--rc-muted)]">
                  Letting go
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {plan.dismissedIds.map((id) => {
                    const session = sessionById(id);
                    return (
                      <li key={id} className="flex items-center justify-between gap-2">
                        <span className="text-[color:var(--rc-deep)] line-through">
                          {goalTitle(session?.goalId)} · {session?.label}
                        </span>
                        <ActionButton tone="ghost" onClick={() => review.restore(id)}>
                          Keep
                        </ActionButton>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}
            {plan.rows.length === 0 && !plan.dismissedIds.length ? (
              <p className="mt-6 text-sm text-[color:var(--rc-muted)]">Nothing slipped. You’re on plan.</p>
            ) : null}
          </div>
          <div className="border-t border-[color:var(--rc-rule)] p-3">
            <ReviewFooter review={review} />
          </div>
        </>
      )}
    </aside>
  );
}

function LedgerGoal({
  goalPlan,
  review,
  editing,
  onToggleEdit,
  onEdited,
}: {
  goalPlan: GoalPlan;
  review: RecoveryReview;
  editing: string | null;
  onToggleEdit: (sessionId: string) => void;
  onEdited: () => void;
}) {
  const { goal } = goalPlan;
  const custom = review.state.decisions.strategyByGoal[goal.id] !== undefined;
  const anyAccepted = goalPlan.rows.some((row) => row.status !== "pending");
  return (
    <section className="mt-5 border-t border-[color:var(--rc-rule)] pt-4" aria-label={goal.title}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold leading-tight">
            <GoalSwatch color={goal.color} />
            {goal.title}
          </h3>
          <p className="mt-0.5 text-xs text-[color:var(--rc-muted)]">
            {goal.target} · {windowLabel(goalPlan)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <StrategyToggle
            compact
            value={goalPlan.requested}
            onChange={(strategy) => review.setStrategy(strategy, goal.id)}
            label={`Strategy for ${goal.title}`}
          />
          {custom ? <span className="text-[10px] text-[color:var(--rc-muted)]">Just this goal</span> : null}
        </div>
      </div>
      {goalPlan.note ? <p className="mt-2 text-xs text-[color:var(--rc-amber)]">{goalPlan.note}</p> : null}
      <ul className="divide-y divide-[color:var(--rc-rule)]/60">
        {goalPlan.rows.map((row) => (
          <LedgerRow
            key={row.sessionId}
            row={row}
            review={review}
            editing={editing === row.sessionId}
            onToggleEdit={() => onToggleEdit(row.sessionId)}
            onEdited={onEdited}
          />
        ))}
      </ul>
      {goalPlan.strategy === "rebalance" ? (
        <ShiftList shifts={goalPlan.shifts} today={review.state.today} accepted={anyAccepted} />
      ) : null}
    </section>
  );
}

function LedgerRow({
  row,
  review,
  editing,
  onToggleEdit,
  onEdited,
}: {
  row: Suggestion;
  review: RecoveryReview;
  editing: boolean;
  onToggleEdit: () => void;
  onEdited: () => void;
}) {
  const today = review.state.today;
  const decided = row.status !== "pending";
  return (
    <li className="py-3">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{row.label}</p>
          <p className="text-xs text-[color:var(--rc-muted)]">{missedLabel(row)}</p>
        </div>
        <ArrowRight aria-hidden className="size-4 flex-none text-[color:var(--rc-muted)]" />
        <DatePill row={row} today={today} onClick={row.date ? onToggleEdit : undefined} />
      </div>
      <p className={`mt-1 text-xs leading-snug ${row.date ? "text-[color:var(--rc-deep)]" : "text-[color:var(--rc-amber)]"}`}>
        {row.reason}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {row.date && !decided ? (
          <ActionButton tone="primary" onClick={() => review.accept(row.sessionId)}>
            Accept
          </ActionButton>
        ) : null}
        {decided ? (
          <ActionButton tone="ghost" onClick={() => review.restore(row.sessionId)}>
            {row.status === "edited" ? "Undo pick" : "Undo accept"}
          </ActionButton>
        ) : null}
        {row.date ? (
          <ActionButton onClick={onToggleEdit} aria-expanded={editing}>
            Edit
          </ActionButton>
        ) : null}
        <ActionButton tone="ghost" onClick={() => review.dismiss(row.sessionId)}>
          Let it go
        </ActionButton>
      </div>
      {editing && row.date ? (
        <div className="mt-2">
          <DateStrip
            row={row}
            today={today}
            onPick={(date) => {
              review.edit(row.sessionId, date);
              onEdited();
            }}
          />
        </div>
      ) : null}
    </li>
  );
}
