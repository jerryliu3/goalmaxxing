import type { Metadata } from "next";
import { PlaqueMotionStudy } from "@/features/ux-brand/plaque-motion/plaque-motion-study";

export const metadata: Metadata = { title: "Plaque motion · Goalmaxxing" };

export default function DemoPlaqueMotionPage() {
  return <PlaqueMotionStudy share />;
}
