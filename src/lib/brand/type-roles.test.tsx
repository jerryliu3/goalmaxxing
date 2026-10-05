import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InsightsStatPlaque } from "@/features/insights/insights-stats-ui";
import { PlanDaySection } from "@/features/planner/plan-day-section";

describe("Gazetteer type roles on live surfaces", () => {
  afterEach(() => {
    cleanup();
  });

  it("puts figures on mono and section labels on sans", () => {
    render(
      <>
        <ul>
          <InsightsStatPlaque label="Sessions" value="12" />
        </ul>
        <PlanDaySection title="Scheduled goals" count={3}>
          <p>Row</p>
        </PlanDaySection>
      </>
    );

    expect(screen.getByText("12")).toHaveClass("font-mono");
    expect(screen.getByRole("button", { name: /Scheduled goals/ })).toHaveClass(
      "font-sans"
    );
    expect(screen.getByText("3")).toHaveClass("font-mono");
  });
});
