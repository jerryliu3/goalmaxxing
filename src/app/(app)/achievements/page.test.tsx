import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AchievementsPage from "@/app/(app)/achievements/page";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock("@/features/coach/use-coach-page-context", () => ({ useCoachPageContext: vi.fn() }));
vi.mock("@/features/onboarding/tab-onboarding-overlay", () => ({ TabOnboardingOverlay: () => null }));
vi.mock("@/features/social/duo/use-duo-surface", () => ({ useDuoSurface: () => ({
  scope: "me", activePartner: null, viewer: { id: "viewer", userId: "user-1", label: "Me", readOnly: false }, partner: null,
}) }));
vi.mock("@/features/social/duo/duo-lanes", () => ({ DuoLanes: ({ renderLane }: { renderLane: (subject: { id: string; userId: string; readOnly: boolean }) => React.ReactNode }) => <>{renderLane({ id: "viewer", userId: "user-1", readOnly: false })}</> }));
vi.mock("@/features/insights/insights-tab", () => ({ InsightsTab: () => <div data-testid="achievement-progress" /> }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("AchievementsPage", () => {
  it("routes to the achievements destination with its progress sections", () => {
    render(<AchievementsPage />);
    expect(screen.getByRole("heading", { name: "Achieved" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Achieved sections" })).toBeInTheDocument();
    expect(screen.getByTestId("achievement-progress")).toBeInTheDocument();
  });
});
