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
vi.mock("@/features/insights/insights-shell", () => ({
  InsightsShell: () => null,
}));
vi.mock("@/features/social/social-surface", () => ({
  SocialSurface: () => null,
}));
vi.mock("@/features/settings/settings-tab", () => ({
  SettingsTab: () => null,
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

  it("prefetches tab routes immediately and warms Achievements after Agenda is ready", () => {
    renderHook(() =>
      useIdleAppPrefetch({
        userId: "user-1",
        partnerId: null,
      })
    );

    expect(mocks.idleTasks).toHaveLength(0);
    expect(mocks.delayedTasks).toHaveLength(1);

    expect(mocks.prefetch).toHaveBeenCalledWith("/achievements");
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

    act(() => {
      mocks.idleTasks.at(-1)?.();
    });
    expect(mocks.warmAppTabData).toHaveBeenCalledWith({
      userId: "user-1",
      partnerId: null,
      includeProgressContext: true,
    });
  });
});
