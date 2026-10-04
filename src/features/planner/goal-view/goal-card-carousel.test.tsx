import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import { GoalCardCarousel } from "./goal-card-carousel";

const motion = vi.hoisted(() => ({ reduced: false }));
vi.mock("motion/react", () => ({ useReducedMotion: () => motion.reduced }));
vi.mock("./goal-view-card", () => ({ GoalViewCard: () => <div /> }));

const goals = [buildGoal({ id: "run" }), buildGoal({ id: "gym" })];
const originalScrollTo = Object.getOwnPropertyDescriptor(Element.prototype, "scrollTo");

beforeEach(() => {
  vi.useFakeTimers();
  // jsdom has no layout or native element scrolling.
  Object.defineProperty(Element.prototype, "scrollTo", { configurable: true, writable: true, value: vi.fn() });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  if (originalScrollTo) Object.defineProperty(Element.prototype, "scrollTo", originalScrollTo);
  else Reflect.deleteProperty(Element.prototype, "scrollTo");
  motion.reduced = false;
});

function renderCarousel() {
  const onSelect = vi.fn();
  const props = { goals, selectedId: "run", onSelect, progressByGoalId: new Map() };
  const view = render(<GoalCardCarousel {...props} />);
  const track = screen.getByLabelText("Swipe between goal cards");
  Object.defineProperties(track, {
    clientWidth: { configurable: true, value: 300 },
    scrollLeft: { configurable: true, writable: true, value: 300 },
  });
  [...track.children].forEach((child, index) => {
    Object.defineProperties(child, {
      offsetLeft: { configurable: true, value: index * 300 },
      clientWidth: { configurable: true, value: 300 },
    });
  });
  return { onSelect, track, rerender: (selectedId: string) => view.rerender(<GoalCardCarousel {...props} selectedId={selectedId} />) };
}

it("selects the centered goal once a swipe settles", () => {
  const { track, onSelect } = renderCarousel();
  expect(track).toHaveClass("relative");
  fireEvent.scroll(track);
  act(() => vi.advanceTimersByTime(140));
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenCalledWith("gym");
});

it("cancels pending swipe selection and ignores scrolling while turning", () => {
  const { track, onSelect } = renderCarousel();
  fireEvent.scroll(track);
  fireEvent.click(screen.getByRole("button", { name: "Turn card" }));
  fireEvent.scroll(track);
  act(() => vi.advanceTimersByTime(140));
  expect(onSelect).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Done turning" }));
  fireEvent.scroll(track);
  act(() => vi.advanceTimersByTime(140));
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenCalledWith("gym");
});

it("cancels a pending swipe when external navigation selects another goal", () => {
  const { track, onSelect, rerender } = renderCarousel();
  fireEvent.scroll(track);
  rerender("gym");
  act(() => vi.advanceTimersByTime(140));
  expect(onSelect).not.toHaveBeenCalled();
  expect(Element.prototype.scrollTo).toHaveBeenLastCalledWith({ left: 300, behavior: "smooth" });
});

it("keeps native swiping and skips rotation in reduced motion", () => {
  motion.reduced = true;
  const { track } = renderCarousel();
  expect(track).toHaveClass("overflow-x-auto");
  expect(screen.queryByRole("button", { name: "Turn card" })).not.toBeInTheDocument();
  expect(Element.prototype.scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: "auto" }));
});
