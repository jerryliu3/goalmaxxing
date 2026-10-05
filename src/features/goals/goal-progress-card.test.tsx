import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import { summary } from "@/features/insights/folio/folio-test-fixtures";
import { GoalProgressCard } from "./goal-progress-card";
import { GOAL_CARD_SCROLL_SETTLE_MS, useGoalCardScrollMotion } from "./use-goal-card-scroll-motion";

vi.mock("motion/react", () => ({ useReducedMotion: () => false }));
let notify: IntersectionObserverCallback;
let nextIdleId: number;
let idle: Map<number, () => void>;
const goal = buildGoal({ title: "Write six chapters", target_basis: "lifetime", target_count: 6 });
const progress = summary(goal.id, { creditedUnitCount: 2, expectedUnitCount: 6, lifecycle: "active", outcome: "in_progress" });

beforeEach(() => {
  vi.useFakeTimers();
  nextIdleId = 0;
  idle = new Map();
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { notify = callback; }
    observe() {}
    disconnect() {}
  });
  vi.stubGlobal("requestIdleCallback", (callback: () => void) => { idle.set(++nextIdleId, callback); return nextIdleId; });
  vi.stubGlobal("cancelIdleCallback", (id: number) => idle.delete(id));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

function visible(value: boolean) {
  act(() => notify([{ isIntersecting: value } as IntersectionObserverEntry], {} as IntersectionObserver));
}
function prepare() {
  act(() => { const tasks = [...idle.values()]; idle.clear(); tasks.forEach(task => task()); });
}

it("prepares only visible cards at idle and releases full fragments offscreen", () => {
  const { container } = render(<GoalProgressCard goal={goal} progress={progress} gallery />);
  expect(idle.size).toBe(0);
  expect(container.querySelector("[data-reward-piece]")).toBeNull();
  expect(container.querySelector("[data-lettering-solid]")).toBeNull();
  visible(true);
  expect(container.querySelector("[data-reward-piece]")).toBeNull();
  prepare();
  expect(screen.getByRole("group", { name: "Write six chapters rotation" })).toBeInTheDocument();
  expect(container.querySelectorAll("[data-reward-piece]")).toHaveLength(2);
  expect(screen.getByRole("status")).toHaveTextContent("2 / 6 completions");
  visible(false);
  expect(container.querySelector("[data-reward-piece]")).toBeNull();
  expect(container.querySelector("[data-card-solid]")).toBeNull();
  expect(container.querySelector("[data-flat-shards]")).toBeInTheDocument();
});

it("lets hover and keyboard focus prepare a visible card without waiting for idle", () => {
  const { container } = render(<GoalProgressCard goal={goal} progress={progress} gallery />);
  visible(true);
  const host = container.querySelector("[data-goal-progress-card]")!;
  fireEvent.pointerEnter(host);
  expect(container.querySelector("[data-reward-piece]")).toBeInTheDocument();
  fireEvent.pointerLeave(host);
  expect(container.querySelector("[data-reward-piece]")).toBeNull();
  fireEvent.focus(host);
  expect(screen.getByRole("group", { name: "Write six chapters rotation" })).toBeInTheDocument();
});

it("cancels pending builds during nested scrolling and resumes only after the last motion settles", () => {
  function Gallery() {
    const moving = useGoalCardScrollMotion();
    return <div data-testid="scroller"><GoalProgressCard goal={goal} progress={progress} gallery moving={moving} /></div>;
  }
  const { container } = render(<Gallery />);
  visible(true);
  fireEvent.scroll(screen.getByTestId("scroller"));
  expect(idle.size).toBe(0);
  fireEvent.pointerEnter(container.querySelector("[data-goal-progress-card]")!);
  prepare();
  expect(container.querySelector("[data-reward-piece]")).toBeNull();
  act(() => vi.advanceTimersByTime(GOAL_CARD_SCROLL_SETTLE_MS - 1));
  fireEvent.wheel(window);
  act(() => vi.advanceTimersByTime(GOAL_CARD_SCROLL_SETTLE_MS - 1));
  expect(idle.size).toBe(0);
  act(() => vi.advanceTimersByTime(1));
  expect(idle.size).toBe(1);
  prepare();
  expect(container.querySelector("[data-reward-piece]")).toBeInTheDocument();
  fireEvent.scroll(window);
  expect(container.querySelector("[data-reward-piece]")).toBeNull();
});

it("keeps completed offscreen goals free of solid geometry too", () => {
  const { container } = render(<GoalProgressCard goal={goal} progress={summary(goal.id, {
    creditedUnitCount: 6, expectedUnitCount: 6, outcome: "achieved",
  })} gallery />);
  expect(container.querySelector("[data-card-solid]")).toBeNull();
  visible(true);
  prepare();
  expect(container.querySelector("[data-card-solid]")).toBeInTheDocument();
  visible(false);
  expect(container.querySelector("[data-card-solid]")).toBeNull();
});
