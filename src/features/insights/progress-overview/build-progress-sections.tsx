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
 * Assemble the tracker and week rhythm. Medals and past goals have their own homes.
 */
export function buildProgressSections({
  weekRhythm,
  history,
}: {
  weekRhythm: ProgressWeekRhythmState;
  history: ReactNode;
}): ProgressOverviewSectionContent[] {
  const sections: ProgressOverviewSectionContent[] = [
    // The tracker is a working region, so it sits on a panel like the day checklist.
    { id: "history", content: history, framed: true },
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

  return sections;
}
