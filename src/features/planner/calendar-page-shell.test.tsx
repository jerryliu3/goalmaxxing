import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CalendarSurfaceProps } from "@/features/planner/calendar-surface.types";
import { CalendarPageShell } from "@/features/planner/calendar-page-shell";

const mocks = vi.hoisted(() => ({
  applySearchParams: vi.fn(),
  latestSurfaceProps: null as CalendarSurfaceProps | null,
  mobile: false,
  overlayArgs: null as null | {
    enabled: boolean;
    partnerId: string | null | undefined;
    month: string | null;
  },
  search: "",
  duo: {
    scope: "both" as const,
    activePartner: { partnerId: "partner-1" },
    partner: { label: "Alex" },
  },
}));

vi.mock("next/navigation", () => ({
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

vi.mock("@/lib/ui/use-media-query", () => ({
  useMediaQuery: () => mocks.mobile,
}));

describe("CalendarPageShell", () => {
  beforeEach(() => {
    mocks.applySearchParams.mockReset();
    mocks.applySearchParams.mockImplementation((update, mode) => {
      const params = new URLSearchParams(mocks.search);
      update(params);
      return { mode, params };
    });
    mocks.latestSurfaceProps = null;
    mocks.overlayArgs = null;
    mocks.mobile = false;
    mocks.search = "view=month&month=2026-08&day=2026-08-12";
    mocks.duo = {
      scope: "both",
      activePartner: { partnerId: "partner-1" },
      partner: { label: "Alex" },
    };
  });

  afterEach(() => {
    cleanup();
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

  it("defaults a new mobile visit to week view", () => {
    mocks.mobile = true;
    mocks.search = "";

    render(<CalendarPageShell />);

    expect(mocks.latestSurfaceProps?.viewMode).toBe("week");
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
