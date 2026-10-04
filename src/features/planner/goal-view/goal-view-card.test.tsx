import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import { summary } from "@/features/insights/folio/folio-test-fixtures";
import { GoalViewCard } from "./goal-view-card";

vi.mock("motion/react", () => ({ useReducedMotion: () => false }));
afterEach(cleanup);

it("uses gallery masks in Goal View while retaining rotation and canonical progress", () => {
  const goal = buildGoal({ title: "Run a marathon", target_count: 30, target_basis: "lifetime" });
  const progress = summary(goal.id, { creditedUnitCount: 29, expectedUnitCount: 30, outcome: "in_progress", lifecycle: "active" });
  const { container, rerender } = render(<GoalViewCard goal={goal} progress={progress} />);
  expect(screen.getByRole("group", { name: "Run a marathon rotation" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("29 / 30 completions");
  expect(container.querySelector("[data-flat-shards]")).toBeInTheDocument();
  expect(container.querySelector("[data-reward-piece]")).not.toBeInTheDocument();
  expect(container.querySelectorAll("[data-card-solid]")).toHaveLength(1);

  rerender(<GoalViewCard goal={goal} progress={summary(goal.id, { ...progress, creditedUnitCount: 30, outcome: "achieved" })} />);
  expect(screen.getByRole("status")).toHaveTextContent("Goal accomplished");
  expect(container.querySelector("[data-reassembly]")).toHaveAttribute("data-fused", "true");
  expect(container.querySelectorAll("[data-card-solid]")).toHaveLength(1);
});
