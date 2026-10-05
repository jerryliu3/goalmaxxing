"use client";

import { useSearchParams } from "next/navigation";
import { useCoachPageContext } from "@/features/coach/use-coach-page-context";
import { TabOnboardingOverlay } from "@/features/onboarding/tab-onboarding-overlay";
import { DuoLanes } from "@/features/social/duo/duo-lanes";
import { useDuoSurface } from "@/features/social/duo/use-duo-surface";
import { resolveDuoLanes } from "@cadence/shared/social/duo";
import { InsightsTab } from "@/features/insights/insights-tab";

export function InsightsShell() {
  const searchParams = useSearchParams();
  const { scope, viewer, partner } = useDuoSurface("insights");
  const lanes = resolveDuoLanes({ scope, viewer, partner });
  useCoachPageContext({ surface: "progress", scope: scope === "me" ? "self" : "duo" });
  return <div className="space-y-5">
    <TabOnboardingOverlay onboardingKey="insights.main" forceOpen={searchParams.get("onboarding") === "insights.main"} />
    <DuoLanes scope={scope} viewer={viewer} partner={partner} renderLane={subject => (
      <InsightsTab subjectUserId={subject.userId} readOnly={subject.readOnly}
        progressView="all" sectionIds={["achievements", "past-goals"]}
        anchorSections={subject.id === lanes[0]?.id} />
    )} />
  </div>;
}
