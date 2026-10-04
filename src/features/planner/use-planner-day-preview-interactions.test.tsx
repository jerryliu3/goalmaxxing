import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DAY_PREVIEW_HOVER_GRACE_MS,
  isHoverPreviewKeepAliveTarget,
  usePlannerDayPreviewInteractions,
} from "@/features/planner/use-planner-day-preview-interactions";
import type { DayPreviewState } from "@/features/planner/calendar-surface.types";

function buildTarget(): EventTarget & HTMLElement {
  const target = document.createElement("button");
  Object.defineProperty(target, "getBoundingClientRect", {
    value: () => ({
      top: 40,
      left: 20,
      width: 120,
      height: 48,
      right: 140,
      bottom: 88,
      x: 20,
      y: 40,
      toJSON: () => ({}),
    }),
  });
  return target as EventTarget & HTMLElement;
}

const openHoverPreview: DayPreviewState = {
  day: "2026-09-02",
  pinned: false,
  position: { top: 10, left: 10, width: 200, placement: "below" },
};

function interactionArgs(
  overrides: Partial<Parameters<typeof usePlannerDayPreviewInteractions>[0]> = {}
) {
  return {
    dayPreview: null,
    setDayPreview: vi.fn(),
    setExpandedPreviewDay: vi.fn(),
    setMoveDialogDay: vi.fn(),
    setMoveDialogSourceEntryKey: vi.fn(),
    setSelectedEventEntryKey: vi.fn(),
    setLocalSelectedDay: vi.fn(),
    onSelectedDayChange: vi.fn(),
    hoverPreviewTimerRef: { current: null as number | null },
    hoverPreviewCloseTimerRef: { current: null as number | null },
    longPressTimerRef: { current: null as number | null },
    longPressTriggeredRef: { current: false },
    pointerPressActiveRef: { current: false },
    pointerInsideDayPreviewRef: { current: false },
    lastTouchTapRef: { current: null },
    suppressDayCellClickRef: { current: null },
    dayPreviewRef: { current: null as HTMLDivElement | null },
    isDayPreviewSurfaceTarget: () => false,
    ...overrides,
  };
}

describe("hover preview keep-alive", () => {
  it("stays open over the origin day and popup, not other calendar days", () => {
    const origin = document.createElement("div");
    origin.dataset.day = "2026-09-02";
    const other = document.createElement("div");
    other.dataset.day = "2026-09-03";
    const popup = document.createElement("div");
    const insidePopup = document.createElement("button");
    popup.append(insidePopup);

    expect(isHoverPreviewKeepAliveTarget(origin, "2026-09-02", popup)).toBe(true);
    expect(isHoverPreviewKeepAliveTarget(insidePopup, "2026-09-02", popup)).toBe(
      true
    );
    expect(isHoverPreviewKeepAliveTarget(other, "2026-09-02", popup)).toBe(false);
  });
});

describe("usePlannerDayPreviewInteractions", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("uses the long press callback and suppresses release navigation", () => {
    vi.useFakeTimers();
    const onLongPressDay = vi.fn();
    const args = interactionArgs({ onLongPressDay });
    const { result } = renderHook(() => usePlannerDayPreviewInteractions(args));
    act(() => { result.current.startLongPressPreview("2026-08-16", buildTarget()); vi.advanceTimersByTime(500); });
    expect(onLongPressDay).toHaveBeenCalledWith("2026-08-16");
    expect(args.setDayPreview).toHaveBeenCalledWith(null);
    expect(args.suppressDayCellClickRef.current).toEqual({ day: "2026-08-16", active: true });
  });

  it("suppresses the next day-cell click after a touch long-press path", () => {
    const suppressDayCellClickRef = {
      current: { day: "2026-08-16", active: true },
    };
    const args = interactionArgs({ suppressDayCellClickRef });

    const { result } = renderHook(() => usePlannerDayPreviewInteractions(args));

    act(() => {
      result.current.handleDayCellClick("2026-08-16", buildTarget());
    });

    expect(args.setDayPreview).not.toHaveBeenCalled();
    expect(suppressDayCellClickRef.current).toBeNull();

    act(() => {
      result.current.handleDayCellClick("2026-08-16", buildTarget());
    });

    expect(args.setDayPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        day: "2026-08-16",
        pinned: true,
      })
    );
  });

  it("closes an unpinned popup after the grace window even if the pointer keeps moving outside", () => {
    vi.useFakeTimers();
    const setDayPreview = vi.fn();
    const hoverPreviewCloseTimerRef = { current: null as number | null };
    const pointerInsideDayPreviewRef = { current: false };
    renderHook(() =>
      usePlannerDayPreviewInteractions(
        interactionArgs({
          dayPreview: openHoverPreview,
          setDayPreview,
          hoverPreviewCloseTimerRef,
          pointerInsideDayPreviewRef,
        })
      )
    );

    const outside = document.createElement("div");
    document.body.append(outside);

    act(() => {
      outside.dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));
    });
    act(() => {
      vi.advanceTimersByTime(DAY_PREVIEW_HOVER_GRACE_MS - 50);
      outside.dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));
    });
    expect(setDayPreview).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(setDayPreview).toHaveBeenCalledOnce();
    const updater = setDayPreview.mock.calls[0]?.[0] as (
      current: DayPreviewState
    ) => DayPreviewState | null;
    expect(updater(openHoverPreview)).toBeNull();
  });

  it("cancels the close timer when the pointer returns to the origin day", () => {
    vi.useFakeTimers();
    const setDayPreview = vi.fn();
    const origin = document.createElement("div");
    origin.dataset.day = "2026-09-02";
    document.body.append(origin);
    const outside = document.createElement("div");
    document.body.append(outside);

    renderHook(() =>
      usePlannerDayPreviewInteractions(
        interactionArgs({
          dayPreview: openHoverPreview,
          setDayPreview,
        })
      )
    );

    act(() => {
      outside.dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));
    });
    act(() => {
      vi.advanceTimersByTime(200);
      origin.dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));
    });
    act(() => {
      vi.advanceTimersByTime(DAY_PREVIEW_HOVER_GRACE_MS);
    });

    expect(setDayPreview).not.toHaveBeenCalled();
  });
});
