"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PlannerEligibilityNotices } from "@/features/planner/planner-eligibility-notices";

const subscribeToNothing = () => () => {};

interface PlannerWarningsPanelProps {
  hasPlannerWarnings: boolean;
  warningsDismissed: boolean;
  showBlockingLoading: boolean;
  error: string | null;
  plannerWarningBannerCopy: string;
  warningsOpen: boolean;
  setWarningsOpen: (open: boolean) => void;
  onDismissBanner: () => void;
  invalidLockGoalSummaries: Array<{
    goalId: string;
    title: string;
    unplacedCount: number;
    reason: "capacity" | "invalid_lock";
  }>;
  invalidLockGoalCount: number;
  totalInvalidLockSessionCount: number;
  warningSuggestedNextSteps: string[];
  eligibilityNotices: PlannerEligibilityNotices;
  plannerReadOnly: boolean;
  canResetPlan: boolean;
  resetLoading: boolean;
  loading: boolean;
  onUnlockAllGoals: () => void;
}

export function PlannerWarningsPanel({
  hasPlannerWarnings,
  warningsDismissed,
  showBlockingLoading,
  error,
  plannerWarningBannerCopy,
  warningsOpen,
  setWarningsOpen,
  onDismissBanner,
  invalidLockGoalSummaries,
  invalidLockGoalCount,
  totalInvalidLockSessionCount,
  warningSuggestedNextSteps,
  eligibilityNotices,
  plannerReadOnly,
  canResetPlan,
  resetLoading,
  loading,
  onUnlockAllGoals,
}: PlannerWarningsPanelProps) {
  const isClient = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  );
  const showPlanningIssuesBanner =
    isClient &&
    hasPlannerWarnings &&
    !warningsDismissed &&
    !showBlockingLoading &&
    !error;

  return (
    <>
      {showPlanningIssuesBanner ? (
        <div
          className="rounded-[10px] border border-warning bg-warning-fill px-3 py-2 text-xs text-foreground shadow-[inset_3px_0_0_0_var(--color-warning)]"
          data-testid="plan-issues-banner"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 flex-1">{plannerWarningBannerCopy}</p>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 border-warning bg-background text-xs text-foreground"
                onClick={() => setWarningsOpen(true)}
              >
                Review
              </Button>
              <button
                type="button"
                className="text-xs font-medium underline-offset-2 hover:underline"
                onClick={onDismissBanner}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={warningsOpen} onOpenChange={setWarningsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Planning issues</DialogTitle>
            <DialogDescription>
              {invalidLockGoalCount > 0
                ? `${invalidLockGoalCount} goal${invalidLockGoalCount === 1 ? " has" : "s have"} conflicting locked sessions (${totalInvalidLockSessionCount} session${totalInvalidLockSessionCount === 1 ? "" : "s"}).`
                : "Review goal settings that prevent scheduling."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {invalidLockGoalSummaries.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Conflicting locked sessions
                </p>
                <div
                  className={`space-y-2 ${
                    invalidLockGoalSummaries.length > 5
                      ? "max-h-[17.5rem] overflow-y-auto pr-1"
                      : ""
                  }`}
                >
                  {invalidLockGoalSummaries.map((warning) => (
                    <div key={`warning-${warning.goalId}`} className="rounded-md border p-2">
                      <p className="font-medium">{warning.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {warning.unplacedCount} unresolved session
                        {warning.unplacedCount === 1 ? "" : "s"} (locked conflict)
                      </p>
                    </div>
                  ))}
                </div>
                {warningSuggestedNextSteps.length > 0 ? (
                  <div className="rounded-md border bg-muted/20 p-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Suggested next steps
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                      {warningSuggestedNextSteps.map((suggestion) => (
                        <li key={suggestion}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
            {eligibilityNotices.hardIneligible.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Eligibility blockers
                </p>
                {eligibilityNotices.groupedHardIneligible.map((group) => (
                  <div
                    key={`eligibility-group-${group.reason}`}
                    className={`space-y-1 rounded-md border bg-muted/20 p-2 text-xs text-muted-foreground ${
                      group.entries.length > 5
                        ? "max-h-36 overflow-y-auto pr-1"
                        : ""
                    }`}
                  >
                    <p className="font-medium text-foreground">{group.heading}</p>
                    {group.entries.map((item) => (
                      <p key={`eligibility-warning-${item.goalId}`}>
                        {item.goalTitle}: {item.reasonCopy}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            ) : null}
            {invalidLockGoalCount > 0 && !plannerReadOnly ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={resetLoading || loading || !canResetPlan}
                onClick={onUnlockAllGoals}
              >
                {resetLoading ? "Unlocking..." : "Unlock all goals"}
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
