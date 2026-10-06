import type { useAppRouter } from "@/lib/navigation/use-app-router";

type AppRouter = ReturnType<typeof useAppRouter>;

export const goalEditorFallbackHref = "/calendar";

/**
 * Routes the goal sheet opens over the current page (`/goals/new`, `/goals/:id`).
 * `/goals/library` and `/goals/bulk` are pages of their own.
 */
export function isGoalSheetPath(pathname: string) {
  return /\/goals\/(?!library$|bulk$)[^/]+$/.test(pathname);
}

export function dismissGoalEditor(router: AppRouter) {
  if (typeof window !== "undefined" && window.history.length > 1) {
    router.back();
    return;
  }
  router.replace(goalEditorFallbackHref);
}

export function completeGoalEditor(router: AppRouter) {
  dismissGoalEditor(router);
  router.refresh();
}
