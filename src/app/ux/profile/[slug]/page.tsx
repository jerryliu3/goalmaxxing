import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import { AudienceConcept } from "@/features/ux-profile/audience-concept";
import { PROFILE_CONCEPTS, type ProfileConceptSlug } from "@/features/ux-profile/model";
import { OwnerPageConcept } from "@/features/ux-profile/owner-page-concept";
import { PinFromGrowthConcept } from "@/features/ux-profile/pin-from-growth-concept";
import { SettingsCardConcept } from "@/features/ux-profile/settings-card-concept";

const CONCEPT_PAGES = {
  "owner-page": OwnerPageConcept,
  "settings-card": SettingsCardConcept,
  "pin-from-growth": PinFromGrowthConcept,
  audience: AudienceConcept,
} as const satisfies Record<ProfileConceptSlug, ComponentType>;

export function generateStaticParams() {
  return PROFILE_CONCEPTS.map((concept) => ({ slug: concept.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const concept = PROFILE_CONCEPTS.find((item) => item.slug === slug);
  return {
    title: concept ? `${concept.letter} · ${concept.name} · Profile study` : "Profile study",
  };
}

export default async function ProfileConceptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const View = CONCEPT_PAGES[slug as ProfileConceptSlug];
  if (!View) notFound();
  return <View />;
}
