"use client";

import { useCallback } from "react";
import {
  completeGoalEditor,
  dismissGoalEditor,
} from "@/features/goals/goal-editor-navigation";
import { GoalCardEditor } from "@/features/goals/card-editor/goal-card-editor";
import { useAppRouter } from "@/lib/navigation/use-app-router";

interface GoalEditPageEntryProps {
  goalId: string;
}

export function GoalEditPageEntry({ goalId }: GoalEditPageEntryProps) {
  const router = useAppRouter();
  const handleDismiss = useCallback(() => {
    dismissGoalEditor(router);
  }, [router]);
  const handleComplete = useCallback(() => {
    completeGoalEditor(router);
  }, [router]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <GoalCardEditor goalId={goalId} onExit={handleComplete} onDismiss={handleDismiss} />
    </div>
  );
}
