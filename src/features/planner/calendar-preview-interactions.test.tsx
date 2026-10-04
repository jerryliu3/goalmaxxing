vi.mock("@/features/coach/use-coach-page-context", () => ({ useCoachPageContext: vi.fn() }));
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarSurface } from "./calendar-surface";
import type {
  PlannerContextPayload,
  PlannerWorkUnit,
} from "./calendar-surface.types";
import {
  buildPlannerContext,
  buildPlannerPolicy,
  buildPlannerPreview,
  buildPlannerWorkUnit,
} from "@/features/planner/test-fixtures";
import {
  invalidatePlannerRelatedTabCaches,
  resetPlannerTabCacheInvalidationForTests,
} from "@/lib/cache/planner-tab-cache";

const getJsonMock = vi.fn();
const postJsonMock = vi.fn();
const putJsonMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/api/client", () => ({
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
  isApiClientError: () => false,
  getJson: (...args: unknown[]) => getJsonMock(...args),
  postJson: (...args: unknown[]) => postJsonMock(...args),
  putJson: (...args: unknown[]) => putJsonMock(...args),
}));



vi.mock("@/features/planner/use-completion-mutation", () => ({
  useCompletionMutation: () => vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/navigation/use-app-router", () => ({
  useAppRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("@/features/today/use-checklist-data", () => ({
  useChecklistData: () => ({
    data: {
      userId: "",
      goals: [],
      completions: [],
      memberTeamIds: [],
      links: [],
      photoUrls: {},
      progress: null,
    },
    loading: false,
    loadData: vi.fn(),
    redirectToLogin: vi.fn(),
    todayLocalDate: "2026-08-15",
  }),
}));

function unit(overrides: Partial<PlannerWorkUnit>): PlannerWorkUnit {
  return buildPlannerWorkUnit({
    originalGoalId: "goal-a",
    unitKey: "total:1",
    label: "Baseline",
    scheduledDate: "2026-08-31",
    classification: "open",
    creditState: "uncredited",
    ...overrides,
  });
}

function buildContext(workUnits: PlannerWorkUnit[]): PlannerContextPayload {
  const goalIds = Array.from(
    new Set(workUnits.map((workUnit) => workUnit.originalGoalId))
  );
  return buildPlannerContext({
    workUnits,
    overrides: {
      asOfDate: "2026-08-15",
      goalTitles: {
        "goal-a": "Goal A",
      },
      preferences: {
        timezone: "UTC",
        timezoneConfirmedAt: "2026-08-01T00:00:00.000Z",
        policyRevision: 1,
        defaultPolicy: buildPlannerPolicy({ weekStartsOn: 1 }),
      },
      activePlan: {
        plan: {
          id: "persisted-plan",
          version: 1,
          status: "active",
        },
        goals: goalIds.map((goalId) => ({
          id: goalId,
          goal_id: goalId,
          original_goal_id: goalId,
          requirement_fingerprint: "a".repeat(64),
          title: "Goal A",
          category: "Personal",
          color: null,
        })),
        items: workUnits
          .filter((workUnit) => workUnit.scheduledDate)
          .map((workUnit, index) => ({
            id: `item-${index}`,
            plan_goal_id: workUnit.originalGoalId,
            unit_key: workUnit.unitKey,
            requirement_kind: "deadline_total" as const,
            scheduled_date: workUnit.scheduledDate!,
            original_scheduled_date: workUnit.scheduledDate!,
            locked: false,
            revision: 0,
          })),
      },
      preview: buildPlannerPreview(workUnits, {
        preserveExistingAssignments: true,
      }),
      revisions: {
        canonicalRevision: 1,
        executionRevision: 1,
        scheduleDigest: "digest",
      },
    },
  });
}

async function flushCalendarInit() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  await Promise.resolve();
}

describe("CalendarSurface preview interactions (fake timers)", () => {
  beforeEach(() => {
    resetPlannerTabCacheInvalidationForTests();
    document.body.innerHTML = "";
    invalidatePlannerRelatedTabCaches();
    getJsonMock.mockReset();
    getJsonMock.mockImplementation(
      () => postJsonMock.mock.results[0]?.value
    );
    postJsonMock.mockReset();
    putJsonMock.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-15T09:00:00.000Z"));
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("scrolls to the checklist instead of opening day mode on touch double-tap", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          scheduledDate: "2026-08-31",
        }),
      ])
    );
    const onSelectedDayChange = vi.fn();

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay={null}
        viewMode="month"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={onSelectedDayChange}
        onPlannerMutation={vi.fn()}
      />
    );

    await flushCalendarInit();
    expect(postJsonMock).toHaveBeenCalled();

    const dayCell = document.querySelector(
      '[data-day-cell="true"][data-day="2026-08-31"]'
    );
    expect(dayCell).toBeInstanceOf(HTMLElement);

    fireEvent.pointerDown(dayCell as Element, { pointerType: "touch" });
    fireEvent.pointerUp(dayCell as Element, { pointerType: "touch" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    fireEvent.pointerDown(dayCell as Element, { pointerType: "touch" });

    expect(onSelectedDayChange).toHaveBeenCalledWith("2026-08-31", "push", "month");
    expect(onSelectedDayChange).not.toHaveBeenCalledWith(
      "2026-08-31",
      "push",
      "day"
    );
    expect(
      screen.queryByRole("button", { name: "Expand day details" })
    ).not.toBeInTheDocument();
  });

  it("opens a task composer on long press", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          scheduledDate: "2026-08-31",
        }),
      ])
    );

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay={null}
        viewMode="month"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={vi.fn()}
        onPlannerMutation={vi.fn()}
      />
    );

    await flushCalendarInit();
    const dayCell = document.querySelector(
      '[data-day-cell="true"][data-day="2026-08-31"]'
    );
    expect(dayCell).toBeInstanceOf(HTMLElement);

    fireEvent.pointerDown(dayCell as Element, { pointerType: "touch" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(screen.getByRole("textbox", { name: "Task name" })).toHaveAttribute("placeholder", "Task name");
    expect(screen.queryByRole("button", { name: "Expand day details" })).not.toBeInTheDocument();
  });

  it("selects a month day without opening a click popup", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          scheduledDate: "2026-08-31",
        }),
      ])
    );
    const onSelectedDayChange = vi.fn();

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay={null}
        viewMode="month"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={onSelectedDayChange}
        onPlannerMutation={vi.fn()}
      />
    );

    await flushCalendarInit();

    const dayCell = document.querySelector(
      '[data-day-cell="true"][data-day="2026-08-31"]'
    );
    expect(dayCell).toBeInstanceOf(HTMLElement);

    fireEvent.click(dayCell as Element);
    expect(onSelectedDayChange).toHaveBeenCalledWith("2026-08-31", "push", "month");
    expect(
      screen.queryByRole("button", { name: "Expand day details" })
    ).not.toBeInTheDocument();
  });

  it("dismisses pinned preview on outside pointer down", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          scheduledDate: "2026-08-31",
        }),
      ])
    );

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay={null}
        viewMode="month"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={vi.fn()}
        onPlannerMutation={vi.fn()}
      />
    );

    await flushCalendarInit();

    const dayCell = document.querySelector(
      '[data-day-cell="true"][data-day="2026-08-31"]'
    );
    expect(dayCell).toBeInstanceOf(HTMLElement);

    fireEvent.pointerDown(dayCell as Element, { pointerType: "touch" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(
      screen.getByRole("button", { name: "Expand day details" })
    ).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const after = document.querySelector('[data-no-swipe="true"].fixed');
    expect(after).toBeFalsy();
  });
});
