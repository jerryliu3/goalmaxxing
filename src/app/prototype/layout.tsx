import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireUxLabAccess } from "@/lib/api/ux-lab-access";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PrototypeLayout({ children }: { children: ReactNode }) {
  await requireUxLabAccess();
  return children;
}
