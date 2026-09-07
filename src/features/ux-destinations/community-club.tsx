"use client";

import { ConceptNote, DestinationChrome } from "@/features/ux-destinations/chrome";
import { CommunityCompete, type CompeteTreatment } from "@/features/ux-destinations/community-compete";
import { CommunityTeam } from "@/features/ux-destinations/community-team";
import {
  getDestinationConcept,
  type DestinationConceptSlug,
} from "@/features/ux-destinations/model";

export function CommunityClubConcept() {
  return <CommunitySurface slug="club" treatment="peek" />;
}

export function CommunityRanksConcept() {
  return <CommunitySurface slug="ranks" treatment="open" />;
}

export function CommunityStageConcept() {
  return <CommunitySurface slug="stage" treatment="stage" />;
}

function CommunitySurface({
  slug,
  treatment,
}: {
  slug: DestinationConceptSlug;
  treatment: CompeteTreatment;
}) {
  const concept = getDestinationConcept(slug);

  return (
    <DestinationChrome
      concept={concept}
      title="Community"
      trailing={<p className="text-xs text-muted-foreground">Live · 12s</p>}
    >
      <div className="space-y-8 pt-5">
        <CommunityTeam />
        <CommunityCompete treatment={treatment} />
      </div>
      <ConceptNote concept={concept} />
    </DestinationChrome>
  );
}
