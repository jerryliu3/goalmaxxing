"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { isDemoPathname } from "@/lib/navigation/demo-path";
import { ArrowLeft, BookOpen } from "lucide-react";
import { NewGoalButton } from "@/features/goals/new-goal-button";
import { Button } from "@/components/ui/button";
import { LoadingCard } from "@/components/ui/loading-card";
import { useAppRouter } from "@/lib/navigation/use-app-router";
import { useReportAppSurfaceReady } from "@/components/layout/app-boot-ready";
import { useInsightsData } from "@/features/insights/use-insights-data";
import { CurrentGoalGrid } from "./current-goal-grid";
import { buildCurrentGoals, buildGoalFolios } from "./folio-model";
import styles from "./folio.module.css";

export function GoalLibraryPage({ title = "The goal library", showBack = true }: { title?: string; showBack?: boolean }) {
  const router = useAppRouter();
  const prefix = isDemoPathname(usePathname() ?? "") ? "/demo" : "";
  const { state, loading, loadError, reload } = useInsightsData({ selectedYear: String(new Date().getFullYear()) });
  useReportAppSurfaceReady(!loading);
  const folios = useMemo(() => buildGoalFolios(state.goals, state.progress?.summaries ?? [], state.userId), [state.goals, state.progress, state.userId]);
  const current = useMemo(() => buildCurrentGoals(state.goals, state.progress?.summaries ?? [], state.userId), [state.goals, state.progress, state.userId]);
  const goalCount = folios.reduce((total, folio) => total + folio.entries.length, 0);
  return (
    <div className={styles.page}>
      {showBack ? <button type="button" onClick={() => router.push(`${prefix}/goals`)} className={styles.back}><ArrowLeft size={15} aria-hidden="true" />Back to Goals</button> : null}
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>EVERY GOAL YOU’VE SET</p>
          <h1 className={styles.pageTitle}>{title}</h1>
          <p className={styles.intro}>Taking shape. Worth keeping.</p>
        </div>
        <div className="flex flex-col items-end gap-3"><NewGoalButton />{!loading && !loadError && <p className={styles.collectionCount}>{current.length} current · {goalCount} past</p>}</div>
      </header>
      <nav aria-label="Goal library collections" className={styles.collections}>
        {(["current", "past"] as const).map(collection => <button key={collection} type="button" aria-current={collection === "current" ? "page" : undefined}
          onClick={() => router.push(collection === "past" ? `${prefix}/achievements#progress-section-past-goals` : `${prefix}/goals/library`)}>
          {collection === "current" ? "Current" : "Past"}
        </button>)}
      </nav>
      {loadError ? <div className={styles.empty} role="alert"><h2>Your collection couldn’t be loaded.</h2><p>{loadError}</p><Button variant="outline" className="mt-5" onClick={reload}>Try again</Button></div>
        : loading || !state.progress ? <LoadingCard title="Opening your collection..." description="Gathering your goals." />
        : current.length ? <CurrentGoalGrid
          entries={current}
          onDetails={(goalId) => router.push(`${prefix}/goals/${goalId}`)}
        /> : <div className={styles.empty}><BookOpen size={36} className="mx-auto" aria-hidden="true" /><h2>Room for your next goal.</h2><p>Your active and upcoming goals will take shape here.</p><Button variant="outline" className="mt-5" onClick={() => router.push(`${prefix}/goals`)}>Back to Goals</Button></div>}

    </div>
  );
}
