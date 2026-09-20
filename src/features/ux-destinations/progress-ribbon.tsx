"use client";

import { useState } from "react";
import { StatStrip } from "@/features/ux-destinations/charts";
import { ConceptNote, DestinationChrome } from "@/features/ux-destinations/chrome";
import {
  GoalPicker,
  MilestoneRunway,
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
} from "@/features/ux-destinations/seed";

const concept = getDestinationConcept("ribbon");
const WEEK_LABELS = ["Aug 31", "Sep 7", "Sep 14", "Sep 21", "Sep 28"];

export function ProgressRibbonConcept() {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    PROGRESS_GOALS.map((goal) => goal.id)
  );
  const [station, setStation] = useState<string | null>(null);
  const goals = selectedGoals(selectedIds);
  const thesis =
    goals.length === 1 && goals[0].id === "thesis"
      ? goals[0]
      : station
        ? PROGRESS_GOALS.find((goal) => goal.id === "thesis")
        : null;

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
              value: `${OVERALL_STATS.weekPercent}%`,
              hint: OVERALL_STATS.weekTrend,
            },
            {
              label: "This month",
              value: `${OVERALL_STATS.monthPercent}%`,
              hint: OVERALL_STATS.monthTrend,
            },
            {
              label: "Active streak",
              value: `${OVERALL_STATS.activeStreakWeeks}w`,
              hint: `Longest ${OVERALL_STATS.longestActiveStreakWeeks}w`,
            },
            {
              label: "Activities",
              value: String(OVERALL_STATS.activities),
              hint: `${OVERALL_STATS.todayActivities} today`,
            },
          ]}
        />

        <section className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Week ribbons · stations are milestones
          </p>
          {WEEK_LABELS.map((label, week) => (
            <div key={label} className="flex items-center gap-3">
              <p className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {label}
              </p>
              <div className="relative h-10 min-w-0 flex-1 rounded-full bg-muted">
                <div className="absolute inset-y-2 left-2 right-2 flex">
                  {HEATMAP_CELLS.slice(week * 7, week * 7 + 7).map((count, day) => (
                    <span
                      key={`${label}-${day}`}
                      className={`mx-[3%] h-full min-w-0 flex-1 rounded-full heatmap-scale-${Math.min(count, 4)} ${
                        week === 0 && day === 3 ? "ring-2 ring-foreground" : ""
                      }`}
                    />
                  ))}
                </div>
                {week === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStation("Proposal");
                      setSelectedIds(["thesis"]);
                    }}
                    className="absolute left-[18%] top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background"
                  >
                    Proposal
                  </button>
                ) : null}
                {week === 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStation("Lit review");
                      setSelectedIds(["thesis"]);
                    }}
                    className="absolute left-[68%] top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground bg-background px-2 py-0.5 text-[10px] font-semibold"
                  >
                    Lit review
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Thursday is the live slice. Unplaced stations wait off the ribbon
            until you set a date. Thesis now has ten stops.
          </p>
        </section>

        <GoalPicker
          selectedIds={selectedIds}
          onToggle={(id) => setSelectedIds((current) => toggleGoalSelection(current, id))}
          onAll={() => {
            setSelectedIds(PROGRESS_GOALS.map((goal) => goal.id));
            setStation(null);
          }}
        />

        {thesis ? (
          <MilestoneRunway
            goal={thesis}
            activeName={station}
            onSelect={(milestone) => setStation(milestone.name)}
          />
        ) : null}

        <ReadingsBand />
      </div>
      <ConceptNote concept={concept} />
    </DestinationChrome>
  );
}
