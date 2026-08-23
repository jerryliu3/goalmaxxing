"use client";

import { useEffect } from "react";
import { DemoNewGoalDialog } from "@/features/demo/demo-new-goal-dialog";
import { useAppRouter } from "@/lib/navigation/use-app-router";

export default function DemoNewGoalPage() {
  const router = useAppRouter();
  useEffect(() => {
    router.replace("/calendar");
  }, [router]);
  return <DemoNewGoalDialog open onOpenChange={() => router.replace("/calendar")} />;
}
