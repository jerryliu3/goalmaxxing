import type { Metadata } from "next";
import { CoachExperiencePrototype } from "@/features/coach-prototype/prototype";

export const metadata: Metadata = {
  title: "Companion · Coach experience prototype",
  robots: { index: false, follow: false },
};

export default function CoachPrototypePage() {
  return <CoachExperiencePrototype />;
}
