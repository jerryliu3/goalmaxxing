"use client";

import { BookOpen } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { WeekRhythmCard } from "@/features/insights/week-rhythm-card";
import { getHeatmapScaleClass } from "@/lib/goals/heatmap";
import { OverviewAchievements } from "./achievements";
import { MONTH_COUNTS, MONTH_FACTS, WEEK_SUMMARY } from "./model";
import { AS_OF, FOLIOS, WEEK_ROWS } from "./seed";

export function ProgressOverview({ weekOpen, achievementsOpen, onWeekToggle, onAchievementsToggle, historyLink, patternsLink, foliosLink }: {
  weekOpen: boolean;
  achievementsOpen: boolean;
  onWeekToggle: () => void;
  onAchievementsToggle: () => void;
  historyLink: ReactNode;
  patternsLink: ReactNode;
  foliosLink: ReactNode;
}) {
  return (
    <div>
      <section aria-labelledby="overview-week-title" className="border-t border-border py-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 id="overview-week-title" className="font-display text-2xl">This week</h2><p className="mt-1 text-sm text-muted-foreground">September 14–20 · all goals</p></div>
          <div className="flex items-center gap-5"><p className="font-display text-4xl">{WEEK_SUMMARY.done}<span className="text-xl text-muted-foreground"> of {WEEK_SUMMARY.planned}</span></p><Button variant="ghost" aria-expanded={weekOpen} aria-controls="overview-week-rhythm" onClick={onWeekToggle}>{weekOpen ? "Hide rhythm" : "Expand rhythm"}</Button></div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Goal opportunities completed. A week in progress, with room to keep going.</p>
        {weekOpen && <div id="overview-week-rhythm" className="mt-5"><WeekRhythmCard rows={WEEK_ROWS} /></div>}
      </section>

      <section aria-labelledby="overview-history-title" className="border-t border-border py-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="overview-history-title" className="font-display text-2xl">Completion history</h2><p className="mt-1 text-sm text-muted-foreground">September · {MONTH_FACTS.length} completions across four goals</p></div>{historyLink}</div>
        <div className="mt-5 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5" aria-label="September 1–16 completion preview">
          {Array.from({ length: 16 }, (_, index) => {
            const date = `2026-09-${String(index + 1).padStart(2, "0")}`;
            return <div key={date} className={`grid h-9 place-items-center rounded text-xs ${getHeatmapScaleClass(MONTH_COUNTS[date] ?? 0)}`} title={`${date}: ${MONTH_COUNTS[date] ?? 0} completions`}>{index + 1}</div>;
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Recorded effort through {AS_OF}. Open the ledger to inspect goals, dates and milestones.</p>{patternsLink}</div>
      </section>

      <OverviewAchievements expanded={achievementsOpen} onToggle={onAchievementsToggle} />

      <section aria-labelledby="overview-folios-title" className="border-t border-border py-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="overview-folios-title" className="font-display text-2xl">Past goals</h2><p className="mt-1 text-sm text-muted-foreground">Completed, ended and archived. Every ending stays honest.</p></div>{foliosLink}</div>
        <div className="mt-5 flex items-center gap-5 border-l-4 border-primary/60 bg-card px-5 py-4"><BookOpen className="size-8 text-muted-foreground" aria-hidden /><div><p className="font-display text-2xl">2026</p><p className="text-sm text-muted-foreground">{FOLIOS[0].entries.length} chapters · {FOLIOS[0].completions} lifetime completions</p></div></div>
      </section>
    </div>
  );
}
