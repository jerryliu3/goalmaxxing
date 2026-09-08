import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InsightsShell } from "./insights-shell";

const useDuoSurfaceMock = vi.fn();
const insightsTabMock = vi.fn((props: unknown) => (
  <div
    data-testid={`insights-tab-${String(
      (props as { contentMode?: string }).contentMode ?? "full"
    )}`}
  />
));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/social/duo/use-duo-surface", () => ({
  useDuoSurface: (...args: unknown[]) => useDuoSurfaceMock(...args),
}));

vi.mock("@/features/insights/insights-tab", () => ({
  InsightsTab: (props: unknown) => insightsTabMock(props),
}));

describe("InsightsShell", () => {
  beforeEach(() => {
    insightsTabMock.mockClear();
    useDuoSurfaceMock.mockReset();
    useDuoSurfaceMock.mockReturnValue({
      scope: "me",
      activePartner: null,
      viewer: { id: "viewer", label: "Solo", readOnly: false },
      partner: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders one full insights lane outside duo-both scope", () => {
    render(<InsightsShell />);

    expect(screen.getByTestId("insights-tab-full")).toBeInTheDocument();
    expect(insightsTabMock).toHaveBeenCalledTimes(1);
    expect(insightsTabMock.mock.calls[0]?.[0]).toMatchObject({
      readOnly: false,
    });
    expect(screen.queryByRole("button", { name: "Previous period" })).not.toBeInTheDocument();
  });

  it("renders shared tracker above duo lanes of heatmap, goals, and stats", () => {
    useDuoSurfaceMock.mockReturnValue({
      scope: "both",
      activePartner: {
        partnerId: "partner-1",
        partnerUsername: "partner",
        partnerDisplayName: "Partner",
      },
      viewer: { id: "viewer", label: "Solo", readOnly: false },
      partner: {
        id: "partner",
        label: "Partner",
        userId: "partner-1",
        readOnly: true,
      },
    });

    render(<InsightsShell />);

    expect(insightsTabMock).toHaveBeenCalledTimes(3);
    expect(insightsTabMock.mock.calls[0]?.[0]).toMatchObject({
      contentMode: "goal-stats-only",
    });
    expect(insightsTabMock.mock.calls[1]?.[0]).toMatchObject({
      contentMode: "lane",
      readOnly: false,
    });
    expect(insightsTabMock.mock.calls[2]?.[0]).toMatchObject({
      contentMode: "lane",
      readOnly: true,
    });
    const tracker = screen.getByTestId("insights-tab-goal-stats-only");
    const lanes = screen.getByTestId("duo-lanes-scroll");
    expect(tracker.compareDocumentPosition(lanes) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(screen.queryByTestId("insights-tab-goals-only")).not.toBeInTheDocument();
  });
});
