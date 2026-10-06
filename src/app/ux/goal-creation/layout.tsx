import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Goal creation study · Goalmaxxing",
  description:
    "Clickable UX concepts that create a goal on the same card used to edit it: a blank card, stamp by stamp, or one sentence.",
  robots: { index: false, follow: false },
};

export default function GoalCreationStudyLayout({ children }: { children: ReactNode }) {
  return children;
}
