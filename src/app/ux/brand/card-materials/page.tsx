import type { Metadata } from "next";
import { CardMaterialsStudy } from "@/features/ux-brand/card-materials/card-materials-study";

export const metadata: Metadata = { title: "Card materials · Goalmaxxing" };

export default function CardMaterialsPage() {
  return <CardMaterialsStudy />;
}
