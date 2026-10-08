vi.mock("@/features/coach/use-coach-page-context", () => ({ useCoachPageContext: vi.fn() }));
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COMPLETION_HOLD_MS } from "@/components/ui/completion-toggle";
import { CalendarSurface } from "./calendar-surface";
import calendarStyles from "./calendar-surface.module.css";
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
import { summarizePlannerGoalUnplaceableRecords } from "@/lib/planner/unplaceable";

const getJsonMock = vi.fn();
const postJsonMock = vi.fn();
const putJsonMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const completionMutationMock = vi.hoisted(() =>
  vi.fn(async () => ({ ok: true, message: null }))
);

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
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
  useCompletionMutation: () => completionMutationMock,
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
        "goal-b": "Goal B",
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
          title: goalId === "goal-a" ? "Goal A" : "Goal B",
          category: "Personal",
          color: null,
        })),
        items: workUnits.flatMap((workUnit, index) =>
          workUnit.scheduledDate
            ? [
                {
                  id: `item-${index}`,
                  plan_goal_id: workUnit.originalGoalId,
                  unit_key: workUnit.unitKey,
                  requirement_kind: "deadline_total" as const,
                  scheduled_date: workUnit.scheduledDate,
                  original_scheduled_date: workUnit.scheduledDate,
                  locked: workUnit.locked ?? false,
                  revision: 0,
                },
              ]
            : []
        ),
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

function buildDomRect({
  left = 0,
  top = 0,
  width = 100,
  height = 96,
}: {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
} = {}): DOMRect {
  return {
    left,
    right: left + width,
    top,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({}),
  };
}

