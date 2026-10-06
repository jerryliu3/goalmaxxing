import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Medals study · Goalmaxxing",
  description:
    "Round 3 premium medals — Machined and Prism — built from the goal card's materials (anodized metal, enamel, crystal, chromatic foil) across every award family, beside the real card, with the Round 2 flat systems kept as references.",
  robots: { index: false, follow: false },
};

export default function MedalsStudyLayout({ children }: { children: ReactNode }) {
  return children;
}
