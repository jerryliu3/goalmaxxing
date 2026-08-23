"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { GoalCreationEntry } from "@/features/goals/goal-creation-entry";
import { GoalRouteSheet } from "@/features/goals/goal-route-sheet";
import { resolveSafePostLoginPath } from "@/lib/auth/login-redirect";
import { useAppRouter } from "@/lib/navigation/use-app-router";

export function GoalNewSheetEntry() {
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const returnTo = useMemo(() => {
    const candidate = searchParams.get("returnTo");
    if (!candidate) {
      return null;
    }
    return resolveSafePostLoginPath(candidate);
  }, [searchParams]);
  const closeSheet = useCallback(() => {
    if (returnTo) {
      router.replace(returnTo);
      return;
    }
    router.back();
  }, [returnTo, router]);
  const handleDismiss = useCallback(() => {
    closeSheet();
  }, [closeSheet]);
  const handleComplete = useCallback(() => {
    closeSheet();
    router.refresh();
  }, [closeSheet, router]);

  return (
    <GoalRouteSheet onClose={handleDismiss} title="Create goal">
      <GoalCreationEntry onExit={handleComplete} />
    </GoalRouteSheet>
  );
}
