"use client";

import { useId, useMemo } from "react";
import { usePathname } from "next/navigation";
import { isDemoPathname } from "@/lib/navigation/demo-path";
import { NewGoalButton } from "@/features/goals/new-goal-button";
import { Button } from "@/components/ui/button";
import { LoadingCard } from "@/components/ui/loading-card";
import { useAppRouter } from "@/lib/navigation/use-app-router";
import { useReportAppSurfaceReady } from "@/components/layout/app-boot-ready";
import { useInsightsData } from "@/features/insights/use-insights-data";
import { FolioShelf } from "./folio-shelf";
import { CurrentGoalGrid } from "./current-goal-grid";
import { useGoalCardScrollMotion } from "@/features/goals/use-goal-card-scroll-motion";
import { buildCurrentGoals, buildGoalFolios } from "./folio-model";
import styles from "./folio.module.css";

export function GoalsCollectionPage({ subjectUserId, readOnly = false, anchorSections = true }: {
  subjectUserId?: string;
  readOnly?: boolean;
  anchorSections?: boolean;
}) {
  const headingId = useId();
  const moving = useGoalCardScrollMotion();
  const router = useAppRouter();
  const prefix = isDemoPathname(usePathname() ?? "") ? "/demo" : "";
  const { state, loading, loadError, reload } = useInsightsData({ subjectUserId, selectedYear: String(new Date().getFullYear()), failClosed: readOnly });
  useReportAppSurfaceReady(!loading);
  const folios = useMemo(() => buildGoalFolios(state.goals, state.progress?.summaries ?? [], state.userId), [state.goals, state.progress, state.userId]);
  const current = useMemo(() => buildCurrentGoals(state.goals, state.progress?.summaries ?? [], state.userId), [state.goals, state.progress, state.userId]);
  return (
    <div className={styles.page}>
      {loadError ? <div className={styles.empty} role="alert"><h2>Your collection couldn’t be loaded.</h2><p>{loadError}</p><Button variant="outline" className="mt-5" onClick={reload}>Try again</Button></div>
        : loading || !state.progress ? <LoadingCard title="Opening your collection..." description="Gathering your goals." />
        : <div className="space-y-8">
          <section aria-labelledby={`${headingId}-current`}>
            <header className="mb-4"><h1 id={`${headingId}-current`} className="type-title text-2xl">Current goals</h1><p className="text-sm text-muted-foreground">Taking shape. Worth keeping.</p></header>
            <CurrentGoalGrid entries={current} moving={moving} leadingCard={readOnly ? undefined : <NewGoalButton presentation="card" />} onDetails={readOnly ? undefined : goalId => router.push(`${prefix}/goals/${goalId}`)} />
          </section>
          <section id={anchorSections ? "goal-library" : undefined} aria-labelledby={`${headingId}-library`}>
            <header className="mb-4">
              <h2 id={`${headingId}-library`} className="type-title text-2xl">Goal library</h2>
              <p className="text-sm text-muted-foreground">Open a yearbook to revisit your goals.</p>
            </header>
            {folios.length ? <FolioShelf folios={folios} /> : <p className="text-sm text-muted-foreground">Your yearbooks collect here as goals finish, end, or are archived.</p>}
          </section>
          <section id={anchorSections ? "past-goals" : undefined} aria-labelledby={`${headingId}-past`}>
            <header className="mb-4"><h2 id={`${headingId}-past`} className="type-title text-2xl">Past goals</h2><p className="text-sm text-muted-foreground">Every goal that’s passed.</p></header>
            {folios.length ? <CurrentGoalGrid entries={folios.flatMap(folio => folio.entries)} moving={moving} onDetails={readOnly ? undefined : goalId => router.push(`${prefix}/goals/${goalId}`)} /> : <p className="text-sm text-muted-foreground">Completed, ended, and archived goals collect here.</p>}
          </section>
        </div>}

    </div>
  );
}
