import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Achievements destination study · Goalmaxxing",
  description:
    "Clickable UX concepts that turn Achievements into a trophy case, vault, gallery, records split, or completion rings.",
  robots: { index: false, follow: false },
};

export default function AchievementsStudyLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
