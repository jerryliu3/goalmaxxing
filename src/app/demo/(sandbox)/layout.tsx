import type { ReactNode } from "react";
import { DemoClientRuntime } from "@/features/demo/demo-client-runtime";

export default function DemoSandboxLayout({ children }: { children: ReactNode }) {
  return <DemoClientRuntime>{children}</DemoClientRuntime>;
}
