import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/features/ux-refresh/refresh.css";
import "@/features/ux-focused/focused.css";
export const metadata: Metadata = {
  title: "Focused interface studies · Goalmaxxing",
  robots: { index: false, follow: false },
};
export default function FocusedLayout({ children }: { children: ReactNode }) {
  return children;
}
