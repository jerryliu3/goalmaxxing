import type { Metadata } from "next";
import { InterfaceCraftStudy } from "@/features/ux-interface-craft/study";

export const metadata: Metadata = { title: "Everyday interface · UX labs" };

export default function InterfaceCraftPage() {
  return <InterfaceCraftStudy />;
}
