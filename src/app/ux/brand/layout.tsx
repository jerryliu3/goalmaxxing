import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Visual language concepts",
  description:
    "Unlisted Goalmaxxing visual language gallery. Direct link only — not in navigation or search.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  openGraph: {
    title: "Goalmaxxing visual language (unlisted)",
    description:
      "Exploratory type, color, and motif directions. Not the production app.",
    url: "/ux/brand",
  },
};

export default function UxBrandLayout({ children }: { children: ReactNode }) {
  return children;
}
