import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlannerWarningsPanel } from "@/features/planner/planner-warnings-panel";

const emptyEligibility = {
  hardIneligible: [],
  groupedHardIneligible: [],
};

function panel(overrides: { hasPlannerWarnings?: boolean } = {}) {
  return (
    <PlannerWarningsPanel
      hasPlannerWarnings={overrides.hasPlannerWarnings ?? true}
      warningsDismissed={false}
      showBlockingLoading={false}
      error={null}
      plannerWarningBannerCopy="2 goals have conflicting locked sessions."
      warningsOpen={false}
      setWarningsOpen={vi.fn()}
      onDismissBanner={vi.fn()}
      invalidLockGoalSummaries={[]}
      invalidLockGoalCount={0}
      totalInvalidLockSessionCount={0}
      warningSuggestedNextSteps={[]}
      eligibilityNotices={emptyEligibility}
      plannerReadOnly={false}
      canResetPlan={false}
      resetLoading={false}
      loading={false}
      onUnlockAllGoals={vi.fn()}
    />
  );
}

describe("PlannerWarningsPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("omits the planning issues banner from server HTML so it cannot hydrate over the toolbar", () => {
    const html = renderToString(panel());
    expect(html).not.toContain("plan-issues-banner");
  });

  it("shows the planning issues banner after the client mounts", () => {
    render(panel());
    expect(screen.getByTestId("plan-issues-banner")).toBeInTheDocument();
  });
});
