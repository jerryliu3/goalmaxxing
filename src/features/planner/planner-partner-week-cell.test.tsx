import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlannerPartnerWeekDayCell } from "@/features/planner/planner-partner-week-cell";

describe("PlannerPartnerWeekDayCell", () => {
  it("renders partner completions as a read-only presence", () => {
    render(
      <PlannerPartnerWeekDayCell
        day="2026-09-06"
        inMonth
        isToday
        markers={[
          {
            key: "partner-1",
            originalGoalId: "goal-1",
            unitKey: "fact",
            goalTitle: "Yoga",
            scheduledDate: "2026-09-06",
            owner: "partner",
          },
        ]}
      />
    );

    expect(screen.getByText("Yoga")).toBeInTheDocument();
    expect(screen.getByText("06")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
