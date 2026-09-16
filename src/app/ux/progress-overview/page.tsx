import { Suspense } from "react";
import { ProgressOverviewStudy } from "@/features/ux-progress-overview/study";

export default function ProgressOverviewPage() {
  return <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Opening Progress study…</p>}><ProgressOverviewStudy /></Suspense>;
}
