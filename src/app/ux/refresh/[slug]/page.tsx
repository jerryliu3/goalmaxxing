import { notFound } from "next/navigation";
import {
  findRefreshConcept,
  REFRESH_CONCEPTS,
} from "@/features/ux-refresh/catalog";
import { RefreshStudy } from "@/features/ux-refresh/study";

export function generateStaticParams() {
  return REFRESH_CONCEPTS.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const concept = findRefreshConcept((await params).slug);
  return {
    title: concept ? `${concept.title} · Everyday refresh` : "Everyday refresh",
  };
}
export default async function ConceptPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string }>;
}) {
  const concept = findRefreshConcept((await params).slug);
  if (!concept) notFound();
  const requested = (await searchParams).variant;
  const variant = requested === "b" && concept.variants.length > 1 ? 1 : 0;
  return (
    <RefreshStudy
      key={`${concept.slug}-${variant}`}
      concept={concept}
      variant={variant}
    />
  );
}
