"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useXpProfile } from "@/components/xp/xp-profile-provider";
import { AchievementsShowcase } from "@/features/achievements/showcase";
import { useAchievementsShowcase } from "@/features/achievements/use-achievements-showcase";
import { buildGoalFolios } from "@/features/insights/folio/folio-model";
import { FolioShelf } from "@/features/insights/folio/folio-shelf";
import type { ProgressOverviewSectionContent } from "@/features/insights/progress-overview/progress-section-stack";
import type { Goal } from "@/lib/goals/types";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";

/**
 * Past-view sections. Achievements and the goal library own their own loading,
 * so the ledger surface does not need to know about either payload.
 */
export function useProgressPastSections({
  goals,
  summaries,
  userId,
  enabled,
}: {
  goals: Goal[];
  summaries: ProgressContextSummary[];
  userId: string;
  enabled: boolean;
}): ProgressOverviewSectionContent[] {
  const { profile } = useXpProfile();
  const { loading, error, payload, reload } = useAchievementsShowcase({ enabled });
  const folios = useMemo(
    () => buildGoalFolios(goals, summaries, userId),
    [goals, summaries, userId]
  );

  const sections: ProgressOverviewSectionContent[] = [];

  if (!enabled) {
    return sections;
  }

  if (profile) {
    sections.push({
      id: "achievements",
      content: loading ? (
        <p className="font-sans text-sm text-muted-foreground">
          Loading achievements...
        </p>
      ) : error || !payload ? (
        <div>
          <p className="font-sans text-sm text-destructive">
            {error ?? "Achievements could not be loaded."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              void reload();
            }}
          >
            Try again
          </Button>
        </div>
      ) : (
        <AchievementsShowcase payload={payload} />
      ),
    });
  }

  sections.push({
    id: "past-goals",
    content:
      folios.length > 0 ? (
        <FolioShelf folios={folios} />
      ) : (
        <p className="font-sans text-sm text-muted-foreground">
          No past goals yet. Goals you complete, end, or archive collect here.
        </p>
      ),
  });

  return sections;
}
