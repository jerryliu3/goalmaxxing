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
import { buildCurrentGoals, buildFolioEntries, buildGoalBooks, splitPastGoals } from "./folio-model";
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
  const currentYear = String(new Date().getFullYear());
  const { state, loading, loadError, reload } = useInsightsData({ subjectUserId, selectedYear: currentYear, failClosed: readOnly });
  useReportAppSurfaceReady(!loading);
  const entries = useMemo(() => buildFolioEntries(state.goals, state.progress?.summaries ?? [], state.userId), [state.goals, state.progress, state.userId]);
  const current = useMemo(() => buildCurrentGoals(state.goals, state.progress?.summaries ?? [], state.userId), [state.goals, state.progress, state.userId]);
  const { past, archived } = useMemo(() => splitPastGoals(entries), [entries]);
  const books = useMemo(() => buildGoalBooks(past, currentYear), [past, currentYear]);
  const openDetails = readOnly ? undefined : (goalId: string) => router.push(`${prefix}/goals/${goalId}`);
  return (
    <div className={styles.page}>
      {loadError ? <div className={styles.empty} role="alert"><h2>Your collection couldn’t be loaded.</h2><p>{loadError}</p><Button variant="outline" className="mt-5" onClick={reload}>Try again</Button></div>
        : loading || !state.progress ? <LoadingCard title="Opening your collection..." description="Gathering your goals." />
        : <div className="space-y-8">
          <section aria-labelledby={`${headingId}-current`}>
            <h1 id={`${headingId}-current`} className="type-title mb-4 text-2xl">Current goals</h1>
            <CurrentGoalGrid entries={current} moving={moving} leadingCard={readOnly ? undefined : <NewGoalButton presentation="card" />} onDetails={openDetails} />
          </section>
          <section id={anchorSections ? "past-goals" : undefined} aria-labelledby={`${headingId}-past`}>
            <h2 id={`${headingId}-past`} className="type-title mb-4 text-2xl">Past goals</h2>
            {books.length ? <FolioShelf folios={books} compact onDetails={openDetails} /> : <p className="text-sm text-muted-foreground">Completed and ended goals collect here.</p>}
          </section>
          {archived.length ? <section id={anchorSections ? "archived-goals" : undefined} aria-labelledby={`${headingId}-archived`}>
            <h2 id={`${headingId}-archived`} className="type-title mb-4 text-2xl">Archived goals</h2>
            <CurrentGoalGrid entries={archived} moving={moving} onDetails={openDetails} />
          </section> : null}
        </div>}

    </div>
  );
}
