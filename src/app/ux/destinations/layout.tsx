import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Progress and Community destination study · Goalmaxxing",
  description:
    "Clickable UX concepts for Progress and Community that keep product capabilities and raise them to Plan-tab quality.",
  robots: { index: false, follow: false },
};

export default function DestinationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
