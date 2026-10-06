import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import { BlankCardConcept } from "@/features/ux-goal-creation/blank-card-concept";
import {
  GOAL_CREATION_CONCEPTS,
  type GoalCreationConceptSlug,
} from "@/features/ux-goal-creation/model";
import { SayItConcept } from "@/features/ux-goal-creation/say-it-concept";
import { StampConcept } from "@/features/ux-goal-creation/stamp-concept";

const CONCEPT_PAGES = {
  "blank-card": BlankCardConcept,
  stamp: StampConcept,
  "say-it": SayItConcept,
} as const satisfies Record<GoalCreationConceptSlug, ComponentType>;

export function generateStaticParams() {
  return GOAL_CREATION_CONCEPTS.map((concept) => ({ slug: concept.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const concept = GOAL_CREATION_CONCEPTS.find((item) => item.slug === slug);
  return {
    title: concept ? `${concept.name} · Goal creation study` : "Goal creation study",
  };
}

export default async function GoalCreationConceptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const View = CONCEPT_PAGES[slug as GoalCreationConceptSlug];
  if (!View) notFound();
  return <View />;
}
