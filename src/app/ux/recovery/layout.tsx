import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Recovery study · Goalmaxxing",
  description:
    "Clickable UX concepts for reviewing slipped sessions: goal by goal with a recap of every change, and recovery inside Goal View’s lanes.",
  robots: { index: false, follow: false },
};

export default function RecoveryStudyLayout({ children }: { children: ReactNode }) {
  return children;
}
