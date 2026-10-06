import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Recovery study · Goalmaxxing",
  description:
    "Clickable UX concepts for reviewing slipped sessions: a ledger sheet, inline calendar chips, and one-at-a-time triage cards.",
  robots: { index: false, follow: false },
};

export default function RecoveryStudyLayout({ children }: { children: ReactNode }) {
  return children;
}
