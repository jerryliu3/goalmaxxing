import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InsightsGoalCardHeader } from "@/features/insights/insights-goal-card-header";
import { InsightsStatPlaque } from "@/features/insights/insights-stats-ui";
import { PlanDaySection } from "@/features/planner/plan-day-section";
import { TeamXpSummary } from "@/features/social/team/team-xp-summary";

describe("Gazetteer type roles on live surfaces", () => {
  afterEach(() => {
    cleanup();
  });

  it("puts names on display and figures on mono", () => {
    render(
      <>
        <InsightsGoalCardHeader
          title="Tempo run"
          color="#9a4f2c"
          categoryLabel="Health"
          categoryClassName=""
          endDate={null}
          daysRemaining={null}
        />
        <ul>
          <InsightsStatPlaque label="Sessions" value="12" />
        </ul>
        <TeamXpSummary totalXp={240} />
        <PlanDaySection title="Scheduled goals" count={3}>
          <p>Row</p>
        </PlanDaySection>
      </>
    );

    expect(screen.getByText("Tempo run")).toHaveClass("font-display");
    expect(screen.getByText("12")).toHaveClass("font-mono");
    expect(screen.getByText("240 XP")).toHaveClass("font-mono");
    expect(screen.getByRole("button", { name: /Scheduled goals/ })).toHaveClass(
      "font-sans"
    );
    expect(screen.getByText("3")).toHaveClass("font-mono");
  });
});
