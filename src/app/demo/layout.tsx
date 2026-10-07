import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DemoClientRuntime } from "@/features/demo/demo-client-runtime";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DemoLayout({
  children,
  goalSheet,
}: {
  children: ReactNode;
  goalSheet?: ReactNode;
}) {
  return <DemoClientRuntime goalSheet={goalSheet}>{children}</DemoClientRuntime>;
}
