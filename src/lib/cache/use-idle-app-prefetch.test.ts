import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_SURFACE_READY_EVENT } from "@/components/layout/app-boot-preload";

const mocks = vi.hoisted(() => ({
  prefetch: vi.fn(),
  warmAppTabData: vi.fn().mockResolvedValue(undefined),
  idleTasks: [] as Array<() => void>,
  delayedTasks: [] as Array<() => void>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: mocks.prefetch,
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("@/lib/browser/schedule-idle", () => ({
  scheduleIdleTask: (task: () => void) => {
    mocks.idleTasks.push(task);
    return () => undefined;
  },
  scheduleDelayedIdleTask: (task: () => void) => {
    mocks.delayedTasks.push(task);
    return () => undefined;
  },
}));

vi.mock("@/lib/cache/warm-app-tab-data", () => ({
  warmAppTabData: (...args: unknown[]) => mocks.warmAppTabData(...args),
}));

vi.mock("@/features/planner/calendar-page-shell", () => ({
  CalendarPageShell: () => null,
}));
vi.mock("@/features/growth/growth-page", () => ({
  GrowthPage: () => null,
}));
vi.mock("@/features/social/social-surface", () => ({
  SocialSurface: () => null,
}));
vi.mock("@/features/goals/goals-destination", () => ({
  GoalsDestination: () => null,
}));

vi.mock("@/lib/cache/planner-tab-cache", () => ({
  subscribePlannerTabCacheInvalidation: () => () => undefined,
}));

import { useIdleAppPrefetch } from "@/lib/cache/use-idle-app-prefetch";

describe("useIdleAppPrefetch", () => {
  beforeEach(() => {
    mocks.prefetch.mockReset();
    mocks.warmAppTabData.mockReset().mockResolvedValue(undefined);
    mocks.idleTasks = [];
    mocks.delayedTasks = [];
  });

  afterEach(() => {
    mocks.idleTasks = [];
    mocks.delayedTasks = [];
  });

  it("prefetches tab routes immediately and warms Growth after Agenda is ready", async () => {
    renderHook(() =>
      useIdleAppPrefetch({
        userId: "user-1",
        partnerId: null,
      })
    );

    expect(mocks.idleTasks).toHaveLength(0);
    expect(mocks.delayedTasks).toHaveLength(1);

    expect(mocks.prefetch).toHaveBeenCalledWith("/growth");
    expect(mocks.prefetch).toHaveBeenCalledWith("/goals");
    expect(mocks.prefetch).toHaveBeenCalledWith("/social");
    expect(mocks.warmAppTabData).toHaveBeenCalledWith({
      userId: "user-1",
      partnerId: null,
      includeProgressContext: false,
    });

    act(() => {
      window.dispatchEvent(new Event(APP_SURFACE_READY_EVENT));
    });
    expect(mocks.idleTasks).toHaveLength(1);

    await act(async () => {
      mocks.idleTasks.at(-1)?.();
      // Settle the module warmups before this test environment is disposed.
      await Promise.all([
        import("@/features/planner/calendar-page-shell"),
        import("@/features/growth/growth-page"),
        import("@/features/social/social-surface"),
        import("@/features/goals/goals-destination"),
      ]);
    });
    expect(mocks.warmAppTabData).toHaveBeenCalledWith({
      userId: "user-1",
      partnerId: null,
      includeProgressContext: true,
    });
  });
});
