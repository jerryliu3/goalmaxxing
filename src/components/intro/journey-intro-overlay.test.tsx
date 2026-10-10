import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JourneyIntroOverlay, requestJourneyIntroOpen } from "./journey-intro-overlay";
const mocks = vi.hoisted(() => ({
  progress: { setup_step: 0, completed_at: null as string | null, tours: {} as Record<string, string> },
  save: vi.fn(), push: vi.fn(), loading: false, error: null as string | null, reload: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("next/dynamic", () => ({ default: () => ({ onDone, replay }: { onDone: () => void; replay: boolean }) => <button onClick={onDone}>{replay ? "Finish replay" : "Finish setup"}</button> }));
vi.mock("@/features/onboarding/onboarding-progress-provider", () => ({ useOnboardingProgress: () => mocks }));
vi.mock("@/features/onboarding/tab-onboarding-overlay", () => ({ OnboardingTourBody: ({ onClose }: { onClose: (status: "complete" | "skipped") => void }) => <><button onClick={() => onClose("complete")}>Finish tabs</button><button onClick={() => onClose("skipped")}>Skip tabs</button></> }));
beforeEach(() => {
  mocks.progress = { setup_step: 0, completed_at: null, tours: {} };
  mocks.loading = false; mocks.error = null; mocks.save.mockResolvedValue({});
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe("setup and optional tours", () => {
  it("orders required setup, tab tour, then the optional Agenda tour", async () => {
    render(<JourneyIntroOverlay userId="user-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Finish setup" }));
    fireEvent.click(screen.getByRole("button", { name: "Take tab tour" }));
    fireEvent.click(screen.getByRole("button", { name: "Finish tabs" }));
    fireEvent.click(await screen.findByRole("button", { name: "Take Agenda tour" }));
    expect(mocks.save).toHaveBeenCalledWith({ action: "tour", key: "app.tabs", status: "complete" });
    expect(mocks.push).toHaveBeenCalledWith("/calendar?onboarding=planner.calendar");
  });
  it("keeps completed setup closed and permits Settings replay", async () => {
    mocks.progress.completed_at = "2026-10-08T12:00:00Z";
    mocks.progress.tours["app.tabs"] = "skipped";
    render(<JourneyIntroOverlay userId="user-1" />);
    expect(screen.queryByRole("button", { name: "Finish setup" })).toBeNull();
    act(() => requestJourneyIntroOpen());
    fireEvent.click(await screen.findByRole("button", { name: "Finish replay" }));
    expect(screen.queryByText("Your space is ready.")).toBeNull();
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("persists skipping all tours and keeps save failures retryable", async () => {
    mocks.progress.completed_at = "2026-10-08T12:00:00Z";
    mocks.save.mockRejectedValueOnce(new Error("Offline"));
    render(<JourneyIntroOverlay userId="user-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Skip all tours" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Skip all tours" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(mocks.save).toHaveBeenLastCalledWith({ action: "skip-tours" });
  });
  it("skipping the Agenda invitation does not skip other page guides", async () => {
    mocks.progress.completed_at = "2026-10-08T12:00:00Z";
    render(<JourneyIntroOverlay userId="user-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Take tab tour" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip tabs" }));
    fireEvent.click(await screen.findByRole("button", { name: "Skip Agenda tour" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(mocks.save).toHaveBeenLastCalledWith({ action: "tour", key: "planner.calendar", status: "skipped" });
  });
  it("lets a failed onboarding load release the app without saving completion", async () => {
    mocks.error = "Getting started could not be loaded.";
    const onOpenChange = vi.fn();
    const { rerender } = render(<JourneyIntroOverlay userId="user-1" onOpenChange={onOpenChange} />);
    fireEvent.click(await screen.findByRole("button", { name: "Continue to app" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(mocks.save).not.toHaveBeenCalled();
    rerender(<JourneyIntroOverlay userId="user-1" onOpenChange={onOpenChange} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    act(() => requestJourneyIntroOpen());
    expect(mocks.reload).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("opens requested Settings replay after a successful load retry", async () => {
    mocks.error = "Getting started could not be loaded.";
    mocks.progress.completed_at = "2026-10-08T12:00:00Z";
    mocks.progress.tours["app.tabs"] = "skipped";
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <JourneyIntroOverlay userId="user-1" onOpenChange={onOpenChange} />
    );
    fireEvent.click(await screen.findByRole("button", { name: "Continue to app" }));
    act(() => requestJourneyIntroOpen());
    expect(mocks.reload).toHaveBeenCalledTimes(1);
    mocks.error = null;
    rerender(<JourneyIntroOverlay userId="user-1" onOpenChange={onOpenChange} />);
    fireEvent.click(await screen.findByRole("button", { name: "Finish replay" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("retains Retry when onboarding is unavailable", async () => {
    mocks.error = "Getting started could not be loaded.";
    render(<JourneyIntroOverlay userId="user-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
    expect(mocks.reload).toHaveBeenCalledTimes(1);
    expect(mocks.save).not.toHaveBeenCalled();
  });

});
