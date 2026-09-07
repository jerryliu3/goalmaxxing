"use client";

import { useState } from "react";
import { HeatmapGrid, StatStrip } from "@/features/ux-destinations/charts";
import { ConceptNote, DestinationChrome } from "@/features/ux-destinations/chrome";
import {
  GoalPicker,
  MilestoneRunway,
  ProgressMapShell,
  ledgerCaption,
  milestonePins,
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

const concept = getDestinationConcept("pins");

export function ProgressPinsConcept() {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    PROGRESS_GOALS.map((goal) => goal.id)
  );
  const [dayIndex, setDayIndex] = useState<number | null>(1);
  const thesis = PROGRESS_GOALS.find((goal) => goal.id === "thesis")!;
  const pins = milestonePins(["thesis"]);

  function selectPin(cell: number) {
    setDayIndex(cell);
    setSelectedIds(["thesis"]);
  }

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
              value: `${OVERALL_STATS.streak}d`,
              hint: `Longest ${OVERALL_STATS.longestStreak}d`,
            },
            {
              label: "Milestones",
              value: "4 / 10",
              hint: "Numbers on the map are Thesis stops",
            },
          ]}
        />

        <ProgressMapShell
          map={
            <section className="rounded-[16px] border border-border p-4 sm:p-6">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Completions as fill · milestones as numbered pins
              </p>
              <HeatmapGrid
                cells={HEATMAP_CELLS}
                caption={ledgerCaption(selectedIds)}
                selectedIndex={dayIndex}
                editable={selectedIds.length === 1}
                pins={pins}
                pinStyle="named"
                onSelectDay={(index) => {
                  const pin = pins.find((item) => item.cell === index);
                  if (pin) {
                    selectPin(index);
                    return;
                  }
                  setDayIndex(index);
                }}
              />
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-5">
                {thesis.milestones?.map((milestone, index) => (
                  <li key={milestone.name}>
                    <button
                      type="button"
                      className="font-semibold"
                      onClick={() => {
                        setSelectedIds(["thesis"]);
                        if (milestone.cell !== null) setDayIndex(milestone.cell);
                      }}
                    >
                      {index + 1}. {milestone.name}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
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

        {selectedIds.length === 1 && selectedIds[0] === "thesis" ? (
          <MilestoneRunway
            goal={thesis}
            activeName={
              thesis.milestones?.find((item) => item.cell === dayIndex)?.name ??
              null
            }
            onSelect={(milestone) => {
              if (milestone.cell !== null) setDayIndex(milestone.cell);
            }}
          />
        ) : null}

        <ReadingsBand />
      </div>
      <ConceptNote concept={concept} />
    </DestinationChrome>
  );
}
