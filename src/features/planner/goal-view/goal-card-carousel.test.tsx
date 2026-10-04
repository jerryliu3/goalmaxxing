import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import { GoalCardCarousel } from "./goal-card-carousel";

const motion = vi.hoisted(() => ({ reduced: false }));
vi.mock("motion/react", () => ({ useReducedMotion: () => motion.reduced }));
vi.mock("./goal-view-card", () => ({
  GoalViewCard: () => <div data-rotatable={!motion.reduced}><div data-card-object="" /></div>,
}));

const goals = [buildGoal({ id: "run" }), buildGoal({ id: "gym" })];
const originalScrollTo = Object.getOwnPropertyDescriptor(Element.prototype, "scrollTo");

beforeEach(() => {
  vi.useFakeTimers();
  // jsdom otherwise drops the button and pointer fields our gesture routing uses.
  vi.stubGlobal("PointerEvent", class extends MouseEvent {
    pointerId: number;
    pointerType: string;
    isPrimary: boolean;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? "touch";
      this.isPrimary = init.isPrimary ?? true;
    }
  });
  // jsdom has no layout or native element scrolling.
  Object.defineProperty(Element.prototype, "scrollTo", {
    configurable: true, writable: true,
    value: vi.fn(function (this: HTMLElement, options: ScrollToOptions) {
      this.scrollLeft = options.left ?? this.scrollLeft;
    }),
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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
  return { onSelect, track, unmount: view.unmount, rerender: (selectedId: string) => view.rerender(<GoalCardCarousel {...props} selectedId={selectedId} />) };
}

it("selects the centered goal once a swipe settles", () => {
  const { track, onSelect } = renderCarousel();
  expect(track).toHaveClass("relative");
  fireEvent.scroll(track);
  act(() => vi.advanceTimersByTime(200));
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenCalledWith("gym");
});

it("cancels swipe selection when a direct card gesture begins and resumes after release", () => {
  const { track, onSelect } = renderCarousel();
  fireEvent.scroll(track);
  const card = track.querySelector("[data-card-object]")!;
  fireEvent.pointerDown(card, { button: 0 });
  fireEvent.scroll(track);
  act(() => vi.advanceTimersByTime(200));
  expect(onSelect).not.toHaveBeenCalled();

  fireEvent.pointerUp(card);
  fireEvent.scroll(track);
  act(() => vi.advanceTimersByTime(200));
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenCalledWith("gym");
});

it("cancels a pending swipe when external navigation selects another goal", () => {
  const { track, onSelect, rerender } = renderCarousel();
  fireEvent.scroll(track);
  rerender("gym");
  act(() => vi.advanceTimersByTime(200));
  expect(onSelect).not.toHaveBeenCalled();
  expect(Element.prototype.scrollTo).toHaveBeenLastCalledWith({ left: 300, behavior: "smooth" });
});

it("taps a dot to select and center its goal", () => {
  const { track, onSelect } = renderCarousel();
  track.scrollLeft = 0;
  const slider = screen.getByRole("slider", { name: "Browse goals" });
  fireEvent.pointerDown(slider);
  fireEvent.change(slider, { target: { value: "1" } });
  fireEvent.pointerUp(slider);
  expect(onSelect).toHaveBeenCalledOnce();
  expect(onSelect).toHaveBeenCalledWith("gym");
  expect(Element.prototype.scrollTo).toHaveBeenLastCalledWith({ left: 300, behavior: "smooth" });
  expect(slider).toHaveAttribute("aria-valuetext", expect.stringContaining("goal 2 of 2"));
});

it("coalesces scrubbing to one frame and selects only when released", () => {
  const { track, onSelect } = renderCarousel();
  track.scrollLeft = 0;
  const slider = screen.getByRole("slider", { name: "Browse goals" });
  const scrollTo = vi.mocked(Element.prototype.scrollTo);
  scrollTo.mockClear();
  fireEvent.pointerDown(slider);
  expect(track.style.scrollSnapType).toBe("none");
  fireEvent.change(slider, { target: { value: "0.25" } });
  fireEvent.change(slider, { target: { value: "0.5" } });
  fireEvent.change(slider, { target: { value: "0.75" } });
  expect(scrollTo).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(16));
  expect(scrollTo).toHaveBeenCalledOnce();
  expect(scrollTo).toHaveBeenCalledWith({ left: 225, behavior: "auto" });
  expect(onSelect).not.toHaveBeenCalled();
  fireEvent.pointerUp(slider);
  expect(track.style.scrollSnapType).toBe("");
  expect(scrollTo).toHaveBeenLastCalledWith({ left: 300, behavior: "smooth" });
  expect(onSelect).toHaveBeenCalledOnce();
});

it("commits keyboard selection and respects reduced motion", () => {
  motion.reduced = true;
  const { track, onSelect } = renderCarousel();
  track.scrollLeft = 0;
  const slider = screen.getByRole("slider", { name: "Browse goals" });
  fireEvent.change(slider, { target: { value: "1" } });
  fireEvent.keyDown(slider, { key: "End" });
  expect(onSelect).toHaveBeenCalledWith("gym");
  expect(Element.prototype.scrollTo).toHaveBeenLastCalledWith({ left: 300, behavior: "auto" });
});

it("restores snapping when the scrub gesture is cancelled", () => {
  const { track } = renderCarousel();
  const slider = screen.getByRole("slider", { name: "Browse goals" });
  fireEvent.pointerDown(slider);
  fireEvent.pointerCancel(slider);
  expect(track.style.scrollSnapType).toBe("");
});

it("cancels pending frames and swipe selection on unmount", () => {
  const { track, onSelect, unmount } = renderCarousel();
  fireEvent.scroll(track);
  unmount();
  act(() => vi.advanceTimersByTime(200));
  expect(onSelect).not.toHaveBeenCalled();
});

it("keeps native swiping and skips rotation in reduced motion", () => {
  motion.reduced = true;
  const { track } = renderCarousel();
  expect(track).toHaveClass("overflow-x-auto");
  expect(screen.queryByRole("button", { name: "Turn card" })).not.toBeInTheDocument();
  expect(Element.prototype.scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: "auto" }));
});
