import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useCardPose } from "./use-card-pose";
import { cardOptics, FLAT_POSE, TILTED_POSE } from "./card-optics";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("settles geometry and shine together, and cancels motion when still mode is enabled", () => {
  let id = 0;
  const pending = new Map<number, FrameRequestCallback>();
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => { pending.set(++id, callback); return id; });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(key => { pending.delete(key); });
  const { result, rerender, unmount } = renderHook(({ still }) => useCardPose(still, false), { initialProps: { still: false } });
  const stage = document.createElement("div");
  result.current.stage.current = stage;
  act(() => result.current.moveTo(TILTED_POSE));
  const start = performance.now();
  act(() => {
    for (let step = 1; step <= 100 && pending.size; step++) {
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach(callback => callback(start + step * 16));
    }
  });
  expect(pending.size).toBe(0);
  expect(stage.style.getPropertyValue("--ry")).toBe(`${TILTED_POSE.y}deg`);
  expect(stage.style.getPropertyValue("--shine-position")).toBe(cardOptics(TILTED_POSE)["--shine-position"]);
  act(() => result.current.moveTo({ x: 10, y: -20 }));
  rerender({ still: true });
  expect(pending.size).toBe(0);
  expect(stage.style.getPropertyValue("--ry")).toBe("0deg");
  expect(stage.style.getPropertyValue("--shine-position")).toBe(cardOptics(FLAT_POSE)["--shine-position"]);
  rerender({ still: false });
  unmount();
  expect(pending.size).toBe(0);
});

it("paints only the latest drag pose once per frame and cancels queued work on unmount", () => {
  let id = 0;
  const pending = new Map<number, FrameRequestCallback>();
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => { pending.set(++id, callback); return id; });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(key => { pending.delete(key); });
  const { result, unmount } = renderHook(() => useCardPose(false, false));
  const stage = document.createElement("div");
  result.current.stage.current = stage;
  act(() => result.current.moveTo({ x: 0, y: 0 }, true));
  const paint = vi.spyOn(stage.style, "setProperty");

  act(() => {
    for (let step = 1; step <= 100; step++) result.current.dragTo({ x: -step, y: step * 2 });
  });
  expect(pending.size).toBe(1);
  expect(paint).not.toHaveBeenCalled();
  act(() => {
    const callbacks = [...pending.values()];
    pending.clear();
    callbacks.forEach(callback => callback(performance.now() + 16));
  });
  const last = { x: -100, y: 200 };
  expect(result.current.getCurrent()).toEqual(last);
  expect(paint).toHaveBeenCalledTimes(Object.keys(cardOptics(last)).length);
  expect(stage.style.getPropertyValue("--ry")).toBe("200deg");
  expect(stage.style.getPropertyValue("--shine-position")).toBe(cardOptics(last)["--shine-position"]);
  expect(pending.size).toBe(0);

  act(() => result.current.dragTo({ x: 0, y: 0 }));
  expect(pending.size).toBe(1);
  unmount();
  expect(pending.size).toBe(0);
});
