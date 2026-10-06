import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CardTitle } from "@/components/ui/card";
import { InsightsStatPlaque } from "@/features/insights/insights-stats-ui";
import { PlanDaySection } from "@/features/planner/plan-day-section";

describe("text roles on live surfaces", () => {
  afterEach(() => {
    cleanup();
  });

  it("gives stat tiles a stat figure under an eyebrow label", () => {
    render(
      <ul>
        <InsightsStatPlaque label="Sessions" value="12" />
      </ul>
    );

    expect(screen.getByText("12")).toHaveClass("type-stat");
    expect(screen.getByText("Sessions")).toHaveClass("type-eyebrow");
  });

  it("sets section titles as headings and keeps counts on mono", () => {
    render(
      <PlanDaySection title="Scheduled goals" count={3}>
        <p>Row</p>
      </PlanDaySection>
    );

    expect(screen.getByRole("button", { name: /Scheduled goals/ })).toHaveClass("type-heading");
    expect(screen.getByText("3")).toHaveClass("font-mono");
  });

  it("lets the theme choose card heading weight", () => {
    render(<CardTitle>Goalmaxxing score</CardTitle>);

    const title = screen.getByText("Goalmaxxing score");
    expect(title).toHaveClass("type-heading");
    expect(title.className).not.toMatch(/\bfont-(medium|semibold|display)\b/);
  });
});
