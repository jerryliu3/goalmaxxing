import { afterEach, describe, expect, it, vi } from "vitest";
import {
  APP_SURFACE_READY_EVENT,
  reportAppBootGateReady,
  reportAppSurfaceReady,
  resetAppBootGatesForTests,
} from "@/components/layout/app-boot-ready";

describe("app boot ready gates", () => {
  afterEach(() => {
    resetAppBootGatesForTests();
  });

  it("does not dismiss until both the surface and XP chrome have settled", () => {
    const handler = vi.fn();
    window.addEventListener(APP_SURFACE_READY_EVENT, handler);

    reportAppBootGateReady("surface");
    expect(handler).not.toHaveBeenCalled();

    reportAppBootGateReady("xp");
    expect(handler).toHaveBeenCalledTimes(1);

    window.removeEventListener(APP_SURFACE_READY_EVENT, handler);
  });

  it("still allows a direct surface-ready event for splash listeners", () => {
    const handler = vi.fn();
    window.addEventListener(APP_SURFACE_READY_EVENT, handler);
    reportAppSurfaceReady();
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(APP_SURFACE_READY_EVENT, handler);
  });
});
