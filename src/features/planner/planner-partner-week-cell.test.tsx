import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PlannerPartnerWeekDayCell } from "@/features/planner/planner-partner-week-cell";

describe("PlannerPartnerWeekDayCell", () => {
  afterEach(() => {
    cleanup();
  });
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
    expect(screen.getByText("Yoga")).toHaveClass("line-through");
    expect(screen.getByText("06")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Yoga. Partner marked this done.")).toHaveClass(
      "bg-background"
    );
    expect(screen.getByLabelText("Yoga. Partner marked this done.")).not.toHaveClass(
      "bg-transparent"
    );
  });

  it("renders the Duo week column as a vertical agenda", () => {
    render(
      <ol>
        <PlannerPartnerWeekDayCell
          day="2026-09-06"
          inMonth
          isToday
          layout="agenda"
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
      </ol>
    );

    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("Yoga")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Yoga. Partner marked this done.")).toHaveClass(
      "bg-background"
    );
  });
});
