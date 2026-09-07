import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MonthHeatmap } from "@/features/insights/month-heatmap";

describe("MonthHeatmap", () => {
  it("disables future days when the parent marks them closed", () => {
    render(
      <MonthHeatmap
        month={new Date(2026, 8, 1)}
        countsByDate={{ "2026-09-01": 1, "2026-09-07": 0 }}
        interactive
        isDayDisabled={(date) => date > "2026-09-06"}
        onDayClick={() => {}}
      />
    );

    expect(screen.getByRole("button", { name: "1" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "7" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "1" })).toHaveClass("rounded-[8px]");
    expect(screen.queryByLabelText("Previous month")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Next month")).not.toBeInTheDocument();
  });
});
