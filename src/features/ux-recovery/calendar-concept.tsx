"use client";

import { ChevronLeft, ChevronRight, Undo2, X } from "lucide-react";
import { useMemo, useState, type DragEvent } from "react";
import { AgendaHeader, RecoveryChrome } from "@/features/ux-recovery/chrome";
import { getRecoveryConcept } from "@/features/ux-recovery/concepts";
import {
  addDays,
  dateRange,
  dayLabel,
  dayOfMonth,
  formatShort,
  startOfWeek,
  weekdayShort,
} from "@/features/ux-recovery/dates";
import type { Suggestion } from "@/features/ux-recovery/model";
import {
  ActionButton,
  AppliedSummary,
  DatePill,
  DateStrip,
  GoalSwatch,
  Legend,
  missedLabel,
  SessionChip,
  ShiftList,
  StrategyToggle,
} from "@/features/ux-recovery/primitives";
import { projectDays, withoutPreview, type CalendarEntry } from "@/features/ux-recovery/projection";
import { useRecoveryReview, type RecoveryReview } from "@/features/ux-recovery/use-recovery-review";

const concept = getRecoveryConcept("calendar");

export function CalendarConcept() {
  const review = useRecoveryReview("review");
  const { state, plan } = review;
  const thisWeek = startOfWeek(state.today);
  const [weekStart, setWeekStart] = useState(thisWeek);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const visiblePlan = useMemo(
    () => (state.stage === "applied" ? withoutPreview(plan) : plan),
    [state.stage, plan]
  );
  const dates = useMemo(() => dateRange(weekStart, addDays(weekStart, 6)), [weekStart]);
  const days = useMemo(() => projectDays(state.seed, visiblePlan, dates), [state.seed, visiblePlan, dates]);
  const selected = plan.rows.find((row) => row.sessionId === selectedId) ?? null;
  const dragging = plan.rows.find((row) => row.sessionId === draggingId) ?? null;
  const earlier = state.stage === "applied" ? [] : plan.rows.filter((row) => row.missedDate < weekStart);
  const goalOf = (goalId: string) => state.seed.goals.find((goal) => goal.id === goalId);

  const nextPendingAfter = (sessionId: string) => {
    const index = plan.rows.findIndex((row) => row.sessionId === sessionId);
    return plan.rows.slice(index + 1).find((row) => row.status === "pending")?.sessionId ?? null;
  };
  const decideAndAdvance = (sessionId: string, decide: () => void) => {
    const next = nextPendingAfter(sessionId);
    decide();
    setSelectedId(next);
  };
  const startReview = () => {
    setWeekStart(thisWeek);
    setSelectedId(plan.rows.find((row) => row.status === "pending")?.sessionId ?? null);
  };

  const chipFor = (entry: CalendarEntry) => {
    const row = entry.row;
    if (!row || state.stage === "applied") return <SessionChip entry={entry} today={state.today} />;
    const draggable = row.options.some((option) => option.available);
    return (
      <SessionChip
        entry={entry}
        today={state.today}
        selected={row.sessionId === selectedId}
        onSelect={() => setSelectedId(row.sessionId)}
        onDragStart={
          draggable
            ? (event: DragEvent<HTMLElement>) => {
                event.dataTransfer.setData("text/plain", row.sessionId);
                event.dataTransfer.effectAllowed = "move";
                setDraggingId(row.sessionId);
              }
            : undefined
        }
        onDragEnd={() => setDraggingId(null)}
      />
    );
  };

  return (
    <RecoveryChrome concept={concept}>
      <main className="px-4 py-6 pb-[45dvh] md:px-6 md:pb-10">
        <div className="mx-auto max-w-6xl">
          <AgendaHeader>
            <SlimBar review={review} onReview={startReview} />
          </AgendaHeader>

          <div className="mt-4 flex items-center justify-between gap-3">
            <ActionButton tone="ghost" aria-label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              <ChevronLeft aria-hidden className="size-4" />
            </ActionButton>
            <p className="font-display text-lg font-semibold">
              {weekStart === thisWeek ? "This week" : `Week of ${formatShort(weekStart)}`}
              <span className="ml-2 font-mono text-xs font-normal text-[color:var(--rc-muted)]">
                {formatShort(weekStart)} – {formatShort(addDays(weekStart, 6))}
              </span>
            </p>
            <ActionButton tone="ghost" aria-label="Next week" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              <ChevronRight aria-hidden className="size-4" />
            </ActionButton>
          </div>

          <Legend />

          {earlier.length ? (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-[color:var(--rc-amber-line)] p-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--rc-amber)]">
                Slipped earlier
              </p>
              {earlier.map((row) => {
                const goal = goalOf(row.goalId);
                if (!goal) return null;
                const entry: CalendarEntry = {
                  key: `${row.sessionId}:earlier`,
                  sessionId: row.sessionId,
                  goal,
                  label: row.label,
                  kind: "slipped",
                  accepted: row.status !== "pending",
                  counterpart: row.date,
                  row,
                };
                return (
                  <div key={entry.key} className="w-40">
                    {chipFor(entry)}
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-2 md:grid-cols-7 md:gap-0 md:overflow-hidden md:rounded-[14px] md:border md:border-[color:var(--rc-rule)]">
            {dates.map((date) => {
              const option = dragging?.options.find((item) => item.date === date);
              const drop = dragging ? (option?.available ? "valid" : "invalid") : undefined;
              return (
                <div
                  key={date}
                  className={`rc-day flex gap-3 rounded-xl border border-[color:var(--rc-rule)] bg-[color:var(--rc-paper)] p-2 md:block md:min-h-56 md:rounded-none md:border-0 md:border-r ${
                    date < state.today ? "md:bg-black/[0.025]" : ""
                  }`}
                  data-drop={drop}
                  onDragOver={(event) => {
                    if (drop === "valid") event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (dragging && drop === "valid") review.edit(dragging.sessionId, date);
                    setDraggingId(null);
                  }}
                >
                  <p
                    className={`w-14 flex-none text-xs font-semibold md:mb-2 md:w-auto ${
                      date === state.today ? "text-[color:var(--rc-stamp)]" : "text-[color:var(--rc-muted)]"
                    }`}
                  >
                    {weekdayShort(date)} <span className="font-mono">{dayOfMonth(date)}</span>
                    {date === state.today ? <span className="ml-1">· today</span> : null}
                  </p>
                  <ul className="flex min-w-0 flex-1 flex-col gap-1">
                    {(days.get(date) ?? []).map((entry) => (
                      <li key={entry.key}>{chipFor(entry)}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="mt-2 hidden text-xs text-[color:var(--rc-muted)] md:block">
            Drag an amber chip or a dashed ghost onto any highlighted day.
          </p>
        </div>
      </main>

      {selected && state.stage !== "applied" ? (
        <ChipPanel
          key={selected.sessionId}
          row={selected}
          review={review}
          onClose={() => setSelectedId(null)}
          onDecide={(decide) => decideAndAdvance(selected.sessionId, decide)}
        />
      ) : null}
    </RecoveryChrome>
  );
}

function SlimBar({ review, onReview }: { review: RecoveryReview; onReview: () => void }) {
  const { state, prompt, counts } = review;
  if (state.stage === "applied") {
    return (
      <div className="mt-2 rounded-xl border border-[color:var(--rc-rule)] bg-[color:var(--rc-paper)] p-3">
        <AppliedSummary review={review} />
      </div>
    );
  }
  return (
    <div className="sticky top-0 z-20 mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-[color:var(--rc-rule)] bg-[color:var(--rc-paper)] px-3 py-2 text-sm">
      <span aria-hidden className="size-2 rounded-full bg-[color:var(--rc-amber-dot)]" />
      <span className="font-semibold">{prompt.text}</span>
      {prompt.count ? (
        <>
          <button type="button" className="font-semibold underline-offset-4 hover:underline disabled:opacity-40" disabled={!counts.acceptable} onClick={review.acceptAll}>
            Accept all ({counts.acceptable})
          </button>
          <button type="button" className="font-semibold underline-offset-4 hover:underline" onClick={onReview}>
            Review
          </button>
        </>
      ) : null}
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <StrategyToggle compact value={state.strategy} onChange={(strategy) => review.setStrategy(strategy)} label="Default strategy" />
        <ActionButton tone="ghost" onClick={review.undo} disabled={!state.history.length} aria-label="Undo">
          <Undo2 aria-hidden className="size-4" />
        </ActionButton>
        <ActionButton tone="primary" onClick={review.apply} disabled={!counts.decided}>
          Apply{counts.decided ? ` (${counts.decided})` : ""}
        </ActionButton>
      </div>
    </div>
  );
}

function ChipPanel({
  row,
  review,
  onClose,
  onDecide,
}: {
  row: Suggestion;
  review: RecoveryReview;
  onClose: () => void;
  onDecide: (decide: () => void) => void;
}) {
  const { state, plan } = review;
  const [choosing, setChoosing] = useState(false);
  const goalPlan = plan.goals.find((goal) => goal.goal.id === row.goalId);
  if (!goalPlan) return null;
  const { goal } = goalPlan;
  const decided = row.status !== "pending";

  return (
    <aside
      role="dialog"
      aria-label={`${goal.title}: slipped session`}
      className="rc-card rc-rise fixed inset-x-3 bottom-3 z-30 max-h-[60dvh] overflow-y-auto p-4 shadow-[0_16px_40px_rgba(36,28,20,0.2)] md:left-auto md:bottom-6 md:right-6 md:w-[400px]"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 font-display text-lg font-semibold">
            <GoalSwatch color={goal.color} />
            {goal.title}
          </p>
          <p className="text-xs text-[color:var(--rc-muted)]">
            {row.label} · {missedLabel(row)}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full hover:bg-black/5">
          <X aria-hidden className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-[color:var(--rc-muted)]">{row.date ? "Suggested" : "Can’t fit"}</span>
        <DatePill row={row} today={state.today} onClick={row.date ? () => setChoosing((open) => !open) : undefined} />
      </div>
      <p className={`mt-1 text-xs ${row.date ? "text-[color:var(--rc-deep)]" : "text-[color:var(--rc-amber)]"}`}>{row.reason}</p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <StrategyToggle
          compact
          value={goalPlan.requested}
          onChange={(strategy) => review.setStrategy(strategy, goal.id)}
          label={`Strategy for ${goal.title}`}
        />
      </div>
      {goalPlan.note ? <p className="mt-2 text-xs text-[color:var(--rc-amber)]">{goalPlan.note}</p> : null}
      {goalPlan.strategy === "rebalance" ? (
        <ShiftList shifts={goalPlan.shifts} today={state.today} accepted={goalPlan.rows.some((item) => item.status !== "pending")} />
      ) : null}

      {choosing && row.date ? (
        <div className="mt-3">
          <DateStrip
            row={row}
            today={state.today}
            onPick={(date) => {
              setChoosing(false);
              onDecide(() => review.edit(row.sessionId, date));
            }}
          />
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {row.date && !decided ? (
          <ActionButton tone="primary" onClick={() => onDecide(() => review.accept(row.sessionId))}>
            Accept {dayLabel(row.date, state.today)}
          </ActionButton>
        ) : null}
        {decided ? (
          <ActionButton tone="ghost" onClick={() => review.restore(row.sessionId)}>
            Undo accept
          </ActionButton>
        ) : null}
        {row.date ? (
          <ActionButton onClick={() => setChoosing((open) => !open)} aria-expanded={choosing}>
            Choose day
          </ActionButton>
        ) : null}
        <ActionButton tone="ghost" onClick={() => onDecide(() => review.dismiss(row.sessionId))}>
          Let it go
        </ActionButton>
      </div>
    </aside>
  );
}
