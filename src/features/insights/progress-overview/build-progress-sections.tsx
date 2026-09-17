import type { ReactNode } from "react";
import { GrowScoreTrendChart } from "@/features/insights/grow-score-trend-chart";
import type { ProgressOverviewSectionContent } from "@/features/insights/progress-overview/progress-overview-layout";
import { hasGrowScoreSignal } from "@/features/insights/use-grow-score-series";
import { WeekRhythmCard } from "@/features/insights/week-rhythm-card";
import type { WeekRhythmGoalRow } from "@/features/insights/week-rhythm-model";
import type { GrowScorePoint } from "@/lib/grow-score";

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
  growSeries,
  overallStats,
  weekRhythm,
  history,
  pastSections,
}: {
  growSeries: readonly GrowScorePoint[];
  /** Sits under the score chart, or under history when there is no score yet. */
  overallStats: ReactNode;
  weekRhythm: ProgressWeekRhythmState;
  history: ReactNode;
  pastSections: readonly ProgressOverviewSectionContent[];
}): ProgressOverviewSectionContent[] {
  const sections: ProgressOverviewSectionContent[] = [];
  const showScore = hasGrowScoreSignal(growSeries);

  if (showScore) {
    sections.push({
      id: "score",
      hideTitle: true,
      content: (
        <GrowScoreTrendChart title="Goalmaxxing score" series={growSeries}>
          {overallStats}
        </GrowScoreTrendChart>
      ),
    });
  }

  sections.push({
    id: "history",
    content: showScore ? (
      history
    ) : (
      <div className="space-y-5">
        {history}
        {overallStats}
      </div>
    ),
  });

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
