import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import { CalendarConcept } from "@/features/ux-recovery/calendar-concept";
import {
  RECOVERY_CONCEPTS,
  type RecoveryConceptSlug,
} from "@/features/ux-recovery/concepts";
import { DeckConcept } from "@/features/ux-recovery/deck-concept";
import { LedgerConcept } from "@/features/ux-recovery/ledger-concept";

const CONCEPT_PAGES = {
  ledger: LedgerConcept,
  calendar: CalendarConcept,
  deck: DeckConcept,
} as const satisfies Record<RecoveryConceptSlug, ComponentType>;

export function generateStaticParams() {
  return RECOVERY_CONCEPTS.map((concept) => ({ slug: concept.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const concept = RECOVERY_CONCEPTS.find((item) => item.slug === slug);
  return {
    title: concept ? `${concept.name} · Recovery study` : "Recovery study",
  };
}

export default async function RecoveryConceptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const View = CONCEPT_PAGES[slug as RecoveryConceptSlug];
  if (!View) notFound();
  return <View />;
}
