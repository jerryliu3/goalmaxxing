"use client";

import { useCallback } from "react";
import {
  completeGoalEditor,
  dismissGoalEditor,
} from "@/features/goals/goal-editor-navigation";
import { GoalRouteSheet } from "@/features/goals/goal-route-sheet";
import { GoalCardEditor } from "@/features/goals/card-editor/goal-card-editor";
import { useAppRouter } from "@/lib/navigation/use-app-router";

interface GoalEditSheetEntryProps {
  goalId: string;
}

export function GoalEditSheetEntry({ goalId }: GoalEditSheetEntryProps) {
  const router = useAppRouter();
  const handleDismiss = useCallback(() => {
    dismissGoalEditor(router);
  }, [router]);
  const handleComplete = useCallback(() => {
    completeGoalEditor(router);
  }, [router]);

  return (
    <GoalRouteSheet onClose={handleDismiss} title="Edit goal">
      <GoalCardEditor goalId={goalId} onExit={handleComplete} onDismiss={handleDismiss} />
    </GoalRouteSheet>
  );
}
