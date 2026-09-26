import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { QuestPeriodClasp } from "./quest-period-clasp";

it("closes at the actual period target and reopens on reversal", () => {
  const { rerender } = render(<QuestPeriodClasp progress={{ completed: 2, target: 3, label: "2 of 3 this week" }} />);
  expect(screen.getByText("1 more to meet this period's target")).toBeInTheDocument();
  rerender(<QuestPeriodClasp progress={{ completed: 3, target: 3, label: "3 of 3 this week" }} />);
  expect(screen.getByText("Period target met")).toBeInTheDocument();
  expect(screen.queryByText("Goal achieved")).not.toBeInTheDocument();
  rerender(<QuestPeriodClasp progress={{ completed: 2, target: 3, label: "2 of 3 this week" }} />);
  expect(screen.queryByText("Period target met")).not.toBeInTheDocument();
});
