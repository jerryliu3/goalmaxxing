"use client";

import { GoalsCollectionPage } from "@/features/insights/folio/goals-collection-page";
import { DuoLanes } from "@/features/social/duo/duo-lanes";
import { useDuoSurface } from "@/features/social/duo/use-duo-surface";
import { resolveDuoLanes } from "@cadence/shared/social/duo";

export function GoalsDestination() {
  const { scope, viewer, partner } = useDuoSurface("calendar");
  const lanes = resolveDuoLanes({ scope, viewer, partner });
  return <DuoLanes scope={scope} viewer={viewer} partner={partner} renderLane={subject => (
    <GoalsCollectionPage subjectUserId={subject.userId}
      readOnly={subject.readOnly} anchorSections={subject.id === lanes[0]?.id} />
  )} />;
}
