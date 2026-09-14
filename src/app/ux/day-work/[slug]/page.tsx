import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import { DeckConcept } from "@/features/ux-day-work/deck-concept";
import { FolioConcept } from "@/features/ux-day-work/folio-concept";
import { GazetteConcept } from "@/features/ux-day-work/gazette-concept";
import {
  DAY_WORK_CONCEPTS,
  type DayWorkConceptSlug,
} from "@/features/ux-day-work/model";
import { NowConcept } from "@/features/ux-day-work/now-concept";
import { PeekConcept } from "@/features/ux-day-work/peek-concept";
import { PhraseConcept } from "@/features/ux-day-work/phrase-concept";
import { StationsConcept } from "@/features/ux-day-work/stations-concept";

const CONCEPT_PAGES = {
  now: NowConcept,
  folio: FolioConcept,
  phrase: PhraseConcept,
  peek: PeekConcept,
  deck: DeckConcept,
  gazette: GazetteConcept,
  stations: StationsConcept,
} as const satisfies Record<DayWorkConceptSlug, ComponentType>;

export function generateStaticParams() {
  return DAY_WORK_CONCEPTS.map((concept) => ({ slug: concept.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const concept = DAY_WORK_CONCEPTS.find((item) => item.slug === slug);
  return {
    title: concept ? `${concept.name} · Day work study` : "Day work study",
  };
}

export default async function DayWorkConceptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const View = CONCEPT_PAGES[slug as DayWorkConceptSlug];
  if (!View) notFound();
  return <View />;
}
