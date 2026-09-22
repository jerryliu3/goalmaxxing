import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CalendarSurfaceProps } from "@/features/planner/calendar-surface.types";
import { CalendarPageShell } from "@/features/planner/calendar-page-shell";
import { resetRememberedCalendarViewModeForTests } from "@/lib/planner/calendar-view-memory";

const mocks = vi.hoisted(() => ({
  applySearchParams: vi.fn(),
  latestSurfaceProps: null as CalendarSurfaceProps | null,
  overlayArgs: null as null | {
    enabled: boolean;
    partnerId: string | null | undefined;
    month: string | null;
  },
  pathname: "/calendar",
  search: "",
  duo: {
    scope: "both" as const,
    activePartner: { partnerId: "partner-1" },
    viewer: { id: "viewer" as const, label: "Alice", userId: "viewer-1", readOnly: false },
    partner: { id: "partner" as const, label: "Alex", userId: "partner-1", readOnly: true },
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useSearchParams: () => new URLSearchParams(mocks.search),
}));

vi.mock("@/features/planner/calendar-surface", () => ({
  CalendarSurface: (props: CalendarSurfaceProps) => {
    mocks.latestSurfaceProps = props;
    return <div data-testid="calendar-surface" />;
  },
}));

vi.mock("@/features/social/duo/use-duo-surface", () => ({
  useDuoSurface: () => mocks.duo,
}));

vi.mock("@/features/planner/use-partner-completion-overlay", () => ({
  usePartnerCompletionOverlay: (args: typeof mocks.overlayArgs) => {
    mocks.overlayArgs = args;
    return {
      markersByDate: new Map(),
      error: null,
    };
  },
}));

vi.mock("@/lib/navigation/use-client-search-params-updater", () => ({
  useClientSearchParamsUpdater: () => ({
    applySearchParams: mocks.applySearchParams,
  }),
}));

describe("CalendarPageShell", () => {
  beforeEach(() => {
    resetRememberedCalendarViewModeForTests();
    mocks.applySearchParams.mockReset();
    mocks.applySearchParams.mockImplementation((update, mode) => {
      const params = new URLSearchParams(mocks.search);
      update(params);
      return { mode, params };
    });
    mocks.latestSurfaceProps = null;
    mocks.overlayArgs = null;
    mocks.pathname = "/calendar";
    mocks.search = "view=month&month=2026-08&day=2026-08-12";
    mocks.duo = {
      scope: "both",
      activePartner: { partnerId: "partner-1" },
      viewer: { id: "viewer", label: "Alice", userId: "viewer-1", readOnly: false },
      partner: { id: "partner", label: "Alex", userId: "partner-1", readOnly: true },
    };
  });

  afterEach(() => {
    cleanup();
    resetRememberedCalendarViewModeForTests();
    vi.useRealTimers();
  });

  it("passes Duo overlay state and the resolved route to the calendar surface", () => {
    render(<CalendarPageShell />);

    expect(mocks.latestSurfaceProps).toMatchObject({
      activeTab: "calendar",
      month: "2026-08",
      selectedDay: "2026-08-12",
      viewMode: "month",
      duoScope: "both",
      partnerLabel: "Alex",
      viewerSubject: {
        id: "viewer",
        label: "Alice",
        userId: "viewer-1",
        readOnly: false,
      },
      partnerSubject: {
        id: "partner",
        label: "Alex",
        userId: "partner-1",
        readOnly: true,
      },
    });
    expect(mocks.overlayArgs).toEqual({
      enabled: true,
      partnerId: "partner-1",
      month: "2026-08",
    });
  });

  it("keeps the viewed month for a month-cell selection unless explicitly aligned", () => {
    render(<CalendarPageShell />);
    const surface = mocks.latestSurfaceProps!;

    act(() => {
      surface.onSelectedDayChange("2026-09-02", "push", "month");
    });
    let call = mocks.applySearchParams.mock.results.at(-1)?.value as {
      mode: string;
      params: URLSearchParams;
    };
    expect(call.mode).toBe("push");
    expect(call.params.toString()).toBe("view=month&month=2026-08&day=2026-09-02");

    act(() => {
      surface.onSelectedDayChange("2026-09-02", "replace", "month", {
        alignMonth: true,
      });
    });
    call = mocks.applySearchParams.mock.results.at(-1)?.value as {
      mode: string;
      params: URLSearchParams;
    };
    expect(call.mode).toBe("replace");
    expect(call.params.toString()).toBe("view=month&month=2026-09&day=2026-09-02");
  });

  it("derives a valid selected day when changing months or views", () => {
    render(<CalendarPageShell />);
    const surface = mocks.latestSurfaceProps!;

    act(() => {
      surface.onMonthChange("2026-10", "push");
    });
    let call = mocks.applySearchParams.mock.results.at(-1)?.value as {
      mode: string;
      params: URLSearchParams;
    };
    expect(call.mode).toBe("push");
    expect(call.params.toString()).toBe("view=month&month=2026-10&day=2026-10-12");

    act(() => {
      surface.onViewModeChange("week", "replace");
    });
    call = mocks.applySearchParams.mock.results.at(-1)?.value as {
      mode: string;
      params: URLSearchParams;
    };
    expect(call.mode).toBe("replace");
    expect(call.params.toString()).toBe("view=week&month=2026-08&day=2026-08-12");
  });

  it("keeps week view when the month window changes", () => {
    mocks.search = "view=week&month=2026-08&day=2026-08-12";
    render(<CalendarPageShell />);

    act(() => {
      mocks.latestSurfaceProps!.onMonthChange("2026-10", "push");
    });

    const call = mocks.applySearchParams.mock.results.at(-1)?.value as {
      mode: string;
      params: URLSearchParams;
    };
    expect(call.params.toString()).toBe("view=week&month=2026-10&day=2026-10-12");
  });

  it("normalizes legacy checklist routes while preserving unrelated query parameters", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-06T12:00:00.000Z"));
    mocks.search = "surface=checklist&tab=today&source=notification";

    render(<CalendarPageShell />);

    const call = mocks.applySearchParams.mock.results.at(-1)?.value as {
      mode: string;
      params: URLSearchParams;
    };
    expect(call.mode).toBe("replace");
    expect(call.params.toString()).toBe(
      "source=notification&view=day&day=2026-09-06&month=2026-09"
    );
  });

  it("falls back to today when a selection is cleared", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-06T12:00:00.000Z"));
    render(<CalendarPageShell />);

    act(() => {
      mocks.latestSurfaceProps!.onSelectedDayChange(null, "replace", "day");
    });

    const call = mocks.applySearchParams.mock.results.at(-1)?.value as {
      mode: string;
      params: URLSearchParams;
    };
    expect(call.mode).toBe("replace");
    expect(call.params.toString()).toBe("view=day&month=2026-09&day=2026-09-06");
  });

  it("defaults a visit without a view to week", () => {
    mocks.search = "";

    render(<CalendarPageShell />);

    expect(mocks.latestSurfaceProps?.viewMode).toBe("week");
  });

  it("restores the last calendar view when the Plan tab omits the query", () => {
    render(<CalendarPageShell />);
    cleanup();
    mocks.search = "";

    render(<CalendarPageShell />);

    expect(mocks.latestSurfaceProps?.viewMode).toBe("month");
  });

  it("keeps the current calendar view when New Goal changes the URL", () => {
    mocks.search = "view=week&month=2026-08&day=2026-08-12";
    const { rerender } = render(<CalendarPageShell />);
    mocks.applySearchParams.mockClear();
    mocks.pathname = "/goals/new";
    mocks.search = "returnTo=%2Fcalendar%3Fview%3Dweek%26month%3D2026-08%26day%3D2026-08-12";

    rerender(<CalendarPageShell />);

    expect(mocks.latestSurfaceProps?.viewMode).toBe("week");
    expect(mocks.latestSurfaceProps?.month).toBe("2026-08");
    expect(mocks.latestSurfaceProps?.selectedDay).toBe("2026-08-12");
    expect(mocks.applySearchParams).not.toHaveBeenCalled();
  });

  it("does not mutate the route or load a partner overlay while inactive", () => {
    render(<CalendarPageShell isActive={false} />);
    const surface = mocks.latestSurfaceProps!;

    act(() => {
      surface.onMonthChange("2026-09", "push");
      surface.onViewModeChange("week", "push");
      surface.onSelectedDayChange("2026-09-02", "push");
    });

    expect(mocks.applySearchParams).not.toHaveBeenCalled();
    expect(mocks.overlayArgs).toEqual({
      enabled: false,
      partnerId: "partner-1",
      month: "2026-08",
    });
  });
});
