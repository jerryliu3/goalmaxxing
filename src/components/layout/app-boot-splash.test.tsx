import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  APP_BOOT_READY_STORAGE_KEY,
  AppBootSplash,
} from "@/components/layout/app-boot-splash";

const getJsonMock = vi.fn();

vi.mock("@/lib/api/client", () => ({
  getJson: (...args: unknown[]) => getJsonMock(...args),
}));

describe("AppBootSplash", () => {
  afterEach(() => {
    window.sessionStorage.clear();
    getJsonMock.mockReset();
  });

  it("stays hidden after the boot session is already ready", async () => {
    window.sessionStorage.setItem(APP_BOOT_READY_STORAGE_KEY, "1");
    render(<AppBootSplash />);
    await waitFor(() => {
      expect(screen.queryByTestId("app-boot-splash")).not.toBeInTheDocument();
    });
    expect(getJsonMock).not.toHaveBeenCalled();
  });

  it("shows a branded climb until planner context loads", async () => {
    let resolveContext: ((value: unknown) => void) | undefined;
    getJsonMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveContext = resolve;
        })
    );
    render(<AppBootSplash />);
    expect(await screen.findByTestId("app-boot-splash")).toBeInTheDocument();
    expect(screen.getByTestId("app-boot-climb")).toBeInTheDocument();
    expect(screen.getByText("Goalmaxxing")).toBeInTheDocument();
    expect(screen.getByText("Preparing your plan…")).toBeInTheDocument();
    resolveContext?.({ preferences: { timezone: "UTC" } });
    await waitFor(() => {
      expect(screen.queryByTestId("app-boot-splash")).not.toBeInTheDocument();
    });
    expect(window.sessionStorage.getItem(APP_BOOT_READY_STORAGE_KEY)).toBe("1");
  });
});
