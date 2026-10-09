"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { panelClass } from "@/components/ui/panel";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { cn } from "@/lib/utils";
import { RecoveryGoalStep } from "@/features/planner/recovery/recovery-goal-step";
import { RecoverySummary, RecoverySummaryActions } from "@/features/planner/recovery/recovery-summary";
import { summaryCounts, summaryHeading } from "@/features/planner/recovery/review-state";
import type { RecoveryReview } from "@/features/planner/recovery/use-recovery-review";

function RebalanceToggle({ review }: { review: RecoveryReview }) {
  const { state } = review;
  return (
    <div className="rounded-xl bg-muted p-2">
      <ToggleSwitch
        checked={state.rebalanced !== null}
        onChange={review.setRebalance}
        disabled={review.saving}
        title="Also respace each goal's later sessions evenly"
      >
        Auto-rebalance
      </ToggleSwitch>
      <p className="px-2 pb-1 pt-1 text-[11px] leading-snug text-muted-foreground">
        {state.rebalanced
          ? "Every goal’s later sessions respace evenly, and sessions with no day left are let go. Nothing saves until you press Save."
          : "Only the missed session moves. Nothing saves until you press Save."}
      </p>
    </div>
  );
}

/** Back · Next goal. Next goal is always there; from the last goal it opens the summary. */
function StepNav({ review }: { review: RecoveryReview }) {
  const { state, plan, goalId } = review;
  const last = state.step >= state.steps.length - 1;
  const open = plan.rows.some((row) => row.goalId === goalId);
  return (
    <div className="flex items-center justify-between gap-2">
      <Button variant="ghost" className="h-9 rounded-full px-3.5" disabled={state.step === 0} onClick={review.back}>
        <ChevronLeft aria-hidden />
        Back
      </Button>
      <Button variant={open ? "outline" : "default"} className="h-9 rounded-full px-3.5" onClick={review.next}>
        {last ? "Summary" : "Next goal"}
        <ChevronRight aria-hidden />
      </Button>
    </div>
  );
}

/**
 * Recovery mode's suggestions, goal by goal. A side column on desktop, no
 * taller than the calendar beside it or the screen; on smaller screens a short
 * sheet resting on the recovery bar so the calendar stays visible above it,
 * taller on the summary where the list is the point. Hiding it leaves
 * recovery mode on; the bar brings it back.
 */
export function RecoveryReviewPanel({ review }: { review: RecoveryReview }) {
  const { state, goalId, goals } = review;
  if (!state.reviewing || !review.suggestionsOpen) return null;
  const goal = goalId ? goals.find((item) => item.id === goalId) : undefined;
  const heading = goal
    ? { eyebrow: `Goal ${state.step + 1} of ${state.steps.length}`, title: goal.title }
    : summaryHeading(summaryCounts(review.changes, review.plan));

  return (
    <aside
      aria-label="Recovery suggestions"
      data-testid="recovery-review-panel"
      className={cn(
        panelClass,
        // Rests on the floating recovery bar; the shadow lifts upward so it never smudges the bar.
        "fixed inset-x-3 bottom-[calc(var(--plan-action-bar-bottom)+var(--plan-action-bar-height)+0.5rem)] z-[60] flex flex-col shadow-[0_-8px_28px_rgb(0_0_0/0.12)] md:inset-x-auto md:left-1/2 md:w-full md:max-w-2xl md:-translate-x-1/2 lg:sticky lg:top-4 lg:bottom-auto lg:left-auto lg:z-auto lg:max-h-[min(100%,calc(100dvh-2rem))] lg:max-w-none lg:translate-x-0 lg:shadow-none",
        goal ? "max-h-[42dvh]" : "max-h-[70dvh]"
      )}
    >
      <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-3 lg:pt-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {heading.eyebrow}
          </p>
          <h2 className="type-title mt-0.5 truncate text-xl tracking-tight lg:text-2xl">{heading.title}</h2>
        </div>
        <Button
          variant="ghost"
          size="icon-round"
          onClick={() => review.setSuggestionsOpen(false)}
          aria-label="Hide suggestions"
        >
          <X aria-hidden />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <RebalanceToggle review={review} />
        <div className="mt-3">
          {goal ? <RecoveryGoalStep goalId={goal.id} review={review} /> : <RecoverySummary review={review} />}
        </div>
      </div>
      <div className="border-t border-border p-3">
        {goal ? <StepNav review={review} /> : <RecoverySummaryActions review={review} />}
      </div>
    </aside>
  );
}
