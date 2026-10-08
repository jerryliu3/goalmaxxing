import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/features/ux-refresh/refresh.css";

export const metadata: Metadata = {
  title: "Everyday refresh · Goalmaxxing",
  description:
    "31 interactive UI concepts responding to the application audit.",
  robots: { index: false, follow: false },
};
export default function RefreshLayout({ children }: { children: ReactNode }) {
  return children;
}
