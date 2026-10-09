import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COMPLETION_HOLD_MS } from "@/components/ui/completion-toggle";
import type { SetupProfileStatus } from "./setup-profile-card";
import { JourneySetupWizard } from "./journey-setup-wizard";

const mocks = vi.hoisted(() => ({ save: vi.fn(), savePreferences: vi.fn(), preferenceError: null as string | null, preferencesLoading: false, profileStatus: "ready" as SetupProfileStatus }));
vi.mock("@/features/onboarding/onboarding-progress-provider", () => ({ useOnboardingProgress: () => ({ progress: { setup_step: 0 }, save: mocks.save }) }));
function PreferencesStepMock({ onProfileStatusChange }: { onProfileStatusChange: (status: SetupProfileStatus) => void }) {
  useEffect(() => { onProfileStatusChange(mocks.profileStatus); }, [onProfileStatusChange]);
  return <p>Preferences controls</p>;
}
vi.mock("./journey-intro-preferences-step", () => ({
  useJourneyIntroPreferences: () => ({ value: { timezone: "UTC" }, loading: mocks.preferencesLoading, error: mocks.preferenceError, reload: vi.fn(), setValue: vi.fn() }),
  JourneyIntroPreferencesStep: PreferencesStepMock,
  saveJourneyIntroPreferences: mocks.savePreferences,
}));
vi.mock("@/features/goals/tempo-goal-card", () => ({ TempoGoalCard: ({ fields }: { fields: { title: string } }) => <p>Goal card: {fields.title}</p> }));
vi.mock("@/features/ux-brand/plaque-motion/earned-ceremony", () => ({ EarnedCeremony: ({ preview, onClose }: { preview: boolean; onClose: () => void }) => <button onClick={onClose}>{preview ? "Return from practice ceremony" : "Real ceremony"}</button> }));

beforeEach(() => { mocks.save.mockResolvedValue({}); mocks.savePreferences.mockResolvedValue(undefined); mocks.preferenceError = null; mocks.preferencesLoading = false; mocks.profileStatus = "ready"; });
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
    vi.useFakeTimers();
    fireEvent.pointerDown(screen.getByRole("button", { name: "Complete the last session" }));
    act(() => { vi.advanceTimersByTime(COMPLETION_HOLD_MS + 900); });
    vi.useRealTimers();
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
  it.each([
    ["preferences", () => { mocks.preferencesLoading = true; }],
    ["the profile card", () => { mocks.profileStatus = "loading"; }],
  ])("shows a loading state instead of a frozen form while %s load", (_source, arrange) => {
    arrange();
    render(<JourneySetupWizard userId="user-1" replay={false} onDone={vi.fn()} onCancelReplay={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading your setup…");
    expect(screen.queryByText("Preferences controls")).not.toBeVisible();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });
  it("keeps Continue disabled while the username is invalid", () => {
    mocks.profileStatus = "invalid";
    render(<JourneySetupWizard userId="user-1" replay={false} onDone={vi.fn()} onCancelReplay={vi.fn()} />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText("Preferences controls")).toBeVisible();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
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
