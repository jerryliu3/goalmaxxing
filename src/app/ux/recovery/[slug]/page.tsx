import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import {
  RECOVERY_CONCEPTS,
  type RecoveryConceptSlug,
} from "@/features/ux-recovery/concepts";
import { GoalByGoalConcept } from "@/features/ux-recovery/goal-by-goal-concept";
import { GoalViewConcept } from "@/features/ux-recovery/goal-view-concept";

const CONCEPT_PAGES = {
  "goal-by-goal": GoalByGoalConcept,
  "goal-view": GoalViewConcept,
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
