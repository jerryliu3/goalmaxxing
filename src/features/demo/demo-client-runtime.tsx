"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DemoBanner } from "@/features/demo/demo-banner";
import { DemoClickGuard } from "@/features/demo/demo-click-guard";
import { DemoNewGoalDialog } from "@/features/demo/demo-new-goal-dialog";
import { DEMO_ALEX_ID } from "@/features/demo/demo-ids";
import { installDemoRuntime } from "@/features/demo/demo-runtime";
import { toLocalDateString } from "@/lib/dates/day";
import { DEMO_PATH_PREFIX } from "@/lib/navigation/demo-path";

export function DemoClientRuntime({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [newGoalOpen, setNewGoalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const snapshot = mounted ? installDemoRuntime(toLocalDateString()) : null;

  return (
    <div className="min-h-screen bg-background">
      <DemoBanner />
      {snapshot ? (
        <>
          <DemoClickGuard />
          <AppShell
            userId={DEMO_ALEX_ID}
            viewerLabel="Alex"
            hrefPrefix={DEMO_PATH_PREFIX}
            showJourneyIntro={false}
            onNewGoalClick={() => setNewGoalOpen(true)}
            duoState={snapshot.duoState}
            duoAvailability="ready"
            initialDuoScopePreference="me"
            plannerPrimaryTabPreference="calendar"
            journeyFlags={{ journeyEnabled: false }}
          >
            <Suspense fallback={null}>{children}</Suspense>
          </AppShell>
          <DemoNewGoalDialog open={newGoalOpen} onOpenChange={setNewGoalOpen} />
        </>
      ) : (
        <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground" aria-busy>
          Loading demo…
        </div>
      )}
    </div>
  );
}
