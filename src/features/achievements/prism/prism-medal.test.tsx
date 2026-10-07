import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PrismMedal } from "./prism-medal";
import { levelFinish, cardFinish } from "./materials";
const motion = vi.hoisted(() => ({ reduced: true }));
vi.mock("motion/react", () => ({ useReducedMotion: () => motion.reduced }));
afterEach(() => { cleanup(); motion.reduced = true; vi.useRealTimers(); vi.unstubAllGlobals(); });
it("climbs the locked material ladder", () => {
  expect([2,4,6,8,10].map(level => levelFinish(level).name)).toEqual(["Smoked quartz", "Clear crystal", "Sapphire crystal", "Champagne crystal", "Dichroic prism"]);
});
it("renders a locked blank with an outlined numeral", () => {
  const { container } = render(<PrismMedal finish={levelFinish(8)} numeral="8" locked />);
  expect(container.querySelector("[data-material=blank]")).not.toBeNull();
  expect(container.querySelector("text")).toHaveAttribute("fill", "none");
});
it("drops expensive light detail at inline size and honors reduced motion", () => {
  const { container } = render(<PrismMedal finish={cardFinish("chromatic", "var(--primary)" )} numeral="✓" goal size={20} unlocking />);
  expect(container.querySelector("[data-material=chromatic]")).not.toBeNull();
  expect(container.querySelector(".prism-facets")).toBeNull();
  expect(container.querySelector(".prism-glint")).toBeNull();
  expect(container.querySelector("[data-unlocking]")).toBeNull();
});

it("strikes an earned medal without replacing its light stage, then clears the animation", () => {
  motion.reduced = false;
  vi.useFakeTimers();
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const finish = levelFinish(8);
  const { container, rerender } = render(<PrismMedal finish={finish} numeral="8" locked size={128} />);
  const stage = container.querySelector("[data-light-stage]");
  rerender(<PrismMedal finish={finish} numeral="8" size={128} />);
  expect(container.querySelector("[data-light-stage]")).toBe(stage);
  expect(container.querySelector("[data-unlocking]")).not.toBeNull();
  expect(container.querySelector(".prism-body > .prism-sweep")).not.toBeNull();
  act(() => vi.advanceTimersByTime(1500));
  expect(container.querySelector("[data-unlocking]")).toBeNull();
  expect(container.querySelector(".prism-sweep")).toBeNull();
});
