"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recoveryPromptText } from "@/lib/planner/recovery/model";
import { RECOVERY_BLOCKED_NOTE, type RecoveryReview } from "@/features/planner/recovery/use-recovery-review";

const barButtonClass = "h-8 rounded-full px-3";

/**
 * Recovery mode's bar, in place of the entry line: what is left, the
 * suggestions and calendar toggles, and the one Save / Cancel for every
 * change made in recovery mode.
 */
function RecoveryBar({ review }: { review: RecoveryReview }) {
  const { count, suggestionsOpen, showFullCalendar, saving } = review;
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-warning bg-warning-fill px-3 py-2"
      data-testid="recovery-bar"
      role="region"
      aria-label="Recovery mode"
    >
      <p className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        <span aria-hidden className="size-2 flex-none rounded-full bg-recover" />
        <span className="font-semibold">Recovery mode</span>
        <span className="text-muted-foreground">· {count ? `${count} left` : "all decided"}</span>
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className={barButtonClass}
          aria-pressed={suggestionsOpen}
          onClick={() => review.setSuggestionsOpen(!suggestionsOpen)}
        >
          {suggestionsOpen ? "Hide suggestions" : "Show suggestions"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={barButtonClass}
          aria-pressed={showFullCalendar}
          onClick={() => review.setShowFullCalendar(!showFullCalendar)}
        >
          {showFullCalendar ? "Only slipped goals" : "Show full calendar"}
        </Button>
        <Button variant="outline" size="sm" className={barButtonClass} disabled={saving} onClick={review.cancel}>
          Cancel
        </Button>
        <Button size="sm" className={barButtonClass} disabled={!review.hasChanges || saving} onClick={review.save}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}

/**
 * The calm Agenda line. Nothing about recovery shows until the user presses
 * Review, and nothing at all when no session slipped.
 */
export function RecoveryEntry({ review }: { review: RecoveryReview }) {
  if (review.state.reviewing) return <RecoveryBar review={review} />;
  if (review.count === 0) return null;
  const text = recoveryPromptText(review.count);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1" data-testid="recovery-entry">
      <button
        type="button"
        onClick={review.open}
        disabled={review.blocked}
        aria-label={`${text} · Review`}
        className="inline-flex min-h-9 items-center gap-2 rounded-full border border-warning bg-warning-fill px-3.5 text-sm text-foreground transition-colors hover:border-recover disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span aria-hidden className="size-2 rounded-full bg-recover" />
        <span>{text}</span>
        <span aria-hidden className="text-recover">·</span>
        <span className="font-semibold">Review</span>
        <ArrowRight aria-hidden className="size-3.5" />
      </button>
      {review.blocked ? <p className="text-xs text-muted-foreground">{RECOVERY_BLOCKED_NOTE}</p> : null}
    </div>
  );
}
