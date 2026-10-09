"use client";

import { ArrowRight, CalendarRange, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_ACTION_BUTTON_CLASS, PlanActionBar } from "@/features/planner/plan-action-bar";
import { recoveryPromptText } from "@/lib/planner/recovery/model";
import { RECOVERY_BLOCKED_NOTE, type RecoveryReview } from "@/features/planner/recovery/use-recovery-review";

const toggleClass =
  "size-9 rounded-full px-0 sm:w-auto sm:px-3 aria-pressed:bg-recover/15 aria-pressed:text-foreground aria-pressed:ring-1 aria-pressed:ring-recover aria-pressed:ring-inset";

/**
 * Recovery mode's bar: what is left, the suggestions and calendar toggles,
 * and the one Save / Cancel for every change made in recovery mode. The
 * toggles shrink to icons on phones so the bar stays one line.
 */
export function RecoveryBar({ review }: { review: RecoveryReview }) {
  if (!review.state.reviewing) return null;
  const { count, suggestionsOpen, showFullCalendar, saving } = review;
  return (
    <PlanActionBar
      label="Recovery mode"
      testId="recovery-bar"
      title="Recovery"
      detail={count ? `${count} left` : "all decided"}
      dotClassName="bg-recover"
    >
      <Button
        variant="ghost"
        size="sm"
        className={toggleClass}
        aria-pressed={suggestionsOpen}
        onClick={() => review.setSuggestionsOpen(!suggestionsOpen)}
      >
        <ListChecks aria-hidden className="sm:hidden" />
        <span className="sr-only sm:not-sr-only">{suggestionsOpen ? "Hide suggestions" : "Show suggestions"}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={toggleClass}
        aria-pressed={showFullCalendar}
        onClick={() => review.setShowFullCalendar(!showFullCalendar)}
      >
        <CalendarRange aria-hidden className="sm:hidden" />
        <span className="sr-only sm:not-sr-only">{showFullCalendar ? "Only slipped goals" : "Show full calendar"}</span>
      </Button>
      <Button variant="outline" size="sm" className={PLAN_ACTION_BUTTON_CLASS} disabled={saving} onClick={review.cancel}>
        Cancel
      </Button>
      <Button size="sm" className={PLAN_ACTION_BUTTON_CLASS} disabled={!review.hasChanges || saving} onClick={review.save}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </PlanActionBar>
  );
}

/**
 * The quiet Agenda prompt beside the heading. Nothing about recovery shows
 * until the user presses Review, and nothing at all when no session slipped.
 */
export function RecoveryPrompt({ review }: { review: RecoveryReview }) {
  if (review.state.reviewing || review.count === 0) return null;
  const text = recoveryPromptText(review.count);
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1" data-testid="recovery-entry">
      {review.blocked ? <p className="text-xs text-muted-foreground">{RECOVERY_BLOCKED_NOTE}</p> : null}
      <button
        type="button"
        onClick={review.open}
        disabled={review.blocked}
        aria-label={`${text} · Review`}
        className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-sm text-foreground transition-colors hover:border-recover disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span aria-hidden className="size-2 rounded-full bg-recover" />
        <span>{text}</span>
        <span aria-hidden className="text-muted-foreground">·</span>
        <span className="font-semibold">Review</span>
        <ArrowRight aria-hidden className="size-3.5" />
      </button>
    </div>
  );
}
