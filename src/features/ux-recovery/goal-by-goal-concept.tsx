"use client";

import { useState } from "react";
import { AgendaHeader, RecoveryChrome } from "@/features/ux-recovery/chrome";
import { getRecoveryConcept } from "@/features/ux-recovery/concepts";
import { RecoveryCalendar } from "@/features/ux-recovery/month-grid";
import { ReviewEntry } from "@/features/ux-recovery/primitives";
import { GoalStep, ReviewSheet, ReviewToolbar, StepNav } from "@/features/ux-recovery/review-list";
import { recapHeading, RecapActions, ReviewRecap } from "@/features/ux-recovery/review-recap";
import { goalById } from "@/features/ux-recovery/seed";
import { useRecoveryReview } from "@/features/ux-recovery/use-recovery-review";

const concept = getRecoveryConcept("goal-by-goal");

/**
 * Leading concept. One goal at a time — "Goal 2 of 4" — with the calendar
 * filtered to it; decided rows stay as confirmations with their own Undo;
 * Next goal is always there; the walk ends on a recap of every change.
 * Auto-rebalance jumps straight to that recap as a proposal.
 */
export function GoalByGoalConcept() {
  const review = useRecoveryReview();
  const { state, prompt, goalId } = review;
  const [hovered, setHovered] = useState<string | null>(null);
  const goal = goalId ? goalById(state.seed, goalId) : undefined;
  const heading = goal
    ? { eyebrow: `Goal ${state.step + 1} of ${state.steps.length} · saves as you go`, title: goal.title }
    : recapHeading(review);

  return (
    <RecoveryChrome concept={concept}>
      <main className={`px-4 py-6 md:px-6 ${state.reviewing ? "pb-[55dvh] lg:pb-10" : "pb-10"}`}>
        <div className="mx-auto max-w-6xl">
          <AgendaHeader>
            <ReviewEntry prompt={prompt} reviewing={state.reviewing} onReview={review.open} />
          </AgendaHeader>
          <div className={`mt-5 grid items-start gap-5 ${state.reviewing ? "lg:grid-cols-[minmax(0,1fr)_420px]" : ""}`}>
            <RecoveryCalendar review={review} highlightId={hovered} />
            {state.reviewing ? (
              <ReviewSheet
                eyebrow={heading.eyebrow}
                title={heading.title}
                onClose={review.close}
                tall={!goal}
                footer={goal ? <StepNav review={review} /> : <RecapActions review={review} />}
              >
                <ReviewToolbar review={review} filter />
                <div className="mt-3">
                  {goalId ? (
                    <GoalStep goalId={goalId} review={review} onHover={setHovered} heading={false} />
                  ) : (
                    <ReviewRecap review={review} onHover={setHovered} />
                  )}
                </div>
              </ReviewSheet>
            ) : null}
          </div>
        </div>
      </main>
    </RecoveryChrome>
  );
}
