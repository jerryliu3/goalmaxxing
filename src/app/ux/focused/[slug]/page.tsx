import { notFound } from "next/navigation";
import {
  focusedStudy,
  focusedVariant,
  FOCUSED_STUDIES,
} from "@/features/ux-focused/catalog";
import { FocusedStudyPage } from "@/features/ux-focused/study";
export function generateStaticParams() {
  return FOCUSED_STUDIES.map(({ slug }) => ({ slug }));
}
export default async function FocusedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string }>;
}) {
  const study = focusedStudy((await params).slug);
  if (!study) notFound();
  const variant = focusedVariant(
    (await searchParams).variant,
    study.variants.length,
  );
  return (
    <FocusedStudyPage
      key={`${study.slug}-${variant}`}
      study={study}
      variant={variant}
    />
  );
}
