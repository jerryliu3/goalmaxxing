"use client";

import { useMemo, useState } from "react";
import { HeatmapGrid, StatStrip } from "@/features/ux-destinations/charts";
import { ConceptNote, DestinationChrome } from "@/features/ux-destinations/chrome";
import {
  GoalPicker,
  MilestoneRunway,
  ProgressMapShell,
  ledgerCaption,
  milestonePins,
  selectedGoals,
  toggleGoalSelection,
} from "@/features/ux-destinations/goal-ledger";
import { getDestinationConcept } from "@/features/ux-destinations/model";
import { ReadingsBand } from "@/features/ux-destinations/progress-readings";
import {
  DESTINATION_TODAY,
  HEATMAP_CELLS,
  OVERALL_STATS,
  PROGRESS_GOALS,
  TEAM_STATS,
} from "@/features/ux-destinations/seed";

const concept = getDestinationConcept("atlas");

export function ProgressAtlasConcept() {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    PROGRESS_GOALS.map((goal) => goal.id)
  );
  const [dayIndex, setDayIndex] = useState<number | null>(3);
  const [activeMilestone, setActiveMilestone] = useState<string | null>(null);
  const goals = selectedGoals(selectedIds);
  const single = goals.length === 1 ? goals[0] : null;
  const milestoneGoal =
    single?.kind === "milestone"
      ? single
      : goals.length === PROGRESS_GOALS.length
        ? null
        : goals.find((goal) => goal.kind === "milestone") ?? null;
  const pins = milestonePins(
    milestoneGoal ? [milestoneGoal.id] : selectedIds
  );

  const stats = useMemo(() => {
    if (single) {
      return {
        weekPercent: single.percent,
        monthPercent: Math.max(18, single.percent - 8),
        streak: single.currentStreak,
        activities: single.percent,
        hint: single.title,
      };
    }
    return {
      weekPercent: OVERALL_STATS.weekPercent,
      monthPercent: OVERALL_STATS.monthPercent,
      streak: OVERALL_STATS.streak,
      activities: OVERALL_STATS.activities,
      hint: OVERALL_STATS.weekTrend,
    };
  }, [single]);

  return (
    <DestinationChrome
      concept={concept}
      title="Progress"
      trailing={
        <p className="text-xs text-muted-foreground">{DESTINATION_TODAY.monthLabel}</p>
      }
    >
      <div className="space-y-6 pt-5">
        <StatStrip
          items={[
            {
              label: "This week",
              value: `${stats.weekPercent}%`,
              hint: single ? stats.hint : OVERALL_STATS.weekTrend,
            },
            {
              label: "This month",
              value: `${stats.monthPercent}%`,
              hint: single ? single.countLabel : OVERALL_STATS.monthTrend,
            },
            {
              label: "Active streak",
              value: `${stats.streak}d`,
              hint: `Longest ${single?.longestStreak ?? OVERALL_STATS.longestStreak}d`,
            },
            {
              label: "Activities",
              value: String(stats.activities),
              hint: `${OVERALL_STATS.todayActivities} today · team ${TEAM_STATS.weekPercent}%`,
            },
          ]}
        />

        <ProgressMapShell
          map={
            <HeatmapGrid
              cells={HEATMAP_CELLS}
              caption={ledgerCaption(selectedIds)}
              selectedIndex={dayIndex}
              editable={Boolean(single)}
              pins={pins}
              pinStyle="dot"
              onSelectDay={setDayIndex}
            />
          }
          goals={
            <GoalPicker
              selectedIds={selectedIds}
              onToggle={(id) =>
                setSelectedIds((current) => toggleGoalSelection(current, id))
              }
              onAll={() => setSelectedIds(PROGRESS_GOALS.map((goal) => goal.id))}
            />
          }
        />

        {milestoneGoal ? (
          <MilestoneRunway
            goal={milestoneGoal}
            activeName={activeMilestone}
            onSelect={(milestone) => {
              setActiveMilestone(milestone.name);
              if (milestone.cell !== null) setDayIndex(milestone.cell);
            }}
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            Milestone names stay parked with their goal. Select Thesis to open
            a ten-stop runway between the map and readings.
          </p>
        )}

        <ReadingsBand />
      </div>
      <ConceptNote concept={concept} />
    </DestinationChrome>
  );
}
