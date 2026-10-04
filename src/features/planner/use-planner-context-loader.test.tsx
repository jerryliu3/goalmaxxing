import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { PlannerContextPayload } from "./calendar-surface.types";
import { usePlannerContextLoader } from "./use-planner-context-loader";
import { buildGoalViewWindow } from "./goal-view/goal-view-model";
import { buildPlannerContextCacheKey } from "@/lib/cache/planner-tab-cache";
import { markTabDataCacheStaleByPrefix, resetTabDataCacheForTests, writeTabDataCache } from "@/lib/cache/tab-data-cache";
import { fetchPlannerContext } from "@/lib/planner/fetch-planner-context";

const mocks = vi.hoisted(() => ({ getJson: vi.fn(), postJson: vi.fn() }));
vi.mock("@/lib/api/client", () => ({ ...mocks, getApiErrorMessage: () => "Failed" }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/lib/dates/timezone", () => ({ getDateInTimezone: () => "2026-10-04" }));

const month = "2026-10";
const window = buildGoalViewWindow("2026-10-04");
const snapshot = { scopeMonth: month, asOfDate: "2026-10-04", preferences: null } as PlannerContextPayload;

beforeEach(() => {
  resetTabDataCacheForTests();
  mocks.getJson.mockReset().mockResolvedValue(snapshot);
  mocks.postJson.mockReset().mockResolvedValue(snapshot);
});

function mount(open = true) {
  const args = {
    activeTab: "calendar", month, selectedDay: "2026-10-04", viewMode: "week" as const,
    goalViewOpen: open, setGoalViewReady: vi.fn(), setupTimezone: "UTC", setupWeekStartsOn: 1,
    onMonthChange: vi.fn(), setContext: vi.fn(), setLoading: vi.fn(), setError: vi.fn(),
    setSetupTimezone: vi.fn(), setSetupWeekStartsOn: vi.fn(), setSetupRestWeekdays: vi.fn(),
    draftPolicyRef: { current: null }, calendarPreparedRef: { current: true },
  };
  const view = renderHook(({ open }) => usePlannerContextLoader({ ...args, goalViewOpen: open }), { initialProps: { open } });
  return { ...view, args };
}

it("opens Goal View from its prefetched wide window without a network request", async () => {
  writeTabDataCache(buildPlannerContextCacheKey(month, window), snapshot);
  const { result, args } = mount();
  await act(async () => { await result.current(); });
  expect(args.setContext).toHaveBeenCalledWith(snapshot);
  expect(args.setGoalViewReady).toHaveBeenCalledWith(true);
  expect(mocks.getJson).not.toHaveBeenCalled();
  expect(mocks.postJson).not.toHaveBeenCalled();
});

it("warms Goal View after the calendar's cached context is ready", async () => {
  writeTabDataCache(buildPlannerContextCacheKey(month), snapshot);
  const { result } = mount(false);
  await act(async () => { await result.current(); });
  expect(mocks.getJson).toHaveBeenCalledWith("/api/planner/context", {
    query: { scopeMonth: month, visibleStart: window.start, visibleEnd: window.end },
  });
});

it("joins an in-flight Goal View warmup instead of treating the month cache as complete", async () => {
  writeTabDataCache(buildPlannerContextCacheKey(month), snapshot);
  let resolve!: (payload: PlannerContextPayload) => void;
  mocks.getJson.mockImplementation(() => new Promise(done => { resolve = done; }));
  const background = fetchPlannerContext({ month, window });
  const { result, args } = mount();
  let foreground!: Promise<boolean>;
  act(() => { foreground = result.current(); });
  await Promise.resolve();
  expect(mocks.getJson).toHaveBeenCalledTimes(1);
  await act(async () => { resolve(snapshot); await background; await foreground; });
  expect(args.setGoalViewReady).toHaveBeenCalledWith(true);
});

it("still prepares after planner invalidation, even with a last-good wide snapshot", async () => {
  writeTabDataCache(buildPlannerContextCacheKey(month, window), snapshot);
  markTabDataCacheStaleByPrefix("planner-context:");
  const { result } = mount();
  await act(async () => { await result.current({ forcePrepare: true }); });
  expect(mocks.postJson).toHaveBeenCalledWith("/api/planner/prepare", expect.objectContaining({ visibleStart: window.start, visibleEnd: window.end }));
});

it("does not let a late Goal View response replace the calendar after switching back", async () => {
  let resolve!: (payload: PlannerContextPayload) => void;
  mocks.getJson.mockImplementation(() => new Promise(done => { resolve = done; }));
  const { result, rerender, args } = mount();
  let old!: Promise<boolean>;
  act(() => { old = result.current(); });
  await Promise.resolve();
  writeTabDataCache(buildPlannerContextCacheKey(month), snapshot);
  rerender({ open: false });
  await act(async () => { await result.current(); });
  args.setGoalViewReady.mockClear();
  await act(async () => { resolve(snapshot); await old; });
  expect(args.setGoalViewReady).not.toHaveBeenCalledWith(true);
});
