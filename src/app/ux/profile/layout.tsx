import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Profile study · Goalmaxxing",
  description:
    "Clickable UX concepts for a public profile that curates Growth instead of duplicating it, plus the proposed tab map.",
  robots: { index: false, follow: false },
};

export default function ProfileStudyLayout({ children }: { children: ReactNode }) {
  return children;
}
