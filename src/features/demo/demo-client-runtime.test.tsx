import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DemoClientRuntime } from "@/features/demo/demo-client-runtime";
import { resetDemoRuntimeForTests } from "@/features/demo/demo-runtime";

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children, goalSheet }: { children: ReactNode; goalSheet?: ReactNode }) => (
    <div data-testid="demo-app-shell">
      {children}
      {goalSheet}
    </div>
  ),
}));

vi.mock("@/lib/navigation/use-app-router", () => ({
  useAppRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

describe("DemoClientRuntime", () => {
  afterEach(() => {
    cleanup();
    resetDemoRuntimeForTests();
  });

  it("holds children until the client runtime is installed", async () => {
    render(
      <DemoClientRuntime>
        <div>Demo calendar</div>
      </DemoClientRuntime>
    );

    await waitFor(() => {
      expect(screen.getByTestId("demo-app-shell")).toBeTruthy();
    });
    expect(screen.getByText("Demo calendar")).toBeTruthy();
    expect(screen.getByTestId("demo-banner")).toBeTruthy();
  });

  it("keeps the goal sheet inside the demo shell", async () => {
    render(
      <DemoClientRuntime goalSheet={<div>Goal details</div>}>
        <div>Demo goals</div>
      </DemoClientRuntime>
    );

    await waitFor(() => {
      expect(screen.getByText("Goal details")).toBeTruthy();
    });
    expect(screen.getByTestId("demo-app-shell")).toContainElement(screen.getByText("Goal details"));
  });
});
