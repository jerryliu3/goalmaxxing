"use client";

import { Check, ListChecks } from "lucide-react";
import { useMemo, useState } from "react";
import { AgendaHeader, RecoveryChrome } from "@/features/ux-recovery/chrome";
import { getRecoveryConcept } from "@/features/ux-recovery/concepts";
import {
  addDays,
  dateRange,
  dayLabel,
  formatDay,
  formatShort,
  startOfWeek,
  type IsoDate,
} from "@/features/ux-recovery/dates";
import type { RecoveryGoal } from "@/features/ux-recovery/model";
import { onlyGoal, projectDays, type CalendarEntry } from "@/features/ux-recovery/projection";
import { ActionButton, goalStyle, ReviewEntry } from "@/features/ux-recovery/primitives";
import { GoalStep, ReviewToolbar, StepNav, type HoverHandler } from "@/features/ux-recovery/review-list";
import { recapHeading, RecapActions, ReviewRecap } from "@/features/ux-recovery/review-recap";
import { useRecoveryReview, type RecoveryReview } from "@/features/ux-recovery/use-recovery-review";

const concept = getRecoveryConcept("goal-view");

/** Cards a closed lane shows, like Goal View's next sessions back to back. */
const CLOSED_LANE_CARDS = 8;

interface LaneCard {
  date: IsoDate;
  entry: CalendarEntry;
}

/**
 * A lightweight mock of Goal View's lanes (Cards layout, the default): one row
 * per goal, its label pinned left, upcoming sessions back to back. Past
 * sessions are not shown — until Review, when the open lane brings its
 * slipped sessions in ahead of today. Same reducer and rows as Goal by goal:
 * the open lane is the current step, and the recap sits above the lanes.
 */
export function GoalViewConcept() {
  const review = useRecoveryReview();
  const { state, plan, prompt, goalId: openId, recapOpen } = review;
  const [hovered, setHovered] = useState<string | null>(null);
  const preview = useMemo(
    () => (openId ? onlyGoal(plan, openId) : recapOpen && state.rebalance ? plan : null),
    [plan, openId, recapOpen, state.rebalance]
  );

  const lanes = useMemo(() => {
    const dates = dateRange(startOfWeek(addDays(state.today, -21)), state.seed.horizonEnd);
    const days = projectDays(state.seed, preview, dates, state.reviewing);
    const byGoal = new Map<string, LaneCard[]>();
    for (const date of dates) {
      for (const entry of days.get(date) ?? []) {
        const shown = date < state.today ? entry.kind === "slipped" : entry.kind !== "past" && entry.kind !== "let-go";
        if (!shown) continue;
        byGoal.set(entry.goal.id, [...(byGoal.get(entry.goal.id) ?? []), { date, entry }]);
      }
    }
    return state.seed.goals.map((goal) => ({ goal, cards: byGoal.get(goal.id) ?? [] }));
  }, [state.seed, state.today, state.reviewing, preview]);
  const heading = recapOpen ? recapHeading(review) : null;

  return (
    <RecoveryChrome concept={concept}>
      <main className="px-4 py-6 pb-24 md:px-6">
        <div className="mx-auto max-w-6xl">
          <AgendaHeader>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
              <p className="font-display text-lg">
                October 2026 <span className="text-sm text-[color:var(--rc-muted)]">· Goals lens</span>
              </p>
              {state.reviewing ? (
                <ActionButton tone="primary" onClick={review.close}>
                  Done
                </ActionButton>
              ) : (
                <ReviewEntry prompt={prompt} onReview={review.open} />
              )}
            </div>
          </AgendaHeader>
          {state.reviewing ? (
            <div className="mt-4 max-w-xl">
              <ReviewToolbar review={review} />
              {recapOpen ? null : (
                <ActionButton className="mt-2" onClick={review.showRecap}>
                  <ListChecks aria-hidden className="size-4" />
                  Summary
                </ActionButton>
              )}
            </div>
          ) : null}
          {heading ? (
            <section aria-label="Recovery summary" className="rc-card rc-rise mt-4 max-w-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--rc-muted)]">
                {heading.eyebrow}
              </p>
              <h2 className="mt-0.5 font-display text-2xl font-semibold tracking-tight">{heading.title}</h2>
              <div className="mt-2">
                <ReviewRecap review={review} onHover={setHovered} />
              </div>
              <div className="mt-4 border-t border-[color:var(--rc-rule)] pt-3">
                <RecapActions review={review} />
              </div>
            </section>
          ) : null}

          <div className="rc-card mt-4 overflow-hidden" aria-label="Goal lanes">
            {lanes.map(({ goal, cards }) => {
              const open = goal.id === openId;
              return (
                <GoalLane
                  key={goal.id}
                  goal={goal}
                  cards={open ? cards : cards.slice(0, CLOSED_LANE_CARDS)}
                  marker={state.reviewing && state.steps.includes(goal.id)}
                  slipped={plan.rows.filter((row) => row.goalId === goal.id).length}
                  open={open}
                  quiet={Boolean(openId) && !open}
                  today={state.today}
                  highlightId={hovered}
                  review={review}
                  onHover={setHovered}
                />
              );
            })}
          </div>
          <p className="mt-2 text-xs text-[color:var(--rc-muted)]">
            Mock of Goal View’s Cards layout. Calendar, paging and the phone goal deck are left out.
          </p>
        </div>
      </main>
    </RecoveryChrome>
  );
}

