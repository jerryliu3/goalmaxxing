import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InsightsShell } from "./insights-shell";
const mocks = vi.hoisted(() => ({ tab: vi.fn() }));
vi.mock("@/features/coach/use-coach-page-context", () => ({ useCoachPageContext: vi.fn() }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock("@/features/onboarding/tab-onboarding-overlay", () => ({ TabOnboardingOverlay: () => null }));
vi.mock("@/features/social/duo/use-duo-surface", () => ({ useDuoSurface: () => ({
  scope: "both", viewer: { id: "viewer", userId: "viewer-1", label: "Me", readOnly: false },
  partner: { id: "partner", userId: "partner-1", label: "Partner", readOnly: true },
}) }));
vi.mock("@/features/insights/insights-tab", () => ({ InsightsTab: (props: unknown) => { mocks.tab(props); return <div data-testid="achievements-lane" />; } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe("Achievements destination", () => {
  it("shows only achievements and the goal library, preserving viewer and partner ownership", () => {
    render(<InsightsShell />);
    expect(screen.getAllByTestId("achievements-lane")).toHaveLength(2);
    expect(mocks.tab).toHaveBeenCalledWith(expect.objectContaining({ subjectUserId: "viewer-1", readOnly: false, sectionIds: ["achievements", "past-goals"], anchorSections: true }));
    expect(mocks.tab).toHaveBeenCalledWith(expect.objectContaining({ subjectUserId: "partner-1", readOnly: true, sectionIds: ["achievements", "past-goals"], anchorSections: false }));
    expect(screen.queryByRole("navigation", { name: /sections/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /history|past goals/i })).toBeNull();
  });
});
