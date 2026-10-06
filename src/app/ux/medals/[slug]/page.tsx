import { notFound } from "next/navigation";
import { MedalDirectionPage } from "@/features/ux-medals/direction-page";
import { MEDAL_DIRECTIONS } from "@/features/ux-medals/model";

export function generateStaticParams() {
  return MEDAL_DIRECTIONS.map((direction) => ({ slug: direction.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const direction = MEDAL_DIRECTIONS.find((item) => item.slug === slug);
  return {
    title: direction ? `${direction.name} · Medals study` : "Medals study",
  };
}

export default async function MedalDirectionRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const direction = MEDAL_DIRECTIONS.find((item) => item.slug === slug);
  if (!direction) notFound();
  return <MedalDirectionPage slug={direction.slug} />;
}
