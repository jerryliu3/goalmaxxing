import { notFound } from "next/navigation";
import { focusedStudy, FOCUSED_STUDIES } from "@/features/ux-focused/catalog";
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
  const variant =
    (await searchParams).variant === "b" && study.variants.length > 1 ? 1 : 0;
  return (
    <FocusedStudyPage
      key={`${study.slug}-${variant}`}
      study={study}
      variant={variant}
    />
  );
}
