"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { isDemoPathname } from "@/lib/navigation/demo-path";
import { ArrowLeft } from "lucide-react";
import { NewGoalButton } from "@/features/goals/new-goal-button";
import { Button } from "@/components/ui/button";
import { LoadingCard } from "@/components/ui/loading-card";
import { useAppRouter } from "@/lib/navigation/use-app-router";
import { useReportAppSurfaceReady } from "@/components/layout/app-boot-ready";
import { useInsightsData } from "@/features/insights/use-insights-data";
import { InsightsTab } from "@/features/insights/insights-tab";
import { CurrentGoalGrid } from "./current-goal-grid";
import { buildCurrentGoals, buildGoalFolios } from "./folio-model";
import styles from "./folio.module.css";

export function GoalLibraryPage({ showBack = true }: { showBack?: boolean }) {
  const router = useAppRouter();
  const prefix = isDemoPathname(usePathname() ?? "") ? "/demo" : "";
  const { state, loading, loadError, reload } = useInsightsData({ selectedYear: String(new Date().getFullYear()) });
  useReportAppSurfaceReady(!loading);
  const folios = useMemo(() => buildGoalFolios(state.goals, state.progress?.summaries ?? [], state.userId), [state.goals, state.progress, state.userId]);
  const current = useMemo(() => buildCurrentGoals(state.goals, state.progress?.summaries ?? [], state.userId), [state.goals, state.progress, state.userId]);
  return (
    <div className={styles.page}>
      {showBack ? <button type="button" onClick={() => router.push(`${prefix}/goals`)} className={styles.back}><ArrowLeft size={15} aria-hidden="true" />Back to Goals</button> : null}
      {loadError ? <div className={styles.empty} role="alert"><h2>Your collection couldn’t be loaded.</h2><p>{loadError}</p><Button variant="outline" className="mt-5" onClick={reload}>Try again</Button></div>
        : loading || !state.progress ? <LoadingCard title="Opening your collection..." description="Gathering your goals." />
        : <div className="space-y-8">
          <section aria-labelledby="current-goals-heading">
            <header className="mb-4"><h1 id="current-goals-heading" className="font-display text-2xl font-semibold">Current Goals</h1><p className="text-sm text-muted-foreground">Taking shape. Worth keeping.</p></header>
            <CurrentGoalGrid entries={current} leadingCard={<NewGoalButton presentation="card" />} onDetails={goalId => router.push(`${prefix}/goals/${goalId}`)} />
          </section>
          <InsightsTab subjectUserId={state.userId} progressView="all" sectionIds={["history"]} />
          <section aria-labelledby="past-goals-heading">
            <header className="mb-4"><h2 id="past-goals-heading" className="font-display text-2xl font-semibold">Past Goals</h2><p className="text-sm text-muted-foreground">Every goal that’s passed.</p></header>
            {folios.length ? <CurrentGoalGrid entries={folios.flatMap(folio => folio.entries)} onDetails={goalId => router.push(`${prefix}/goals/${goalId}`)} /> : <p className="text-sm text-muted-foreground">Completed, ended, and archived goals collect here.</p>}
          </section>
        </div>}

    </div>
  );
}
