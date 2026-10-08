import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COMPLETION_HOLD_MS } from "@/components/ui/completion-toggle";
import { JourneySetupWizard } from "./journey-setup-wizard";

const mocks = vi.hoisted(() => ({ save: vi.fn(), savePreferences: vi.fn(), preferenceError: null as string | null }));
vi.mock("@/features/onboarding/onboarding-progress-provider", () => ({ useOnboardingProgress: () => ({ progress: { setup_step: 0 }, save: mocks.save }) }));
vi.mock("./journey-intro-preferences-step", () => ({
  useJourneyIntroPreferences: () => ({ value: { timezone: "UTC" }, loading: false, error: mocks.preferenceError, reload: vi.fn(), setValue: vi.fn() }),
  JourneyIntroPreferencesStep: () => <p>Preferences controls</p>,
  saveJourneyIntroPreferences: mocks.savePreferences,
}));
vi.mock("@/features/goals/tempo-goal-card", () => ({ TempoGoalCard: ({ fields }: { fields: { title: string } }) => <p>Goal card: {fields.title}</p> }));
vi.mock("@/features/ux-brand/plaque-motion/earned-ceremony", () => ({ EarnedCeremony: ({ preview, onClose }: { preview: boolean; onClose: () => void }) => <button onClick={onClose}>{preview ? "Return from practice ceremony" : "Real ceremony"}</button> }));

beforeEach(() => { mocks.save.mockResolvedValue({}); mocks.savePreferences.mockResolvedValue(undefined); mocks.preferenceError = null; });
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers(); });

describe("required setup practice", () => {
  it("requires the hold, a saved move, and a practice ceremony before Done", async () => {
    const done = vi.fn();
    render(<JourneySetupWizard userId="user-1" replay={false} onDone={done} onCancelReplay={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /skip/i })).toBeNull();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Continue" })); });
    expect(mocks.savePreferences).toHaveBeenCalledWith("user-1", { timezone: "UTC" });
    expect(mocks.save).toHaveBeenLastCalledWith({ action: "advance", step: 1 });
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    vi.useFakeTimers();
    fireEvent.pointerDown(screen.getByRole("button", { name: "Complete practice session" }));
    act(() => { vi.advanceTimersByTime(COMPLETION_HOLD_MS); });
    vi.useRealTimers();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Continue" })); });
    expect(mocks.save).toHaveBeenLastCalledWith({ action: "advance", step: 2 });
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /^Move to / }));
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.queryByRole("button", { name: "Save practice move" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Move to / }));
    fireEvent.click(screen.getByRole("button", { name: "Save practice move" }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Continue" })); });
    expect(mocks.save).toHaveBeenLastCalledWith({ action: "advance", step: 3 });
    expect(screen.getByRole("button", { name: "Done" })).toBeDisabled();
    expect(screen.getByText("Goal card: Make time to move")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Preview ceremony" }));
    fireEvent.click(screen.getByRole("button", { name: "Return from practice ceremony" }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Done" })); });
    expect(mocks.save).toHaveBeenLastCalledWith({ action: "complete" });
    expect(done).toHaveBeenCalledOnce();
  });
  it("keeps the current step open when account persistence fails", async () => {
    mocks.save.mockRejectedValue(new Error("Network down"));
    render(<JourneySetupWizard userId="user-1" replay={false} onDone={vi.fn()} onCancelReplay={vi.fn()} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Continue" })); });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("1 of 4")).toBeInTheDocument();
  });
  it("does not overwrite preferences with defaults when loading failed", () => {
    mocks.preferenceError = "Could not load preferences";
    render(<JourneySetupWizard userId="user-1" replay={false} onDone={vi.fn()} onCancelReplay={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reload preferences" })).toBeInTheDocument();
  });
  it("can close a replay without resetting account progress", () => {
    const close = vi.fn();
    render(<JourneySetupWizard userId="user-1" replay onDone={vi.fn()} onCancelReplay={close} />);
    fireEvent.click(screen.getByRole("button", { name: "Close replay" }));
    expect(close).toHaveBeenCalledOnce();
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
