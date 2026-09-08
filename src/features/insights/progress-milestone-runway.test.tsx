import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProgressMilestoneRunway } from "@/features/insights/progress-milestone-runway";

describe("ProgressMilestoneRunway", () => {
  it("renders a horizontal runway of stops and reports the selected date", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <ProgressMilestoneRunway
        title="Thesis"
        countLabel="4/10 milestones"
        activeDate="2026-09-01"
        onSelect={onSelect}
        stops={[
          { name: "Proposal", date: "2026-09-01" },
          { name: "Draft", date: null },
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: "Thesis" })).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Proposal/ })).toHaveAttribute(
      "aria-current",
      "step"
    );

    await user.click(screen.getByRole("button", { name: /Draft/ }));
    expect(onSelect).toHaveBeenCalledWith({ name: "Draft", date: null }, 1);
  });
});
