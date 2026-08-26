import type { useAppRouter } from "@/lib/navigation/use-app-router";

type AppRouter = ReturnType<typeof useAppRouter>;

export const goalEditorFallbackHref = "/calendar";

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
