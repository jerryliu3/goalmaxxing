import type { Metadata } from "next";
import { PastGoalsPage } from "@/features/insights/folio/past-goals-page";

export const metadata: Metadata = { title: "Past goals · Goalmaxxing" };

export default function GoalFoliosPage() {
  return <PastGoalsPage />;
}
