import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Day work study · Goalmaxxing",
  description:
    "Clickable UX concepts for opening a checklist goal and for replacing the checklist with a deck, gazette, or day path.",
  robots: { index: false, follow: false },
};

export default function DayWorkStudyLayout({ children }: { children: ReactNode }) {
  return children;
}
