import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "UX concepts",
  robots: {
    index: false,
    follow: false,
  },
};

export default function UxConceptsLayout({ children }: { children: ReactNode }) {
  return children;
}
