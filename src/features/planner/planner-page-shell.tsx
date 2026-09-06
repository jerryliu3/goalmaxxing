"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { TabOnboardingOverlay } from "@/features/onboarding/tab-onboarding-overlay";

const PlannerSurfaceFallback = () => (
  <div className="rounded-2xl border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
    Loading planner surface...
  </div>
);

const CalendarPageShell = dynamic(
  () =>
    import("@/features/planner/calendar-page-shell").then(
      (module) => module.CalendarPageShell
    ),
  {
    loading: PlannerSurfaceFallback,
  }
);

export function PlannerPageShell() {
  const searchParams = useSearchParams();
  const requestedOnboardingKey = searchParams.get("onboarding");

  return (
    <>
      <TabOnboardingOverlay
        onboardingKey="planner.calendar"
        forceOpen={requestedOnboardingKey === "planner.calendar"}
      />
      <CalendarPageShell />
    </>
  );
}
