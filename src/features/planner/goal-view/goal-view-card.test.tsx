import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import { summary } from "@/features/insights/folio/folio-test-fixtures";
import { GoalViewCard } from "./goal-view-card";

vi.mock("motion/react", () => ({ useReducedMotion: () => false }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("uses full fragments for visible cards and preserves canonical progress", async () => {
  const goal = buildGoal({ title: "Run a marathon", target_count: 30, target_basis: "lifetime" });
  const progress = summary(goal.id, { creditedUnitCount: 29, expectedUnitCount: 30, outcome: "in_progress", lifecycle: "active" });
  const { container, rerender } = render(<GoalViewCard goal={goal} progress={progress} fullRender />);
  expect(screen.getByRole("group", { name: "Run a marathon rotation" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("29 / 30 completions");
  expect(container.querySelector("[data-flat-shards]")).not.toBeInTheDocument();
  expect(container.querySelector("[data-reward-piece]")).toBeInTheDocument();
  expect(container.querySelector(".tempo-card-object")?.firstElementChild).toHaveAttribute("data-reassembly");

  rerender(<GoalViewCard goal={goal} progress={summary(goal.id, { ...progress, creditedUnitCount: 30, outcome: "achieved" })} fullRender />);
  expect(screen.getByRole("status")).toHaveTextContent("Goal accomplished");
  await waitFor(() => expect(container.querySelector("[data-reassembly]")).toHaveAttribute("data-fused", "true"), { timeout: 2000 });
  expect(container.querySelectorAll("[data-card-solid]")).toHaveLength(1);
});

it("replaces offscreen fragments with one masked face and restores them before interaction", () => {
  let notify!: IntersectionObserverCallback;
  const disconnect = vi.fn();
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { notify = callback; }
    observe() {}
    disconnect = disconnect;
  });
  const goal = buildGoal({ target_count: 30, target_basis: "lifetime" });
  const progress = summary(goal.id, { creditedUnitCount: 29, expectedUnitCount: 30 });
  const { container, unmount } = render(<GoalViewCard goal={goal} progress={progress} fullRender />);
  const visible = (isIntersecting: boolean) => act(() => notify(
    [{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver
  ));
  expect(container.querySelector("[data-flat-shards]")).toBeInTheDocument();
  expect(container.querySelector("[data-card-solid]")).not.toBeInTheDocument();
  visible(true);
  expect(container.querySelector("[data-reward-piece]")).toBeInTheDocument();
  expect(screen.getByRole("group", { name: `${goal.title} rotation` })).toBeInTheDocument();
  visible(false);
  expect(container.querySelector("[data-reward-piece]")).not.toBeInTheDocument();
  expect(container.querySelector("[data-flat-shards]")).toBeInTheDocument();
  unmount();
  expect(disconnect).toHaveBeenCalled();
});

it("keeps desktop cards flat until engagement and releases geometry when scrolling starts", () => {
  const goal = buildGoal({ target_count: 30, target_basis: "lifetime" });
  const progress = summary(goal.id, { creditedUnitCount: 29, expectedUnitCount: 30 });
  const { container, rerender } = render(<GoalViewCard goal={goal} progress={progress} />);
  const host = container.querySelector("[data-goal-view-card]")!;
  expect(container.querySelector("[data-reward-piece]")).not.toBeInTheDocument();
  fireEvent.focus(host);
  expect(container.querySelector("[data-reward-piece]")).toBeInTheDocument();
  expect(container.querySelector("[data-lettering-solid]")).not.toBeInTheDocument();
  rerender(<GoalViewCard goal={goal} progress={progress} fullRender moving />);
  expect(container.querySelector("[data-reward-piece]")).not.toBeInTheDocument();
  expect(container.querySelector("[data-card-solid]")).not.toBeInTheDocument();
  rerender(<GoalViewCard goal={goal} progress={progress} />);
  expect(container.querySelector("[data-reward-piece]")).not.toBeInTheDocument();
});
