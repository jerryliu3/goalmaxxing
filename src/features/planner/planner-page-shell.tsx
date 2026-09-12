"use client";

import { useSearchParams } from "next/navigation";
import { CalendarPageShell } from "@/features/planner/calendar-page-shell";
import { TabOnboardingOverlay } from "@/features/onboarding/tab-onboarding-overlay";

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
