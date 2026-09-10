import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlannerWarningsPanel } from "@/features/planner/planner-warnings-panel";

const emptyEligibility = {
  hardIneligible: [],
  groupedHardIneligible: [],
  linkedTargetCount: 0,
  linkedTargetDetails: [],
};

function panel(overrides: { hasPlannerWarnings?: boolean } = {}) {
  return (
    <PlannerWarningsPanel
      hasPlannerWarnings={overrides.hasPlannerWarnings ?? true}
      warningsDismissed={false}
      showBlockingLoading={false}
      error={null}
      plannerWarningBannerCopy="2 goals still have sessions to recover."
      warningsOpen={false}
      setWarningsOpen={vi.fn()}
      onDismissBanner={vi.fn()}
      unplaceableGoalSummaries={[]}
      invalidLockGoalCount={0}
      capacityWarningGoalCount={0}
      totalUnplacedCount={0}
      warningSuggestedNextSteps={[]}
      eligibilityNotices={emptyEligibility}
      plannerReadOnly={false}
      canResetPlan={false}
      resetLoading={false}
      loading={false}
      onUnlockAllGoals={vi.fn()}
      onOpenPlannerSettings={vi.fn()}
    />
  );
}

describe("PlannerWarningsPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("omits the recover banner from server HTML so it cannot hydrate over the toolbar", () => {
    const html = renderToString(panel());
    expect(html).not.toContain("plan-recover-banner");
  });

  it("shows the recover banner after the client mounts", () => {
    render(panel());
    expect(screen.getByTestId("plan-recover-banner")).toBeInTheDocument();
  });
});
