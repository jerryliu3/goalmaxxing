"use client";

import { useCallback } from "react";
import { GoalRouteSheet } from "@/features/goals/goal-route-sheet";
import { GoalForm } from "@/features/today/goal-form";
import { useAppRouter } from "@/lib/navigation/use-app-router";

interface GoalEditSheetEntryProps {
  goalId: string;
}

export function GoalEditSheetEntry({ goalId }: GoalEditSheetEntryProps) {
  const router = useAppRouter();
  const handleDismiss = useCallback(() => {
    router.back();
  }, [router]);
  const handleComplete = useCallback(() => {
    router.back();
    router.refresh();
  }, [router]);

  return (
    <GoalRouteSheet onClose={handleDismiss} title="Edit goal">
      <div className="mx-auto w-full max-w-3xl">
        <GoalForm goalId={goalId} onExit={handleComplete} showBackButton={false} />
      </div>
    </GoalRouteSheet>
  );
}
