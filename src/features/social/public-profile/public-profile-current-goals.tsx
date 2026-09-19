"use client";

import type { PublicProfileCurrentGoal } from "@cadence/shared/social/public-profile";
import {
  CurrentGoalGrid,
  hydratePublicCurrentGoal,
} from "@/features/insights/folio/current-goal-grid";

export function PublicProfileCurrentGoals({
  goals,
}: {
  goals: readonly PublicProfileCurrentGoal[];
}) {
  if (goals.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3" aria-labelledby="public-current-goals-heading">
      <h2 id="public-current-goals-heading" className="font-display text-lg font-semibold tracking-tight">
        Current goals
      </h2>
      <CurrentGoalGrid entries={goals.map(hydratePublicCurrentGoal)} />
    </section>
  );
}
