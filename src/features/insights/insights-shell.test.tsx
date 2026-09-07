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

  it("renders one shared ledger above duo heatmaps", () => {
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
      contentMode: "ledger",
    });
    expect(insightsTabMock.mock.calls[1]?.[0]).toMatchObject({
      contentMode: "overall-only",
      readOnly: false,
    });
    expect(insightsTabMock.mock.calls[2]?.[0]).toMatchObject({
      contentMode: "overall-only",
      readOnly: true,
    });
    expect(screen.getByRole("button", { name: "Previous period" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next period" })).toBeInTheDocument();
    expect(screen.getByLabelText("Choose month and year")).toBeInTheDocument();
  });
});