function GoalLane({
  goal,
  cards,
  marker,
  slipped,
  open,
  quiet,
  today,
  highlightId,
  review,
  onHover,
}: {
  goal: RecoveryGoal;
  cards: LaneCard[];
  /** While reviewing, every goal that had slips keeps its marker — "N slipped", then "All set". */
  marker: boolean;
  /** Rows still open for this goal. */
  slipped: number;
  open: boolean;
  quiet: boolean;
  today: IsoDate;
  highlightId: string | null;
  review: RecoveryReview;
  onHover: HoverHandler;
}) {
  const past = cards.filter((card) => card.date < today);
  const upcoming = cards.filter((card) => card.date >= today);
  return (
    <section
      aria-label={`${goal.title} lane`}
      className={`border-b border-[color:var(--rc-rule)] transition-opacity last:border-b-0 ${quiet ? "opacity-55 hover:opacity-100" : ""}`}
    >
      <div className="flex">
        <div
          className="flex w-[116px] flex-none flex-col justify-center gap-1 border-r border-l-[3px] border-r-[color:var(--rc-rule)] px-2.5 py-2 sm:w-[184px]"
          style={{ borderLeftColor: goal.color }}
        >
          <strong className="line-clamp-2 font-display text-[15px] font-normal leading-tight">{goal.title}</strong>
          <small className="text-[10px] text-[color:var(--rc-muted)]">
            {goal.window.end ? `Through ${formatShort(goal.window.end)}, ${goal.window.end.slice(0, 4)}` : "Ongoing"}
          </small>
          {marker ? (
            <button
              type="button"
              onClick={() => review.goTo(goal.id)}
              aria-expanded={open}
              aria-label={`${goal.title}: ${slipped ? `${slipped} slipped` : "all set"}`}
              className={`mt-0.5 inline-flex min-h-7 w-fit items-center gap-1.5 rounded-full border px-2 text-[11px] font-semibold ${
                open
                  ? "border-[color:var(--rc-amber)] bg-[color:var(--rc-amber-wash)]"
                  : "border-[color:var(--rc-amber-line)] hover:bg-[color:var(--rc-amber-wash)]"
              }`}
            >
              {slipped ? (
                <>
                  <span aria-hidden className="size-1.5 rounded-full bg-[color:var(--rc-amber-dot)]" />
                  {slipped} slipped
                </>
              ) : (
                <>
                  <Check aria-hidden className="size-3 text-[color:var(--rc-gain)]" />
                  All set
                </>
              )}
            </button>
          ) : null}
        </div>
        <ol className="flex min-w-0 flex-1 items-stretch gap-3 overflow-x-auto p-2.5" aria-label={`${goal.short} sessions`}>
          {past.map((card) => (
            <LaneCardView key={card.entry.key} card={card} today={today} highlighted={card.entry.sessionId === highlightId} />
          ))}
          {past.length ? (
            <li
              aria-hidden
              className="flex-none self-stretch border-l-2 border-[color:var(--rc-stamp)] pl-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--rc-stamp)]"
            >
              Today
            </li>
          ) : null}
          {upcoming.map((card) => (
            <LaneCardView key={card.entry.key} card={card} today={today} highlighted={card.entry.sessionId === highlightId} />
          ))}
          {cards.length === 0 ? (
            <li className="self-center px-1 text-sm text-[color:var(--rc-muted)]">No upcoming sessions.</li>
          ) : null}
        </ol>
      </div>
      {open ? (
        <div className="rc-rise border-t border-dashed border-[color:var(--rc-amber-line)] bg-[color:var(--rc-page)] px-4 py-3 sm:pl-[196px]">
          <div className="max-w-xl">
            <GoalStep goalId={goal.id} review={review} onHover={onHover} heading={false} />
            <div className="mt-3">
              <StepNav review={review} />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

const CARD_NOTE: Partial<Record<CalendarEntry["kind"], (entry: CalendarEntry, today: IsoDate) => string>> = {
  slipped: (entry, today) => (entry.counterpart ? `Slipped → ${dayLabel(entry.counterpart, today)}` : "Slipped · no day left"),
  suggested: (entry, today) => `Suggested · from ${dayLabel(entry.counterpart ?? "", today)}`,
  "shift-from": (entry) => `Shifts → ${formatShort(entry.counterpart ?? "")}`,
  "shift-to": (entry) => `Shifted · from ${formatShort(entry.counterpart ?? "")}`,
  recovered: (entry) => `Moved · from ${formatShort(entry.counterpart ?? "")}`,
};

/** Goal View's session card: the date leads, the title sits small above it. */
function LaneCardView({ card, today, highlighted }: { card: LaneCard; today: IsoDate; highlighted: boolean }) {
  const { entry, date } = card;
  const note = CARD_NOTE[entry.kind]?.(entry, today);
  return (
    <li
      className="rc-chip rc-lane-card"
      style={goalStyle(entry.goal.color)}
      data-kind={entry.kind}
      data-moving={entry.kind === "slipped" && entry.counterpart !== null}
      data-selected={highlighted}
      data-today={date === today}
      title={`${entry.label} · ${formatDay(date)}${note ? ` · ${note}` : ""}`}
    >
      <span className="flex w-full items-center gap-1 text-[10.5px] text-[color:var(--rc-deep)]">
        {entry.kind === "done" ? <Check aria-hidden className="size-3 text-[color:var(--rc-gain)]" /> : null}
        <span className="truncate">{entry.label}</span>
      </span>
      <span className="rc-chip-label font-display text-[16px] leading-5 tracking-tight">{formatDay(date)}</span>
      <span className="truncate text-[10px] text-[color:var(--rc-muted)]">{note ?? (date === today ? "Today" : "")}</span>
    </li>
  );
}
