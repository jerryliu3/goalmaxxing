import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  APP_BOOT_READY_STORAGE_KEY,
  AppBootSplash,
} from "@/components/layout/app-boot-splash";
import { APP_SURFACE_READY_EVENT } from "@/components/layout/app-boot-preload";

const getJsonMock = vi.fn();

vi.mock("@/lib/api/client", () => ({
  getJson: (...args: unknown[]) => getJsonMock(...args),
}));

vi.mock("@/features/planner/calendar-page-shell", () => ({
  CalendarPageShell: () => null,
}));

describe("AppBootSplash", () => {
  afterEach(() => {
    window.sessionStorage.clear();
    getJsonMock.mockReset();
  });

  it("stays hidden after the boot session is already ready", () => {
    window.sessionStorage.setItem(APP_BOOT_READY_STORAGE_KEY, "1");
    render(<AppBootSplash />);
    expect(screen.queryByTestId("app-boot-splash")).not.toBeInTheDocument();
    expect(getJsonMock).not.toHaveBeenCalled();
  });

  it("shows immediately and stays until the underlying surface is ready", async () => {
    let resolveContext: ((value: unknown) => void) | undefined;
    getJsonMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveContext = resolve;
        })
    );
    render(<AppBootSplash />);
    expect(screen.getByTestId("app-boot-splash")).toBeInTheDocument();
    expect(screen.getByTestId("app-boot-climb")).toBeInTheDocument();
    expect(screen.getByText("Goalmaxxing")).toBeInTheDocument();
    expect(screen.getByText("Preparing your plan…")).toBeInTheDocument();
    resolveContext?.({ preferences: { timezone: "UTC" } });
    await waitFor(() => {
      expect(getJsonMock).toHaveBeenCalled();
    });
    expect(screen.getByTestId("app-boot-splash")).toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new Event(APP_SURFACE_READY_EVENT));
    });
    await waitFor(() => {
      expect(screen.queryByTestId("app-boot-splash")).not.toBeInTheDocument();
    });
    expect(window.sessionStorage.getItem(APP_BOOT_READY_STORAGE_KEY)).toBe(
      String(performance.timeOrigin)
    );
  });
});
