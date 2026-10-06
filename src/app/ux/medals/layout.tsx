import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Medals study · Goalmaxxing",
  description:
    "Four Gazetteer medal directions — postmark, letterpress seal, enamel pin, engraved coin — with named ranks, locked states, unlock moments, and future families.",
  robots: { index: false, follow: false },
};

export default function MedalsStudyLayout({ children }: { children: ReactNode }) {
  return children;
}
