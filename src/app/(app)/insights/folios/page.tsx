import type { Metadata } from "next";
import { GoalLibraryPage } from "@/features/insights/folio/goal-library-page";

export const metadata: Metadata = { title: "Goal library · Goalmaxxing" };

export default async function GoalFoliosPage({ searchParams }: { searchParams: Promise<{ view?: string; from?: string }> }) {
  const params = await searchParams;
  return <GoalLibraryPage view={params.view === "past" ? "past" : "current"} fromPlan={params.from === "plan"} />;
}