describe("CalendarSurface characterization", () => {
  beforeEach(() => {
    vi.useRealTimers();
    resetPlannerTabCacheInvalidationForTests();
    document.body.innerHTML = "";
    invalidatePlannerRelatedTabCaches();
    getJsonMock.mockReset();
    getJsonMock.mockImplementation(
      () => postJsonMock.mock.results[0]?.value
    );
    postJsonMock.mockReset();
    putJsonMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
    completionMutationMock.mockReset();
    completionMutationMock.mockResolvedValue({ ok: true, message: null });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("renders adjacent-month persisted rows from the prepared context", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:1",
          scheduledDate: "2026-08-31",
        }),
        unit({
          originalGoalId: "goal-b",
          unitKey: "total:1",
          label: "Goal B label",
          scheduledDate: "2026-09-01",
        }),
      ])
    );

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-09"
        selectedDay={null}
        viewMode="month"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={vi.fn()}
        onPlannerMutation={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith("/api/planner/prepare", {
        scopeMonth: "2026-09",
        visibleStart: "2026-07-27",
        visibleEnd: "2026-11-08",
      });
    });

    const dayCell = await screen.findByRole("button", {
      name: /Tuesday, September 1, 2026\./i,
    });
    expect(dayCell).toHaveAccessibleName(expect.stringContaining("1 planned item"));
    expect(dayCell).not.toHaveAccessibleName(
      expect.stringContaining("2 planned items")
    );
  });

  it("renders a month-scoped vertical window with previous and next month rows", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:1",
          scheduledDate: "2026-08-20",
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

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith(
        "/api/planner/prepare",
        expect.any(Object)
      );
    });

    expect(
      document.querySelector('[data-day-cell="true"][data-day="2026-07-01"]')
    ).toBeInstanceOf(HTMLElement);
    expect(
      document.querySelector('[data-day-cell="true"][data-day="2026-09-30"]')
    ).toBeInstanceOf(HTMLElement);
    expect(
      document.querySelector('[data-month-context-label="Jul"]')
    ).toBeInstanceOf(HTMLElement);
    expect(
      document.querySelector('[data-month-context-label="Sep"]')
    ).toBeInstanceOf(HTMLElement);

    const julySlot = document.querySelector(
      '[data-month-week-band="previous"] [data-day="2026-07-01"]'
    )?.closest("[data-month-week-band]");
    const septemberOverlap = document.querySelector(
      '[data-month-week-band="current"] [data-day="2026-09-01"]'
    )?.closest("[data-month-week-band]");
    const lateSeptemberSlot = document.querySelector(
      '[data-month-week-band="next"] [data-day="2026-09-30"]'
    )?.closest("[data-month-week-band]");
    expect(julySlot).toHaveAttribute("data-month-week-visible", "false");
    expect(septemberOverlap).toHaveAttribute("data-month-week-visible", "true");
    expect(lateSeptemberSlot).toHaveAttribute("data-month-week-visible", "false");

    fireEvent.click(screen.getByRole("button", { name: "Show previous month" }));
    expect(julySlot).toHaveAttribute("data-month-week-visible", "true");
    fireEvent.click(screen.getByRole("button", { name: "Hide previous month" }));
    expect(julySlot).toHaveAttribute("data-month-week-visible", "false");
    fireEvent.click(screen.getByRole("button", { name: "Show next month" }));
    expect(lateSeptemberSlot).toHaveAttribute("data-month-week-visible", "true");
  });

  it.each(["month", "week"] as const)(
    "keeps the time after compact milestone labels in %s cells",
    async (viewMode) => {
      postJsonMock.mockResolvedValue(
        buildContext([
          unit({
            originalGoalId: "goal-b",
            unitKey: "milestone:2",
            label: "Tempo run 4x800",
            goalDefaultLocalTime: "07:30",
            scheduledDate: "2026-09-01",
          }),
        ])
      );

      render(
        <CalendarSurface
          activeTab="calendar"
          month="2026-09"
          selectedDay={
            viewMode === "month" ? null : "2026-09-01"
          }
          viewMode={viewMode}
          onMonthChange={vi.fn()}
          onViewModeChange={vi.fn()}
          onSelectedDayChange={vi.fn()}
          onPlannerMutation={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText("Tempo run 4x800 · 07:30").length).toBeGreaterThan(0);
      });
      if (viewMode === "month") {
        expect(screen.queryByText("Goal B · 07:30")).not.toBeInTheDocument();
      } else {
        expect(screen.getByText("Goal B · 07:30")).toBeInTheDocument();
      }
    }
  );

  it("renders week as a vertical agenda beside a desktop day pane", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:1",
          scheduledDate: "2026-08-15",
        }),
      ])
    );

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay="2026-08-15"
        viewMode="week"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={vi.fn()}
        onPlannerMutation={vi.fn()}
      />
    );

    expect(await screen.findByTestId("week-agenda")).toBeInTheDocument();
    expect(document.querySelector("[data-calendar-week-agenda='true']")).toBeInstanceOf(
      HTMLElement
    );
    expect(document.querySelector("[data-calendar-week-row='true']")).toBeInstanceOf(
      HTMLElement
    );
    expect(screen.getByTestId("plan-desktop-day-pane")).toBeInTheDocument();
    expect(screen.getByTestId("plan-desktop-day-pane")).not.toHaveClass("hidden");
    expect(
      screen.getByRole("group", { name: "Plan view mode" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Agenda" })).toBeInTheDocument();
  });

  it("keeps week view when a desktop agenda row is selected", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: String(query).includes("min-width: 768px"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }))
    );
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:1",
          scheduledDate: "2026-08-15",
        }),
      ])
    );
    const onSelectedDayChange = vi.fn();

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay="2026-08-15"
        viewMode="week"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={onSelectedDayChange}
        onPlannerMutation={vi.fn()}
      />
    );

    expect(await screen.findByTestId("week-agenda")).toBeInTheDocument();
    const nextDayRow = document.querySelector(
      '[data-calendar-week-row="true"][data-day="2026-08-16"] button[data-day-cell="true"]'
    );
    expect(nextDayRow).toBeInstanceOf(HTMLElement);
    fireEvent.click(nextDayRow as HTMLElement);

    expect(onSelectedDayChange).toHaveBeenCalledWith("2026-08-16", "push", "week");
    fireEvent.click(await screen.findByTestId("planner-today-shortcut"));
    expect(onSelectedDayChange).toHaveBeenCalledWith("2026-08-15", "replace", "week", {
      alignMonth: true,
    });
    vi.unstubAllGlobals();
  });

  it("selects a week agenda item on an unfocused day in one click", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:1",
          label: "Goal A",
          scheduledDate: "2026-08-16",
        }),
      ])
    );
    const onSelectedDayChange = vi.fn();

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay="2026-08-15"
        viewMode="week"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={onSelectedDayChange}
        onPlannerMutation={vi.fn()}
      />
    );

    expect(await screen.findByTestId("week-agenda")).toBeInTheDocument();
    const entry = await waitFor(() => {
      const match = document.querySelector(
        '[data-calendar-week-row="true"][data-day="2026-08-16"] [data-calendar-day-entry="true"]'
      );
      if (!(match instanceof HTMLElement)) {
        throw new Error("Expected a week agenda entry for 2026-08-16.");
      }
      return match;
    });

    fireEvent.click(entry);

    expect(onSelectedDayChange).toHaveBeenCalledWith("2026-08-16", "push", "week");
    expect(
      await screen.findByRole("region", { name: "Edit planned session" })
    ).toBeInTheDocument();
  });

  it("selects a week agenda item on the already focused day", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:1",
          label: "Goal A",
          scheduledDate: "2026-08-15",
        }),
      ])
    );

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay="2026-08-15"
        viewMode="week"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={vi.fn()}
        onPlannerMutation={vi.fn()}
      />
    );

    expect(await screen.findByTestId("week-agenda")).toBeInTheDocument();
    const entry = await waitFor(() => {
      const match = document.querySelector(
        '[data-calendar-week-row="true"][data-day="2026-08-15"] [data-calendar-day-entry="true"]'
      );
      if (!(match instanceof HTMLElement)) {
        throw new Error("Expected a week agenda entry for 2026-08-15.");
      }
      return match;
    });

    fireEvent.click(entry);

    expect(
      await screen.findByRole("region", { name: "Edit planned session" })
    ).toBeInTheDocument();
  });

  it("selects a month grid item on an unfocused day in one click", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:1",
          label: "Goal A",
          scheduledDate: "2026-08-31",
        }),
      ])
    );
    const onSelectedDayChange = vi.fn();

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay="2026-08-15"
        viewMode="month"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={onSelectedDayChange}
        onPlannerMutation={vi.fn()}
      />
    );

    const entry = await waitFor(() => {
      const match = document.querySelector(
        '[data-day-cell="true"][data-day="2026-08-31"] [data-calendar-day-entry="true"]'
      );
      if (!(match instanceof HTMLElement)) {
        throw new Error("Expected a month grid entry for 2026-08-31.");
      }
      return match;
    });

    fireEvent.click(entry);

    expect(onSelectedDayChange).toHaveBeenCalledWith("2026-08-31", "push", "month");
    expect(
      await screen.findByRole("region", { name: "Edit planned session" })
    ).toBeInTheDocument();
  });

  it("moves month goal focus when selecting an item on another day", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:1",
          label: "Goal A",
          scheduledDate: "2026-08-15",
        }),
        unit({
          originalGoalId: "goal-b",
          unitKey: "total:1",
          label: "Goal B",
          scheduledDate: "2026-08-20",
        }),
      ])
    );

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay="2026-08-15"
        viewMode="month"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={vi.fn()}
        onPlannerMutation={vi.fn()}
      />
    );

    const entryOn = (day: string) =>
      waitFor(() => {
        const match = document.querySelector(
          `[data-day-cell="true"][data-day="${day}"] [data-calendar-day-entry="true"]`
        );
        if (!(match instanceof HTMLElement)) {
          throw new Error(`Expected a month grid entry for ${day}.`);
        }
        return match;
      });

    // Selecting Goal A on the focused day dims every other goal in the grid.
    fireEvent.click(await entryOn("2026-08-15"));
    await waitFor(async () => {
      expect((await entryOn("2026-08-20")).className).toContain("opacity-45");
    });

    fireEvent.click(await entryOn("2026-08-20"));
    await waitFor(async () => {
      expect((await entryOn("2026-08-15")).className).toContain("opacity-45");
    });
    expect((await entryOn("2026-08-20")).className).not.toContain("opacity-45");
    expect(
      await screen.findByRole("region", { name: "Edit planned session" })
    ).toBeInTheDocument();
  });

  it("jumps to today when the Today shortcut is available in month view", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:1",
          scheduledDate: "2026-08-20",
        }),
      ])
    );
    const onSelectedDayChange = vi.fn();

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay="2026-08-20"
        viewMode="month"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={onSelectedDayChange}
        onPlannerMutation={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith(
        "/api/planner/prepare",
        expect.any(Object)
      );
    });

    fireEvent.click(screen.getByTestId("planner-today-shortcut"));

    expect(onSelectedDayChange).toHaveBeenCalledWith("2026-08-15", "replace", "month", {
      alignMonth: true,
    });
  });

  it("keeps the selected day when switching from month to week view", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:1",
          scheduledDate: "2026-08-20",
        }),
      ])
    );
    const onSelectedDayChange = vi.fn();

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay="2026-08-20"
        viewMode="month"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={onSelectedDayChange}
        onPlannerMutation={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith(
        "/api/planner/prepare",
        expect.any(Object)
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Week" }));

    expect(onSelectedDayChange).toHaveBeenCalledWith("2026-08-20", "push", "week", {
      alignMonth: true,
    });
  });

  it("keeps month weekday labels and tiles on one horizontal track", async () => {
    postJsonMock.mockResolvedValue(buildContext([]));

    const { container } = render(
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

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith(
        "/api/planner/prepare",
        expect.any(Object)
      );
    });

    const horizontalViewport = container.querySelector<HTMLElement>(
      '[data-calendar-horizontal-viewport="true"]'
    );
    const sharedTrack = container.querySelector<HTMLElement>(
      '[data-calendar-grid-track="true"]'
    );
    const weekdayGrid = container.querySelector<HTMLElement>(
      '[data-calendar-weekday-grid="true"]'
    );
    const monthVerticalViewport = container.querySelector<HTMLElement>(
      '[data-calendar-month-vertical-viewport="true"]'
    );

    expect(horizontalViewport).not.toBeNull();
    expect(sharedTrack?.parentElement).toBe(horizontalViewport);
    expect(weekdayGrid?.parentElement).toBe(sharedTrack);
    expect(monthVerticalViewport?.parentElement).toBe(sharedTrack);
    expect(monthVerticalViewport).toHaveClass(calendarStyles.monthGridScrollViewport);
    expect(weekdayGrid).toHaveStyle({
      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    });
    expect(monthVerticalViewport?.firstElementChild).toHaveStyle({
      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    });
  });

  it("shows Today when the checklist day is not today and jumps back on click", async () => {
    postJsonMock.mockResolvedValue(buildContext([]));
    const onSelectedDayChange = vi.fn();

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay="2026-08-31"
        viewMode="month"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={onSelectedDayChange}
        onPlannerMutation={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith(
        "/api/planner/prepare",
        expect.any(Object)
      );
    });

    fireEvent.click(await screen.findByTestId("planner-today-shortcut"));
    expect(onSelectedDayChange).toHaveBeenCalledWith("2026-08-15", "replace", "month", {
      alignMonth: true,
    });
  });

  it("scrolls the shared month viewport to today's column", async () => {
    postJsonMock.mockResolvedValue(buildContext([]));
    let horizontalViewport: HTMLElement | null = null;
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        if (this.dataset.calendarHorizontalViewport === "true") {
          return buildDomRect({ width: 300, height: 544 });
        }
        if (this.dataset.calendarMonthVerticalViewport === "true") {
          return buildDomRect({ top: 100, width: 800, height: 544 });
        }
        if (this.dataset.day === "2026-08-10") {
          return buildDomRect({
            top: 100,
            left: -(horizontalViewport?.scrollLeft ?? 0),
          });
        }
        if (this.dataset.day === "2026-08-15") {
          return buildDomRect({
            top: 100,
            left: 500 - (horizontalViewport?.scrollLeft ?? 0),
          });
        }
        return buildDomRect();
      });
    const clientWidthSpy = vi
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockImplementation(function (this: HTMLElement) {
        return this.dataset.calendarHorizontalViewport === "true" ? 300 : 800;
      });
    const scrollWidthSpy = vi
      .spyOn(HTMLElement.prototype, "scrollWidth", "get")
      .mockImplementation(function (this: HTMLElement) {
        return this.dataset.calendarHorizontalViewport === "true" ? 900 : 800;
      });
    const originalScrollTo = HTMLElement.prototype.scrollTo;
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      writable: true,
      value(this: HTMLElement, options: ScrollToOptions) {
        if (options.top !== undefined) {
          this.scrollTop = options.top;
        }
        if (options.left !== undefined) {
          this.scrollLeft = options.left;
        }
      },
    });
    const animationFrameSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });

    try {
      const { container } = render(
        <CalendarSurface
          activeTab="calendar"
          month="2026-08"
          selectedDay="2026-08-31"
          viewMode="month"
          onMonthChange={vi.fn()}
          onViewModeChange={vi.fn()}
          onSelectedDayChange={vi.fn()}
          onPlannerMutation={vi.fn()}
        />
      );

      horizontalViewport = container.querySelector<HTMLElement>(
        '[data-calendar-horizontal-viewport="true"]'
      );
      const verticalViewport = container.querySelector<HTMLElement>(
        '[data-calendar-month-vertical-viewport="true"]'
      );
      expect(horizontalViewport).not.toBeNull();
      expect(verticalViewport).not.toBeNull();

      if (horizontalViewport) {
        horizontalViewport.scrollLeft = 0;
        fireEvent.scroll(horizontalViewport);
      }

      const todayButton = await screen.findByTestId("planner-today-shortcut");
      fireEvent.click(todayButton);

      await waitFor(() => {
        expect(horizontalViewport?.scrollLeft).toBe(400);
      });
      expect(verticalViewport?.scrollLeft).toBe(0);
    } finally {
      animationFrameSpy.mockRestore();
      if (originalScrollTo) {
        HTMLElement.prototype.scrollTo = originalScrollTo;
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
      }
      scrollWidthSpy.mockRestore();
      clientWidthSpy.mockRestore();
      rectSpy.mockRestore();
    }
  });

  it("releases the Today alignment target after the month grid is positioned", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-08-15T12:00:00.000Z"));
    postJsonMock.mockResolvedValue(buildContext([]));
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        if (this.dataset.calendarMonthVerticalViewport === "true") {
          return buildDomRect({ top: 100, width: 800, height: 544 });
        }
        if (this.dataset.calendarHorizontalViewport === "true") {
          return buildDomRect({ width: 300, height: 544 });
        }
        if (this.dataset.day === "2026-08-10") {
          return buildDomRect({ top: 300, left: 0 });
        }
        if (this.dataset.day === "2026-08-15") {
          return buildDomRect({ top: 300, left: 500 });
        }
        if (this.dataset.day === "2026-09-14") {
          return buildDomRect({ top: 600, left: 0 });
        }
        if (this.dataset.day === "2026-09-15") {
          return buildDomRect({ top: 600, left: 100 });
        }
        return buildDomRect();
      });
    const originalScrollTo = HTMLElement.prototype.scrollTo;
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      writable: true,
      value(this: HTMLElement, options: ScrollToOptions) {
        if (options.top !== undefined) {
          this.scrollTop = options.top;
        }
        if (options.left !== undefined) {
          this.scrollLeft = options.left;
        }
      },
    });
    const animationFrameSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });

    try {
      const { container, rerender } = render(
        <CalendarSurface
          activeTab="calendar"
          month="2026-10"
          selectedDay="2026-10-15"
          viewMode="month"
          onMonthChange={vi.fn()}
          onViewModeChange={vi.fn()}
          onSelectedDayChange={vi.fn()}
          onPlannerMutation={vi.fn()}
        />
      );

      const todayButton = await screen.findByTestId("planner-today-shortcut");
      await waitFor(() => {
        expect(postJsonMock).toHaveBeenCalledWith(
          "/api/planner/prepare",
          expect.any(Object)
        );
      });
      fireEvent.click(todayButton);

      rerender(
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

      const verticalViewport = container.querySelector<HTMLElement>(
        '[data-calendar-month-vertical-viewport="true"]'
      );
      const horizontalViewport = container.querySelector<HTMLElement>(
        '[data-calendar-horizontal-viewport="true"]'
      );
      expect(verticalViewport).not.toBeNull();
      expect(horizontalViewport).not.toBeNull();
      Object.defineProperties(horizontalViewport as HTMLElement, {
        clientWidth: { configurable: true, value: 300 },
        scrollWidth: { configurable: true, value: 900 },
      });

      await waitFor(() => {
        const viewport = container.querySelector<HTMLElement>(
          '[data-calendar-month-vertical-viewport="true"]'
        );
        expect(
          container.querySelector(
            '[data-day-cell="true"][data-day="2026-08-10"]'
          )
        ).not.toBeNull();
        expect(viewport?.scrollTop).toBe(200);
      });
      if (verticalViewport) {
        verticalViewport.scrollTop = 0;
      }

      rerender(
        <CalendarSurface
          activeTab="calendar"
          month="2026-09"
          selectedDay="2026-09-15"
          viewMode="month"
          onMonthChange={vi.fn()}
          onViewModeChange={vi.fn()}
          onSelectedDayChange={vi.fn()}
          onPlannerMutation={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(verticalViewport?.scrollTop).toBe(500);
      });
    } finally {
      animationFrameSpy.mockRestore();
      if (originalScrollTo) {
        HTMLElement.prototype.scrollTo = originalScrollTo;
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
      }
      rectSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it("keeps the month grid still when a later day is selected for the checklist", async () => {
    postJsonMock.mockResolvedValue(buildContext([]));
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        if (this.dataset.calendarMonthVerticalViewport === "true") {
          return buildDomRect({ top: 100, width: 800, height: 544 });
        }
        if (this.dataset.calendarHorizontalViewport === "true") {
          return buildDomRect({ width: 300, height: 544 });
        }
        if (this.dataset.day === "2026-08-10") {
          return buildDomRect({ top: 100, left: 0 });
        }
        if (this.dataset.day === "2026-08-15") {
          return buildDomRect({ top: 100, left: 500 });
        }
        if (this.dataset.day === "2026-08-31") {
          return buildDomRect({ top: 400, left: 0 });
        }
        return buildDomRect();
      });
    const originalScrollTo = HTMLElement.prototype.scrollTo;
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      writable: true,
      value(this: HTMLElement, options: ScrollToOptions) {
        if (options.top !== undefined) {
          this.scrollTop = options.top;
        }
        if (options.left !== undefined) {
          this.scrollLeft = options.left;
        }
      },
    });
    const animationFrameSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    const onSelectedDayChange = vi.fn();

    try {
      const { container } = render(
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

      const verticalViewport = container.querySelector<HTMLElement>(
        '[data-calendar-month-vertical-viewport="true"]'
      );
      expect(verticalViewport).not.toBeNull();
      await waitFor(() => {
        expect(verticalViewport?.scrollTop).toBe(0);
      });

      const laterDay = document.querySelector(
        '[data-day-cell="true"][data-day="2026-08-31"]'
      );
      expect(laterDay).toBeInstanceOf(HTMLElement);
      fireEvent.click(laterDay as Element);

      expect(onSelectedDayChange).toHaveBeenCalledWith("2026-08-31", "push", "month");
      expect(verticalViewport?.scrollTop).toBe(0);
    } finally {
      animationFrameSpy.mockRestore();
      if (originalScrollTo) {
        HTMLElement.prototype.scrollTo = originalScrollTo;
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
      }
      rectSpy.mockRestore();
    }
  });

  it("filters visible calendar entries by the search query", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:1",
          label: "Goal A",
          scheduledDate: "2026-08-31",
        }),
        unit({
          originalGoalId: "goal-b",
          unitKey: "milestone:2",
          label: "Tempo run 4x800",
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

    expect(await screen.findByText("Goal A")).toBeInTheDocument();
    expect(screen.getByText("Tempo run 4x800")).toBeInTheDocument();

    const searchInput = await screen.findByRole("searchbox", {
      name: /search goals/i,
    });
    expect(screen.getAllByRole("searchbox", { name: /search goals/i })).toHaveLength(1);
    expect(
      within(screen.getByTestId("planner-calendar-toolbar")).getByRole("searchbox", {
        name: /search goals/i,
      })
    ).toBe(searchInput);

    fireEvent.change(searchInput, { target: { value: "goal a" } });
    await waitFor(() => {
      expect(screen.getByText("Goal A")).toBeInTheDocument();
      expect(screen.queryByText("Tempo run 4x800")).not.toBeInTheDocument();
    });

    fireEvent.change(searchInput, { target: { value: "4x800" } });
    await waitFor(() => {
      expect(screen.getByText("Tempo run 4x800")).toBeInTheDocument();
      expect(screen.queryByText("Goal A")).not.toBeInTheDocument();
    });
  });

  it("uses milestone label text for day feed entries when available", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-b",
          unitKey: "milestone:2",
          label: "Tempo run 4x800",
          goalDefaultLocalTime: "07:30",
          scheduledDate: "2026-08-31",
        }),
      ])
    );

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay="2026-08-31"
        viewMode="day"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={vi.fn()}
        onPlannerMutation={vi.fn()}
      />
    );

    const dayPanel = await screen.findByTestId("plan-day-pane");

    await waitFor(() => {
      expect(dayPanel.textContent ?? "").toContain("Tempo run 4x800");
      expect(dayPanel.textContent ?? "").not.toContain("Goal B · 07:30");
    });
    expect(document.querySelector("[data-rolling-week-grid='cells']")).toBeNull();
    expect(dayPanel).toHaveStyle({ viewTransitionName: "plan-day-2026-08-31" });
  });

  it("keeps search and day filters available on day view", async () => {
    postJsonMock.mockResolvedValue(buildContext([]));

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay="2026-08-31"
        viewMode="day"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={vi.fn()}
        onPlannerMutation={vi.fn()}
      />
    );

    expect(await screen.findByRole("searchbox", { name: "Search goals" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(await screen.findByRole("heading", { name: "Day filters" })).toBeInTheDocument();
  });

  it("suppresses default milestone label duplication in month preview and event dialog", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-b",
          unitKey: "milestone:2",
          label: "Milestone 2",
          goalDefaultLocalTime: "07:30",
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

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith(
        "/api/planner/prepare",
        expect.any(Object)
      );
    });

    const dayCell = await waitFor(() => {
      const match = document.querySelector('[data-day-cell="true"][data-day="2026-08-31"]');
      if (!(match instanceof HTMLElement)) {
        throw new Error("Expected calendar day cell for 2026-08-31.");
      }
      return match;
    });

    fireEvent.mouseEnter(dayCell);
    await screen.findByRole(
      "button",
      { name: "Expand day details" },
      { timeout: 2500 }
    );
    const previewPopover = document.querySelector('[data-no-swipe="true"].fixed');
    if (!(previewPopover instanceof HTMLElement)) {
      throw new Error("Expected preview popover element.");
    }

    expect(within(previewPopover).getByText("Goal B · 07:30")).toBeInTheDocument();
    expect(
      within(previewPopover).queryByText("Milestone 2 · 07:30")
    ).not.toBeInTheDocument();
    expect(within(previewPopover).queryByText("Milestone: Milestone 2")).not.toBeInTheDocument();

    fireEvent.click(within(previewPopover).getByText("Goal B · 07:30"));
    const editor = await screen.findByRole("region", {
      name: "Edit planned session",
    });
    expect(
      within(editor).getByRole("heading", { name: "Goal B" })
    ).toBeInTheDocument();
    expect(within(editor).queryByText("Milestone: Milestone 2")).not.toBeInTheDocument();
  });


  it("force-prepares planner context after related tab caches are invalidated", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:1",
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
    await waitFor(() => expect(postJsonMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      invalidatePlannerRelatedTabCaches();
      await Promise.resolve();
    });

    await waitFor(() => expect(postJsonMock).toHaveBeenCalledTimes(2));
    expect(postJsonMock).toHaveBeenLastCalledWith(
      "/api/planner/prepare",
      expect.objectContaining({ scopeMonth: "2026-08" })
    );
  });

  it("renders calendar directly when planner preferences are missing", async () => {
    const context = buildContext([
      unit({
        originalGoalId: "goal-a",
        unitKey: "total:1",
        scheduledDate: "2026-08-31",
      }),
    ]);
    postJsonMock.mockResolvedValue({
      ...context,
      preferences: null,
    });

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-10"
        selectedDay={null}
        viewMode="month"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={vi.fn()}
        onPlannerMutation={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith(
        "/api/planner/prepare",
        expect.any(Object)
      );
    });

    expect(screen.queryByText("Plan setup")).not.toBeInTheDocument();
  });

  it("keeps the centered period and right-aligned calendar actions on one row", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:1",
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

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith(
        "/api/planner/prepare",
        expect.any(Object)
      );
    });

    const expandButton = screen.getByRole("button", { name: "Expand rows" });
    const heading = screen.getByRole("heading", { name: "August 2026" });
    const actionGroup = expandButton.parentElement;

    expect(actionGroup).not.toBeNull();
    expect(actionGroup).toHaveClass("right-0");
    expect(heading).toBeInTheDocument();
    expect(screen.getByTestId("plan-calendar-split")).toHaveClass(
      "md:grid-cols-[minmax(0,var(--plan-split-calendar))_minmax(0,var(--plan-split-pane))]"
    );
    const monthViewport = document.querySelector(
      '[data-calendar-month-vertical-viewport="true"]'
    );
    expect(monthViewport).toHaveClass("max-h-[45rem]");
    expect(monthViewport).toHaveClass(calendarStyles.monthGridScrollViewport);

    fireEvent.click(expandButton);
    expect(screen.getByTestId("plan-calendar-split")).toHaveClass(
      "md:grid-cols-[minmax(0,var(--plan-split-calendar))_minmax(0,var(--plan-split-pane))]"
    );
    expect(monthViewport).not.toHaveClass("max-h-[45rem]");
    expect(monthViewport).not.toHaveClass(calendarStyles.monthGridScrollViewport);
    expect(screen.getByTestId("plan-desktop-day-pane")).toBeInTheDocument();
  });

  it("dismisses unpinned day preview after pointer leaves preview surface", async () => {
    const context = buildContext([
      unit({
        originalGoalId: "goal-a",
        unitKey: "total:1",
        scheduledDate: "2026-08-31",
      }),
    ]);
    postJsonMock.mockResolvedValue(context);

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

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith(
        "/api/planner/prepare",
        expect.any(Object)
      );
    });

    const dayCell = await waitFor(() => {
      const match = document.querySelector('[data-day-cell="true"][data-day="2026-08-31"]');
      if (!(match instanceof HTMLElement)) {
        throw new Error("Expected calendar day cell for 2026-08-31.");
      }
      return match;
    });
    fireEvent.mouseEnter(dayCell);

    const expandAction = await screen.findByRole(
      "button",
      { name: "Expand day details" },
      { timeout: 2500 }
    );
    expect(expandAction).toBeInTheDocument();
    // The popup's pointermove listener registers in a passive effect, which can
    // flush after this lookup resolves; flush it so the events below are heard.
    await act(async () => {});

    const popup = document.querySelector('[data-no-swipe="true"].fixed');
    expect(popup).not.toBeNull();
    fireEvent.mouseEnter(popup as Element);
    fireEvent.mouseLeave(dayCell);

    // Simulates the "mouseleave did not fire on popup" stuck path.
    fireEvent.pointerMove(document.body);

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Expand day details" })
      ).not.toBeInTheDocument();
    }, { timeout: 2500 });
  });

  it("closes hover preview quickly when mouse leaves popup", async () => {
    const context = buildContext([
      unit({
        originalGoalId: "goal-a",
        unitKey: "total:1",
        scheduledDate: "2026-08-31",
      }),
    ]);
    postJsonMock.mockResolvedValue(context);

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

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith(
        "/api/planner/prepare",
        expect.any(Object)
      );
    });

    const dayCell = await waitFor(() => {
      const match = document.querySelector('[data-day-cell="true"][data-day="2026-08-31"]');
      if (!(match instanceof HTMLElement)) {
        throw new Error("Expected calendar day cell for 2026-08-31.");
      }
      return match;
    });
    fireEvent.mouseEnter(dayCell);

    const expandAction = await screen.findByRole(
      "button",
      { name: "Expand day details" },
      { timeout: 2500 }
    );
    expect(expandAction).toBeInTheDocument();

    const popup = document.querySelector('[data-no-swipe="true"].fixed');
    expect(popup).not.toBeNull();
    fireEvent.mouseEnter(popup as Element);
    fireEvent.mouseLeave(popup as Element);

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Expand day details" })
      ).not.toBeInTheDocument();
    }, { timeout: 300 });
  });

  it("opens every item for the previewed day in a focused dialog", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:1",
          scheduledDate: "2026-08-31",
        }),
        unit({
          originalGoalId: "goal-b",
          unitKey: "total:1",
          label: "Secondary",
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

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith(
        "/api/planner/prepare",
        expect.any(Object)
      );
    });

    const dayCell = await waitFor(() => {
      const match = document.querySelector(
        '[data-day-cell="true"][data-day="2026-08-31"]'
      );
      if (!(match instanceof HTMLElement)) {
        throw new Error("Expected calendar day cell for 2026-08-31.");
      }
      return match;
    });
    fireEvent.mouseEnter(dayCell);
    fireEvent.click(
      await screen.findByRole(
        "button",
        { name: "Expand day details" },
        { timeout: 2500 }
      )
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Mon, Aug 31" })
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Goal A")).toBeInTheDocument();
    expect(within(dialog).getByText("Goal B")).toBeInTheDocument();
    expect(onSelectedDayChange).not.toHaveBeenCalled();
  });

  it("raises the planning issues banner for lock conflicts only", async () => {
    const context = buildContext([
      unit({
        originalGoalId: "goal-a",
        unitKey: "total:1",
        scheduledDate: "2026-08-31",
      }),
    ]);
    context.unplaceableGoals = [
      {
        goalId: "goal-a",
        requirementFingerprint: "a".repeat(64),
        policyFingerprint: "p".repeat(64),
        policyRevision: 1,
        lockSignature: "lock-a",
        effectiveSpanEnd: "2027-07-31",
        unplacedCount: 3,
        reason: "invalid_lock",
      },
      {
        goalId: "goal-b",
        requirementFingerprint: "b".repeat(64),
        policyFingerprint: "q".repeat(64),
        policyRevision: 1,
        lockSignature: "lock-b",
        effectiveSpanEnd: "2027-07-31",
        unplacedCount: 1,
        reason: "capacity",
      },
    ];
    postJsonMock.mockResolvedValue(context);

    const expectedSummaries = summarizePlannerGoalUnplaceableRecords({
      records: (context.unplaceableGoals ?? []).filter(
        (record) => record.reason === "invalid_lock"
      ),
      goalTitles: context.goalTitles,
    });
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

    await waitFor(() => {
      expect(
        screen.getByText("1 goal has conflicting locked sessions.")
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Review" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    const dialog = await screen.findByRole("dialog");
    expect(expectedSummaries).toHaveLength(1);
    for (const expected of expectedSummaries) {
      expect(within(dialog).getByText(expected.title)).toBeInTheDocument();
    }
    expect(within(dialog).queryByText(/capacity shortfall/i)).not.toBeInTheDocument();
  });

  it("does not render unplaceable banner when no record is present", async () => {
    const context = buildContext([
      unit({
        originalGoalId: "goal-a",
        unitKey: "total:1",
        scheduledDate: "2026-08-31",
      }),
    ]);
    context.unplaceableGoals = [];
    postJsonMock.mockResolvedValue(context);

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

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalled();
    });
    expect(
      screen.queryByRole("button", { name: "Review" })
    ).not.toBeInTheDocument();
  });

  it("keeps linked-target suppression out of warnings and in plan help", async () => {
    const context = buildContext([
      unit({
        originalGoalId: "goal-a",
        unitKey: "total:1",
        scheduledDate: "2026-08-31",
      }),
    ]);
    if (!context.preview) {
      throw new Error("Expected preview payload.");
    }
    context.links = [
      {
        sourceGoalId: "goal-a",
        targetGoalId: "goal-b",
        targetSuppressionKind: "indefinite",
        targetResumesOn: null,
      },
    ];
    context.preview = {
      ...context.preview,
      eligibility: [
        { goalId: "goal-a", eligible: false, reason: "invalid_date_range" },
        { goalId: "goal-b", eligible: false, reason: "linked_target" },
      ],
    };
    postJsonMock.mockResolvedValue(context);

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

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Review" })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(
        /Goal A: The goal dates are invalid \(start is after end\)\./i
      )
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText(
        /Goal B: Linked main goals may be hidden in months where linked subgoals are still active\./i
      )
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByText(/Linked main goals hidden this month/i)
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByText(
        /Goal B: hidden while linked subgoals are still active/i
      )
    ).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Back to plan" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Open planner help" }));
    const helpDialog = await screen.findByRole("dialog");
    fireEvent.click(within(helpDialog).getByRole("button", { name: "See hidden goals" }));
    expect(
      within(helpDialog).getByText(
        /Goal B: hidden while linked subgoals are still active Linked source goals: Goal A\./i
      )
    ).toBeInTheDocument();
  });

  it("shows linked-target suppression in plan help without warning banner", async () => {
    const context = buildContext([
      unit({
        originalGoalId: "goal-a",
        unitKey: "total:1",
        scheduledDate: "2026-08-31",
      }),
    ]);
    context.links = [
      {
        sourceGoalId: "goal-a",
        targetGoalId: "goal-b",
        targetSuppressionKind: "until",
        targetResumesOn: "2026-09-01",
      },
    ];
    if (!context.preview) {
      throw new Error("Expected preview payload.");
    }
    context.preview = {
      ...context.preview,
      eligibility: [{ goalId: "goal-b", eligible: false, reason: "linked_target" }],
    };
    postJsonMock.mockResolvedValue(context);

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

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalled();
    });
    expect(
      screen.queryByRole("button", { name: "Review" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open planner help" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "See hidden goals" }));
    expect(
      within(dialog).getByText(
        /Goal B: hidden this month, returns Sep 1, 2026 Linked source goals: Goal A\./i
      )
    ).toBeInTheDocument();
  });

  it("hides non-actionable eligibility reasons from the warning detail list", async () => {
    const context = buildContext([
      unit({
        originalGoalId: "goal-a",
        unitKey: "total:1",
        scheduledDate: "2026-08-31",
      }),
    ]);
    if (!context.preview) {
      throw new Error("Expected preview payload.");
    }
    context.preview = {
      ...context.preview,
      eligibility: [
        { goalId: "goal-a", eligible: false, reason: "invalid_date_range" },
        { goalId: "goal-b", eligible: false, reason: "not_owner" },
      ],
    };
    postJsonMock.mockResolvedValue(context);

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

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Review" })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(
        /Goal A: The goal dates are invalid \(start is after end\)\./i
      )
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText(/Goal B: Only goals you own can be planned here\./i)
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByText(/additional goal is excluded automatically/i)
    ).not.toBeInTheDocument();
  });



  it("forces prepare refresh after toggling a lock", async () => {
    const context = buildContext([
      unit({
        originalGoalId: "goal-a",
        unitKey: "total:1",
        scheduledDate: "2026-08-31",
        locked: false,
      }),
    ]);
    postJsonMock.mockImplementation(async (url: string) => {
      if (url === "/api/planner/prepare") {
        return context;
      }
      if (url === "/api/planner/items/lock") {
        return {};
      }
      throw new Error(`Unexpected route ${url}`);
    });

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay="2026-08-31"
        viewMode="day"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={vi.fn()}
        onPlannerMutation={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith(
        "/api/planner/prepare",
        expect.any(Object)
      );
    });

    fireEvent.click(await screen.findByText("Next: Baseline"));
    expect(await screen.findByRole("link", { name: "Edit goal" })).toHaveAttribute(
      "href",
      "/goals/goal-a"
    );
    expect(screen.queryByText("Mark done")).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "not locked to today" }));

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith(
        "/api/planner/items/lock",
        expect.any(Object)
      );
      expect(
        postJsonMock.mock.calls.filter(([url]) => url === "/api/planner/prepare")
          .length
      ).toBe(2);
    });
  });

  it("navigates between open goal instances from the event dialog", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:1",
          label: "First",
          scheduledDate: "2026-08-29",
        }),
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:2",
          label: "Middle",
          scheduledDate: "2026-08-31",
        }),
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:3",
          label: "Last",
          scheduledDate: "2026-09-02",
        }),
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:4",
          label: "Done",
          scheduledDate: "2026-09-04",
          creditState: "completed_as_scheduled",
        }),
        unit({
          originalGoalId: "goal-b",
          unitKey: "total:1",
          label: "Other goal",
          scheduledDate: "2026-08-31",
        }),
      ])
    );
    const onMonthChange = vi.fn();
    const onSelectedDayChange = vi.fn();

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay="2026-08-31"
        viewMode="day"
        onMonthChange={onMonthChange}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={onSelectedDayChange}
        onPlannerMutation={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith(
        "/api/planner/prepare",
        expect.any(Object)
      );
    });

    fireEvent.click(await screen.findByText("Next: Middle"));
    expect(await screen.findByRole("button", { name: "Mon, Aug 31" })).toBeInTheDocument();
    expect(onSelectedDayChange).not.toHaveBeenCalled();
    expect(onMonthChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Go to next open instance" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Wed, Sep 2" })).toBeInTheDocument();
    });
    expect(onSelectedDayChange).toHaveBeenLastCalledWith(
      "2026-09-02",
      "replace",
      "day"
    );

    expect(
      screen.getByRole("button", { name: "Go to next open instance" })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Go to last open instance" })
    ).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Go to first open instance" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sat, Aug 29" })).toBeInTheDocument();
    });
    expect(onSelectedDayChange).toHaveBeenLastCalledWith(
      "2026-08-29",
      "replace",
      "day"
    );
    expect(
      screen.getByRole("button", { name: "Go to first open instance" })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Go to previous open instance" })
    ).toBeDisabled();
  });

  it("shows no move-dialog candidates when no eligible source sessions exist", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:1",
          scheduledDate: "2026-08-31",
          label: "Goal A target",
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

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith(
        "/api/planner/prepare",
        expect.any(Object)
      );
    });

    const dayCell = document.querySelector(
      '[data-day-cell="true"][data-day="2026-08-31"]'
    );
    expect(dayCell).toBeInstanceOf(HTMLElement);
    fireEvent.mouseEnter(dayCell as Element);
    fireEvent.click(
      await screen.findByRole("button", { name: "Move" }, { timeout: 2500 })
    );

    const dialog = await screen.findByRole("dialog", {
      name: /Move session here/i,
    });
    expect(
      within(dialog).getByText("No movable sessions are eligible for this day.")
    ).toBeInTheDocument();
  });

  it("routes day-panel completion toggles through completion mutation callbacks", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:1",
          scheduledDate: "2026-08-15",
          classification: "open",
          creditState: "uncredited",
        }),
      ])
    );

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay="2026-08-15"
        viewMode="day"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={vi.fn()}
        onPlannerMutation={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith(
        "/api/planner/prepare",
        expect.any(Object)
      );
    });

    const toggle = await screen.findByRole("button", { name: "Mark session done" });
    vi.useFakeTimers();
    fireEvent.pointerDown(toggle);
    act(() => {
      vi.advanceTimersByTime(COMPLETION_HOLD_MS);
    });
    vi.useRealTimers();

    await waitFor(() => {
      expect(completionMutationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          goalId: "goal-a",
          date: "2026-08-15",
          desiredFactState: "present",
        })
      );
    });
  });

  it("keeps partner scope read-only for planner day actions", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:1",
          scheduledDate: "2026-08-31",
        }),
      ])
    );

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay="2026-08-31"
        viewMode="day"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={vi.fn()}
        onPlannerMutation={vi.fn()}
        duoScope="partner"
      />
    );

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith(
        "/api/planner/prepare",
        expect.any(Object)
      );
    });

    expect(
      screen.queryByRole("button", { name: "Mark session done" })
    ).not.toBeInTheDocument();
  });

  it("keeps cross-month day scope read-only for planner day actions", async () => {
    postJsonMock.mockResolvedValue(
      buildContext([
        unit({
          originalGoalId: "goal-a",
          unitKey: "total:1",
          scheduledDate: "2026-09-01",
          label: "Outside scope month",
        }),
      ])
    );

    render(
      <CalendarSurface
        activeTab="calendar"
        month="2026-08"
        selectedDay="2026-09-01"
        viewMode="day"
        onMonthChange={vi.fn()}
        onViewModeChange={vi.fn()}
        onSelectedDayChange={vi.fn()}
        onPlannerMutation={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith(
        "/api/planner/prepare",
        expect.any(Object)
      );
    });

    expect(
      screen.queryByRole("button", { name: "Mark session done" })
    ).not.toBeInTheDocument();
  });

  it("aligns the current week using scroll-container coordinates", async () => {
    postJsonMock.mockResolvedValue(buildContext([]));
    const viewportSelector = '[data-calendar-month-vertical-viewport="true"]';
    const rect = (top: number, height = 96, width = 100): DOMRect => ({
      top,
      bottom: top + height,
      left: 0,
      right: width,
      width,
      height,
      x: 0,
      y: top,
      toJSON: () => ({}),
    });
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        if (this.matches(viewportSelector)) {
          return rect(500, 544, 800);
        }
        if (this.dataset.day === "2026-08-10") {
          const container = this.closest<HTMLElement>(viewportSelector);
          return rect(1200 - (container?.scrollTop ?? 0));
        }
        return rect(0);
      });
    const offsetTopSpy = vi
      .spyOn(HTMLElement.prototype, "offsetTop", "get")
      .mockImplementation(function (this: HTMLElement) {
        return this.dataset.day === "2026-08-10" ? 1000 : 0;
      });
    const originalScrollTo = HTMLElement.prototype.scrollTo;
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      writable: true,
      value(this: HTMLElement, options: ScrollToOptions) {
        this.scrollTop = options.top ?? 0;
      },
    });
    const animationFrameSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });

    try {
      const { container } = render(
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

      const scrollContainer = await waitFor(() => {
        const element = container.querySelector<HTMLElement>(viewportSelector);
        expect(element).not.toBeNull();
        return element as HTMLElement;
      });

      await waitFor(() => {
        expect(scrollContainer.scrollTop).toBe(700);
      });
    } finally {
      animationFrameSpy.mockRestore();
      if (originalScrollTo) {
        HTMLElement.prototype.scrollTo = originalScrollTo;
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
      }
      offsetTopSpy.mockRestore();
      rectSpy.mockRestore();
    }
  });
});
