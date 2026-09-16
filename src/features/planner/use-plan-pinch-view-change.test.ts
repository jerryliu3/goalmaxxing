import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  nextViewModeAfterPinch,
  usePlanPinchViewChange,
} from "@/features/planner/use-plan-pinch-view-change";

describe("nextViewModeAfterPinch", () => {
  it("steps inward from day to week to month", () => {
    expect(nextViewModeAfterPinch("day", "in")).toBe("week");
    expect(nextViewModeAfterPinch("week", "in")).toBe("month");
    expect(nextViewModeAfterPinch("month", "in")).toBeNull();
  });

  it("steps outward from month to week to day", () => {
    expect(nextViewModeAfterPinch("month", "out")).toBe("week");
    expect(nextViewModeAfterPinch("week", "out")).toBe("day");
    expect(nextViewModeAfterPinch("day", "out")).toBeNull();
  });
});

function touchEvent(type: string, points: { clientX: number; clientY: number }[]) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "touches", { value: points });
  return event;
}

function mountPinch(node: HTMLElement, onViewModeChange = vi.fn()) {
  const result = renderHook(() =>
    usePlanPinchViewChange({
      containerRef: { current: node },
      viewMode: "week",
      onViewModeChange,
    })
  );
  return { ...result, onViewModeChange };
}

describe("usePlanPinchViewChange listeners", () => {
  it("does not hold a touchmove listener until two fingers are down", () => {
    const node = document.createElement("div");
    document.body.append(node);
    const addEventListener = vi.spyOn(node, "addEventListener");

    mountPinch(node);

    const moveListenerCalls = () =>
      addEventListener.mock.calls.filter(([type]) => type === "touchmove");

    // One finger must reach the browser's scroller untouched.
    expect(moveListenerCalls()).toHaveLength(0);
    node.dispatchEvent(touchEvent("touchstart", [{ clientX: 0, clientY: 0 }]));
    expect(moveListenerCalls()).toHaveLength(0);

    node.dispatchEvent(
      touchEvent("touchstart", [
        { clientX: 0, clientY: 0 },
        { clientX: 100, clientY: 0 },
      ])
    );
    expect(moveListenerCalls()).toHaveLength(1);
    expect(moveListenerCalls()[0]?.[2]).toEqual({ passive: false });

    node.remove();
  });

  it("releases the touchmove listener once the gesture ends", () => {
    const node = document.createElement("div");
    document.body.append(node);
    const removeEventListener = vi.spyOn(node, "removeEventListener");

    mountPinch(node);

    node.dispatchEvent(
      touchEvent("touchstart", [
        { clientX: 0, clientY: 0 },
        { clientX: 100, clientY: 0 },
      ])
    );
    node.dispatchEvent(touchEvent("touchend", [{ clientX: 0, clientY: 0 }]));

    expect(
      removeEventListener.mock.calls.filter(([type]) => type === "touchmove")
    ).toHaveLength(1);

    node.remove();
  });

  it("switches view mode on a pinch in and ignores the rest of the gesture", () => {
    const node = document.createElement("div");
    document.body.append(node);
    const { onViewModeChange } = mountPinch(node);

    node.dispatchEvent(
      touchEvent("touchstart", [
        { clientX: 0, clientY: 0 },
        { clientX: 200, clientY: 0 },
      ])
    );
    node.dispatchEvent(
      touchEvent("touchmove", [
        { clientX: 0, clientY: 0 },
        { clientX: 120, clientY: 0 },
      ])
    );
    node.dispatchEvent(
      touchEvent("touchmove", [
        { clientX: 0, clientY: 0 },
        { clientX: 60, clientY: 0 },
      ])
    );

    expect(onViewModeChange).toHaveBeenCalledTimes(1);
    expect(onViewModeChange).toHaveBeenCalledWith("month");

    node.remove();
  });
});
