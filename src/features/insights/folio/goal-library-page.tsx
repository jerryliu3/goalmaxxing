"use client";

import { useMemo } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingCard } from "@/components/ui/loading-card";
import { useAppRouter } from "@/lib/navigation/use-app-router";
import { useReportAppSurfaceReady } from "@/components/layout/app-boot-ready";
import { useInsightsData } from "@/features/insights/use-insights-data";
import { CurrentGoalGrid } from "./current-goal-grid";
import { buildCurrentGoals, buildGoalFolios } from "./folio-model";
import { FolioShelf } from "./folio-shelf";
import styles from "./folio.module.css";

export function GoalLibraryPage({ view = "current", fromPlan = false }: { view?: "current" | "past"; fromPlan?: boolean }) {
  const router = useAppRouter();
  const { state, loading, loadError, reload } = useInsightsData({ selectedYear: String(new Date().getFullYear()) });
  useReportAppSurfaceReady(!loading);
  const folios = useMemo(() => buildGoalFolios(state.goals, state.progress?.summaries ?? [], state.userId), [state.goals, state.progress, state.userId]);
  const current = useMemo(() => buildCurrentGoals(state.goals, state.progress?.summaries ?? [], state.userId), [state.goals, state.progress, state.userId]);
  const goalCount = folios.reduce((total, folio) => total + folio.entries.length, 0);
  return (
    <div className={styles.page}>
      <button type="button" onClick={() => router.push(fromPlan ? "/calendar" : "/insights#progress-achievements")} className={styles.back}><ArrowLeft size={15} aria-hidden="true" />{fromPlan ? "Back to Plan" : "Back to Progress"}</button>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>EVERY GOAL YOU’VE SET</p>
          <h1 className={styles.pageTitle}>The goal library</h1>
          <p className={styles.intro}>Taking shape. Worth keeping.</p>
        </div>
        {!loading && !loadError && <p className={styles.collectionCount}>{current.length} current · {goalCount} past</p>}
      </header>
      <nav aria-label="Goal library collections" className={styles.collections}>
        {(["current", "past"] as const).map(collection => <button key={collection} type="button" aria-current={view === collection ? "page" : undefined}
          onClick={() => router.push(`/insights/folios?view=${collection}${fromPlan ? "&from=plan" : ""}`)}>
          {collection === "current" ? "Current" : "Past"}
        </button>)}
      </nav>
      {loadError ? <div className={styles.empty} role="alert"><h2>Your collection couldn’t be loaded.</h2><p>{loadError}</p><Button variant="outline" className="mt-5" onClick={reload}>Try again</Button></div>
        : loading || !state.progress ? <LoadingCard title="Opening your collection..." description="Gathering your goals." />
        : view === "current" ? current.length ? <CurrentGoalGrid
          entries={current}
          onDetails={(goalId) => router.push(`/goals/${goalId}`)}
        /> : <div className={styles.empty}><BookOpen size={36} className="mx-auto" aria-hidden="true" /><h2>Room for your next goal.</h2><p>Your active and upcoming goals will take shape here.</p><Button variant="outline" className="mt-5" onClick={() => router.push("/calendar")}>Back to your plan</Button></div>
        : folios.length ? <FolioShelf folios={folios} />
        : <div className={styles.empty}><BookOpen size={36} strokeWidth={1.2} className="mx-auto" aria-hidden="true" /><h2>No past goals yet.</h2><p>Goals you complete, end, or archive will collect here. Keep showing up for what matters to you.</p><Button variant="outline" className="mt-5" onClick={() => router.push("/calendar")}>Back to your plan</Button></div>}
    </div>
  );
}
