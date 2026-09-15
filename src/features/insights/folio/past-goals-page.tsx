"use client";

import { useMemo } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingCard } from "@/components/ui/loading-card";
import { useAppRouter } from "@/lib/navigation/use-app-router";
import { useReportAppSurfaceReady } from "@/components/layout/app-boot-ready";
import { useInsightsData } from "@/features/insights/use-insights-data";
import { buildGoalFolios } from "./folio-model";
import { FolioShelf } from "./folio-shelf";
import styles from "./folio.module.css";

export function PastGoalsPage() {
  const router = useAppRouter();
  const { state, loading, loadError, reload } = useInsightsData({ selectedYear: String(new Date().getFullYear()) });
  useReportAppSurfaceReady(!loading);
  const folios = useMemo(() => buildGoalFolios(state.goals, state.progress?.summaries ?? [], state.userId), [state.goals, state.progress, state.userId]);
  const goalCount = folios.reduce((total, folio) => total + folio.entries.length, 0);
  return (
    <div className={styles.page}>
      <button type="button" onClick={() => router.push("/insights#progress-achievements")} className={styles.back}><ArrowLeft size={15} aria-hidden="true" />Back to Progress</button>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>YOUR PERSONAL COLLECTION</p>
          <h1 className={styles.pageTitle}>The living folio.</h1>
          <p className={styles.intro}>The things you started. The steps you took.<br />A place for every chapter, wherever it led.</p>
        </div>
        {!loading && !loadError && <p className={styles.collectionCount}>{goalCount} past {goalCount === 1 ? "goal" : "goals"} · {folios.length} {folios.length === 1 ? "volume" : "volumes"}</p>}
      </header>
      {loadError ? <div className={styles.empty} role="alert"><h2>Your collection couldn’t be loaded.</h2><p>{loadError}</p><Button variant="outline" className="mt-5" onClick={reload}>Try again</Button></div>
        : loading || !state.progress ? <LoadingCard title="Opening your collection..." description="Gathering your past goals." />
        : folios.length ? <FolioShelf folios={folios} />
        : <div className={styles.empty}><BookOpen size={36} strokeWidth={1.2} className="mx-auto" aria-hidden="true" /><h2>Your first volume is still being written.</h2><p>Completed, ended, and archived goals will find a home here. Keep showing up for what matters to you.</p><Button variant="outline" className="mt-5" onClick={() => router.push("/calendar")}>Back to your plan</Button></div>}
    </div>
  );
}
