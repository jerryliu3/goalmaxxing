"use client";

import { ChevronLeft } from "lucide-react";
import { dateMove, formatDay } from "@/features/ux-recovery/dates";
import type { Shift, Suggestion } from "@/features/ux-recovery/model";
import { ActionButton } from "@/features/ux-recovery/primitives";
import {
  DecisionView,
  GoalHeading,
  MoveLine,
  type HoverHandler,
} from "@/features/ux-recovery/review-list";
import { recap, recapCounts, type RecapCounts } from "@/features/ux-recovery/review-state";
import type { RecoveryReview } from "@/features/ux-recovery/use-recovery-review";

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

/** Sheet eyebrow and title for the recap: proposal (unsaved) vs summary (saved). */
export function recapHeading(review: RecoveryReview): { eyebrow: string; title: string } {
  if (review.state.rebalance) return { eyebrow: "Auto-rebalance · not saved yet", title: "Proposed new dates" };
  const { left } = recapCounts(review.state, review.plan);
  return { eyebrow: "Summary", title: left ? "The rest can wait." : "Your plan is back on track." };
}

function countsLine(counts: RecapCounts, proposing: boolean): string {
  const saved = [
    counts.moved ? `${counts.moved} moved` : null,
    counts.shifted ? `${plural(counts.shifted, "later session")} shifted` : null,
    counts.letGo ? `${counts.letGo} let go` : null,
  ].filter(Boolean);
  const parts = [
    saved.length ? `Saved: ${saved.join(" · ")}.` : proposing ? null : "Nothing changed yet.",
    proposing
      ? `Apply rebalance moves ${plural(counts.proposedMoves, "session")}${
          counts.proposedShifts ? ` and shifts ${plural(counts.proposedShifts, "later session")}` : ""
        }.`
      : null,
    counts.left ? `${counts.left} left for later.` : null,
  ];
  return parts.filter(Boolean).join(" ");
}

/**
 * Every change this review made, grouped by goal, old → new: moved, shifted by
 * a rebalance, let go, and left for later — each saved change with its Undo.
 * Under Auto-rebalance the open rows show their proposed dates instead, dashed
 * and labelled, until Apply rebalance saves them.
 */
export function ReviewRecap({ review, onHover }: { review: RecoveryReview; onHover?: HoverHandler }) {
  const { state, plan } = review;
  const proposing = state.rebalance;
  const groups = recap(state, plan);

  return (
    <div>
      <p className="text-sm text-[color:var(--rc-deep)]" role="status">
        {countsLine(recapCounts(state, plan), proposing)}
      </p>
      {groups.map((group) => (
        <section
          key={group.goal.id}
          aria-label={`${group.goal.title} changes`}
          className="mt-4 border-t border-[color:var(--rc-rule)] pt-3"
        >
          <GoalHeading goal={group.goal} />
          {group.note ? <p className="mt-1 text-xs text-[color:var(--rc-amber)]">{group.note}</p> : null}
          <ul className="divide-y divide-[color:var(--rc-rule)]/60">
            {group.items.map((item) =>
              item.type === "decided" ? (
                <DecisionView key={item.decision.id} decision={item.decision} review={review} onHover={onHover} />
              ) : (
                <OpenRecapRow key={item.row.sessionId} row={item.row} review={review} proposing={proposing} />
              )
            )}
          </ul>
          <ProposedShifts shifts={group.shifts} />
        </section>
      ))}
    </div>
  );
}

/** A row still open: proposed (Auto-rebalance) or left for later, with a way back to it. */
function OpenRecapRow({
  row,
  review,
  proposing,
}: {
  row: Suggestion;
  review: RecoveryReview;
  proposing: boolean;
}) {
  if (proposing && row.date) {
    return (
      <li className="flex items-center gap-2 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{row.label}</p>
          <p className="font-mono text-xs">{dateMove(row.missedDate, row.date)}</p>
        </div>
        <span className="inline-flex min-h-7 flex-none items-center rounded-full border-[1.5px] border-dashed border-[color:var(--rc-ink)] px-2.5 text-[11px] font-semibold">
          Proposed
        </span>
      </li>
    );
  }
  return (
    <li className="flex items-center gap-2 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{row.label}</p>
        <p className="text-xs text-[color:var(--rc-muted)]">
          Missed {formatDay(row.missedDate)} ·{" "}
          <span className={row.date ? "" : "text-[color:var(--rc-amber)]"}>
            {row.date ? `suggested ${formatDay(row.date)}` : "no day left"}
          </span>
        </p>
        <p className="mt-0.5 text-xs font-semibold text-[color:var(--rc-amber)]">Left for later</p>
      </div>
      <ActionButton
        tone="ghost"
        className="flex-none"
        onClick={() => review.goTo(row.goalId)}
        aria-label={`Review ${row.label} missed ${formatDay(row.missedDate)}`}
      >
        Review
      </ActionButton>
    </li>
  );
}

function ProposedShifts({ shifts }: { shifts: Shift[] }) {
  if (!shifts.length) return null;
  return (
    <div className="mt-2 rounded-xl border border-dashed border-[color:var(--rc-rule)] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--rc-muted)]">
        Would also shift
      </p>
      <ul className="mt-1 space-y-0.5">
        {shifts.map((shift) => (
          <MoveLine key={shift.sessionId} label={shift.label} from={shift.from} to={shift.to} note="proposed" proposed />
        ))}
      </ul>
    </div>
  );
}

/** Proposal: Apply rebalance or go back to one goal at a time. Summary: Back or Done. */
export function RecapActions({ review }: { review: RecoveryReview }) {
  const { state, plan } = review;
  if (state.rebalance) {
    const { proposedMoves } = recapCounts(state, plan);
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ActionButton onClick={() => review.setRebalance(false)}>
          <ChevronLeft aria-hidden className="size-4" />
          One goal at a time
        </ActionButton>
        <ActionButton tone="primary" disabled={!proposedMoves} onClick={review.applyRebalance}>
          Apply rebalance
        </ActionButton>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <ActionButton tone="ghost" disabled={!state.steps.length} onClick={review.back}>
        <ChevronLeft aria-hidden className="size-4" />
        Back
      </ActionButton>
      <ActionButton tone="primary" onClick={review.close}>
        Done
      </ActionButton>
    </div>
  );
}
