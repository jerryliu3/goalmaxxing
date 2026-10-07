import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { GrowthPage } from "./growth-page";
const presence = vi.hoisted(() => ({ error: null as string | null, reload: vi.fn() }));
const reloadInsights = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock("@/components/layout/app-boot-ready", () => ({ useReportAppSurfaceReady: vi.fn() }));
vi.mock("@/features/coach/use-coach-page-context", () => ({ useCoachPageContext: vi.fn() }));
vi.mock("@/features/onboarding/tab-onboarding-overlay", () => ({ TabOnboardingOverlay: () => null }));
vi.mock("@/features/social/duo/use-duo-surface", () => ({ useDuoSurface: () => ({ scope: "me", viewer: { id: "viewer", userId: "u1", readOnly: false }, partner: null }) }));
vi.mock("@/features/social/duo/duo-lanes", () => ({ DuoLanes: ({ viewer, renderLane }: { viewer: { id: string; userId: string; readOnly: boolean }; renderLane: (subject: unknown) => React.ReactNode }) => <>{renderLane(viewer)}</> }));
vi.mock("@/features/insights/use-insights-data", () => ({ useInsightsData: () => ({ state: {}, loading: false, loadError: null, reload: reloadInsights }) }));
vi.mock("@/features/social/use-own-profile-presence", () => ({ useOwnProfilePresence: () => ({ bundle: null, loading: false, ...presence }) }));
vi.mock("@/features/achievements/use-achievements-showcase", () => ({ useAchievementsShowcase: () => ({ payload: {}, loading: false }) }));
vi.mock("@/features/achievements/showcase", () => ({ AchievementsShowcase: () => <div>Medal shelf</div> }));
vi.mock("@/features/insights/grow-score-trend-chart", () => ({ GrowScoreTrendChart: () => <div>Score chart</div> }));
vi.mock("@/features/insights/insights-tab", () => ({ InsightsTab: ({ sectionIds }: { sectionIds: string[] }) => <div>{sectionIds.join(",")}</div> }));
afterEach(() => { cleanup(); presence.error = null; vi.clearAllMocks(); });
it("gives each section one home in score, medals, tracker, stats order", () => {
  render(<GrowthPage />);
  expect([...screen.getByTestId("growth-page").querySelectorAll("[data-growth-section]")].map(node => node.getAttribute("data-growth-section"))).toEqual(["score", "medals", "tracker", "stats"]);
  expect(screen.getByText("history")).toBeInTheDocument();
  expect(screen.queryByText("Goal library")).toBeNull();
});

it("shows a retry instead of silently rendering an empty score after a profile failure", () => {
  presence.error = "Your score and activity could not be loaded.";
  render(<GrowthPage />);
  expect(screen.getByRole("alert")).toHaveTextContent(presence.error);
  expect(screen.queryByTestId("growth-page")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(presence.reload).toHaveBeenCalledOnce();
  expect(reloadInsights).toHaveBeenCalledOnce();
});
