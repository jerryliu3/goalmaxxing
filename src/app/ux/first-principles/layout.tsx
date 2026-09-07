import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "First-principles interface study · Goalmaxxing",
  description:
    "Unconstrained interaction concepts for planning, completion, recovery, progress, and social accountability.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function FirstPrinciplesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
