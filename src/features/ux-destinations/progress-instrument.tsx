"use client";

import { useState } from "react";
import {
  CategoryRows,
  HeatmapGrid,
  Sparkline,
  StatStrip,
  WeekdayBars,
} from "@/features/ux-destinations/charts";
import { ConceptNote, DestinationChrome } from "@/features/ux-destinations/chrome";
import {
  GoalLedgerList,
  ledgerCaption,
  toggleGoalSelection,
} from "@/features/ux-destinations/goal-ledger";
import { getDestinationConcept } from "@/features/ux-destinations/model";
import {
  CATEGORY_RATES,
  COUNT_SERIES,
  DESTINATION_TODAY,
  HEATMAP_CELLS,
  OVERALL_STATS,
  PROGRESS_GOALS,
  RATE_SERIES,
  WEEKDAY_RATES,
} from "@/features/ux-destinations/seed";

const concept = getDestinationConcept("instrument");
const MODES = [
  { id: "ledger", label: "Ledger" },
  { id: "rhythm", label: "Rhythm" },
  { id: "mix", label: "Mix" },
] as const;

export function ProgressInstrumentConcept() {
  const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("ledger");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    PROGRESS_GOALS.map((goal) => goal.id)
  );
  const [scope, setScope] = useState<"you" | "team">("you");

  return (
    <DestinationChrome
      concept={concept}
      title="Progress"
      modes={MODES}
      mode={mode}
      onModeChange={(id) => setMode(id as typeof mode)}
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
              label: "Activities",
              value: String(OVERALL_STATS.activities),
              hint: `${OVERALL_STATS.todayActivities} today`,
            },
          ]}
        />

        {mode === "ledger" ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
            <section>
              <h2 className="mb-3 text-sm font-semibold">Goals</h2>
              <GoalLedgerList
                selectedIds={selectedIds}
                showStats
                onToggle={(id) =>
                  setSelectedIds((current) => toggleGoalSelection(current, id))
                }
              />
            </section>
            <section>
              <HeatmapGrid cells={HEATMAP_CELLS} caption={ledgerCaption(selectedIds)} />
            </section>
          </div>
        ) : null}

        {mode === "rhythm" ? (
          <section className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-[12px] border border-border p-4 sm:p-5">
              <h2 className="mb-4 font-display text-base font-semibold">
                Weekday rhythm
              </h2>
              <WeekdayBars data={WEEKDAY_RATES} />
              <p className="mt-3 text-xs text-muted-foreground">
                Tuesday is the dip — Strength was missed, not a streak threat.
              </p>
            </div>
            <div className="rounded-[12px] border border-border p-4 sm:p-5">
              <Sparkline values={RATE_SERIES} label="Completion rate · 30 days" />
              <div className="mt-6">
                <Sparkline values={COUNT_SERIES} label="Completions per day · 30 days" />
              </div>
            </div>
          </section>
        ) : null}

        {mode === "mix" ? (
          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="rounded-[12px] border border-border p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-base font-semibold">Category mix</h2>
                <div
                  role="group"
                  aria-label="Mix scope"
                  className="inline-flex rounded-[10px] bg-muted p-0.5 text-xs font-medium"
                >
                  {(["you", "team"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={scope === item}
                      onClick={() => setScope(item)}
                      className={
                        scope === item
                          ? "min-h-8 rounded-[8px] bg-background px-3 capitalize"
                          : "min-h-8 rounded-[8px] px-3 capitalize text-muted-foreground"
                      }
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <CategoryRows data={CATEGORY_RATES} />
            </div>
            <aside className="rounded-[12px] border border-border p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {scope === "you" ? "Your goals" : "Team goals"}
              </p>
              <p className="mt-3 font-display text-4xl font-semibold tracking-tight">
                {scope === "you"
                  ? `${OVERALL_STATS.monthPercent}%`
                  : "74%"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Month completion. Active days {OVERALL_STATS.activeDaysPercent}% of{" "}
                {OVERALL_STATS.totalDays} days in product.
              </p>
            </aside>
          </section>
        ) : null}
      </div>
      <ConceptNote concept={concept} />
    </DestinationChrome>
  );
}
