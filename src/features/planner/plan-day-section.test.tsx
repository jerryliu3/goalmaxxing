import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PlanDaySection } from "@/features/planner/plan-day-section";

describe("PlanDaySection", () => {
  afterEach(() => {
    cleanup();
  });

  it("starts expanded and can collapse", () => {
    render(
      <PlanDaySection title="Planned goals" count={2}>
        <p>Row</p>
      </PlanDaySection>
    );

    expect(screen.getByRole("button", { name: /Planned goals/ })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByText("Row")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Planned goals/ }));
    expect(screen.getByRole("button", { name: /Planned goals/ })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("can start collapsed", () => {
    render(
      <PlanDaySection title="Unplanned goals" defaultOpen={false}>
        <p>Hidden until opened</p>
      </PlanDaySection>
    );

    expect(screen.getByRole("button", { name: /Unplanned goals/ })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("keeps section titles on the body font, larger than ledger item titles", () => {
    render(
      <PlanDaySection title="Scheduled goals" count={3}>
        <p>Row</p>
      </PlanDaySection>
    );

    expect(screen.getByRole("button", { name: /Scheduled goals 3/ })).toHaveClass(
      "font-sans",
      "text-base"
    );
  });
});
