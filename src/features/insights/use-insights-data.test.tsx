import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyInsights, type InsightsData } from "@/features/insights/fetch-insights-data";
import { useInsightsData } from "@/features/insights/use-insights-data";

const fetchInsightsDataMock = vi.fn();

vi.mock("@/features/insights/fetch-insights-data", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/insights/fetch-insights-data")
  >("@/features/insights/fetch-insights-data");
  return {
    ...actual,
    fetchInsightsData: (...args: unknown[]) => fetchInsightsDataMock(...args),
  };
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "viewer-1" } } }) },
  }),
}));

vi.mock("@/features/social/duo/duo-context", () => ({
  useDuo: () => ({
    viewerUserId: "viewer-1",
    state: { activePartner: null, pendingInvite: null },
  }),
}));

vi.mock("@/lib/navigation/use-app-router", () => ({
  useAppRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function loadedInsights(): InsightsData {
  return { ...emptyInsights, userId: "viewer-1" };
}

const renderedLoading: boolean[] = [];

function Probe() {
  const { loading } = useInsightsData({ selectedYear: "2026" });
  renderedLoading.push(loading);
  return null;
}

describe("useInsightsData", () => {
  beforeEach(() => {
    renderedLoading.length = 0;
    fetchInsightsDataMock.mockReset();
    fetchInsightsDataMock.mockResolvedValue(loadedInsights());
  });

  afterEach(cleanup);

  it("loads and caches insights for later mounts", async () => {
    render(<Probe />);

    await waitFor(() => expect(renderedLoading.at(-1)).toBe(false));
    expect(fetchInsightsDataMock).toHaveBeenCalledTimes(1);
  });

  it("never reads the cache while rendering, so hydration matches the server", async () => {
    render(<Probe />);
    await waitFor(() => expect(renderedLoading.at(-1)).toBe(false));
    cleanup();
    renderedLoading.length = 0;

    // The cache is warm now. The server always renders the loading state, so
    // the first client render has to report loading too.
    render(<Probe />);

    expect(renderedLoading[0]).toBe(true);
    await waitFor(() => expect(renderedLoading.at(-1)).toBe(false));
  });
});
