import type { ReactNode } from "react";
import type { ProgressOverviewSectionContent } from "@/features/insights/progress-overview/progress-section-stack";
import { WeekRhythmCard } from "@/features/insights/week-rhythm-card";
import type { WeekRhythmGoalRow } from "@/features/insights/week-rhythm-model";

export interface ProgressWeekRhythmState {
  rows: WeekRhythmGoalRow[];
  loading: boolean;
  error: string | null;
}

/**
 * Assemble the current-view sections. Past-view sections are appended by the
 * caller so each group keeps its own data ownership.
 */
export function buildProgressSections({
  weekRhythm,
  history,
  pastSections,
}: {
  weekRhythm: ProgressWeekRhythmState;
  history: ReactNode;
  pastSections: readonly ProgressOverviewSectionContent[];
}): ProgressOverviewSectionContent[] {
  const sections: ProgressOverviewSectionContent[] = [
    { id: "history", content: history },
  ];

  if (weekRhythm.rows.length > 0 || weekRhythm.loading || weekRhythm.error) {
    sections.push({
      id: "week",
      content: (
        <WeekRhythmCard
          rows={weekRhythm.rows}
          loading={weekRhythm.loading}
          error={weekRhythm.error}
        />
      ),
    });
  }

  sections.push(...pastSections);

  return sections;
}
