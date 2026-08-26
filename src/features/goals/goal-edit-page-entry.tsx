"use client";

import { useCallback } from "react";
import {
  completeGoalEditor,
  dismissGoalEditor,
} from "@/features/goals/goal-editor-navigation";
import { GoalForm } from "@/features/today/goal-form";
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
    <div className="mx-auto w-full max-w-3xl">
      <GoalForm
        goalId={goalId}
        onExit={handleComplete}
        onDismiss={handleDismiss}
      />
    </div>
  );
}
